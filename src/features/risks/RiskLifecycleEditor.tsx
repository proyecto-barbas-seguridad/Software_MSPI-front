import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { labels } from '../dashboard/panel';
import type { Company } from '../access/workspace';
import { useControlRead } from '../controls/ControlPanel';
import { acceptanceContext, calendarDay, closingActions, companyDay, transitionLabel, transitions } from './riskLifecycle';
import type { RiskLifecycleMode } from './riskLifecycle';
import { validateRisk, validators } from './risks';
import type { Risk, RiskService } from './risks';
const fields = { width: '100%', minHeight: 44, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
export default function RiskLifecycle({ company, risk, mode, service, scope, onAuthorization, onDirty, onPending, onCancel, onSaved }: {
  company: Company; risk: Risk; mode: RiskLifecycleMode; service: RiskService; scope?: AbortSignal;
  onAuthorization: (error: ApiError) => void; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void; onCancel: () => void; onSaved: () => void;
}) {
  const accepting = mode.kind === 'accept'; const closing = mode.kind === 'transition' && mode.target === 'CERRADO';
  const permitted = risk.estado !== 'CERRADO' && (accepting ? company.roles.includes('AE') && risk.detalle.tratamientoPropuesto === 'ACEPTAR' : company.roles.some(role => role === 'AE' || role === 'GS') && transitions[risk.estado].includes(mode.target));
  const title = accepting ? 'Aprobar aceptación del riesgo' : transitionLabel(risk, mode.target);
  const load = useCallback(async (signal: AbortSignal) => {
    if (!permitted) throw new ApiError(403, 'OPERACION_NO_AUTORIZADA', 'Esta operación no está autorizada para el estado y los roles actuales.');
    try { return { acceptance: accepting ? await acceptanceContext(company.empresaId, risk, service, signal, scope) : undefined, actions: closing ? await closingActions(company.empresaId, risk.riesgoId, service, signal, scope) : [] }; } catch (failure) { if (failure instanceof ApiError || (failure instanceof DOMException && failure.name === 'AbortError')) throw failure; throw new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudieron validar las condiciones del riesgo.'); }
  }, [permitted, accepting, closing, company.empresaId, risk, service, scope]);
  const state = useControlRead(load, { scope, onAuthorization });
  const [error, setError] = useState<ApiError>(); const [pending, setPending] = useState(false); const [blocked, setBlocked] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null); const alive = useRef(false); const busy = useRef(false); const request = useRef<AbortController | undefined>(undefined);
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; request.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  const current = () => alive.current && !scope?.aborted && !request.current?.signal.aborted;
  const open = state.data?.actions.some(action => !['COMPLETADA', 'CANCELADA'].includes(action.estado));
  const cancelled = state.data?.actions.filter(action => action.estado === 'CANCELADA') || [];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || !permitted || scope?.aborted || state.loading || state.error || !state.data || open) return;
    const values = new FormData(event.currentTarget); const reason = String(values.get('motivo') || '').trim(); const date = String(values.get('fecha') || '');
    const explanations = Object.fromEntries(cancelled.map(action => [action.accionId, String(values.get(action.accionId) || '').trim()]));
    if (!reason || reason.length > 2000 || Object.values(explanations).some(value => !value || value.length > 2000)) { setError(new ApiError(400, 'DATOS_INCOMPLETOS', 'Completa la justificación y cada explicación de cancelación (máximo 2000 caracteres).')); return; }
    if (accepting && (!calendarDay(date) || date <= companyDay(company.zonaHoraria))) { setError(new ApiError(400, 'FECHA_REVISION_ACEPTACION_INVALIDA', 'La próxima revisión debe ser una fecha válida posterior al día actual de la empresa.')); return; }
    if (!window.confirm(title + ' · ' + risk.codigo + '. ' + (closing ? 'El cierre conservará estas referencias y no permite reabrir el riesgo. ' : '') + '¿Confirmar?')) return;
    busy.current = true; request.current = new AbortController(); setPending(true); onPending(true); onDirty(true); setError(undefined);
    try {
      if (accepting) {
        const result = await service.accept(company.empresaId, risk.riesgoId, { revisionEsperada: risk.revision, justificacion: reason, fechaProximaRevision: date }, request.current.signal);
        validators.acceptances(result, risk.riesgoId);
        if (result.revisionRiesgo !== risk.revision + 1 || result.estado !== 'VIGENTE' || result.inherenteId !== state.data.acceptance?.base.valoracionId || result.residualId !== state.data.acceptance?.residual.residualId || result.justificacion !== reason || result.fechaProximaRevision !== date) throw new Error('Invalid acceptance response');
      } else {
        const result = validateRisk(await service.transition(company.empresaId, risk.riesgoId, { revisionEsperada: risk.revision, destino: mode.target, motivo: reason, ...(closing ? { accionesCanceladas: explanations } : {}) }, request.current.signal), risk.riesgoId);
        if (result.revision !== risk.revision + 1 || result.codigo !== risk.codigo || result.estado !== mode.target || (mode.target === 'EN_ANALISIS' && (!result.requiereRevision || result.motivoRevision !== reason)) || (closing && (!result.cierre || result.cierre.justificacion !== reason || result.cierre.inherenteId !== risk.inherenteVigenteId || Object.keys(result.cierre.accionesCanceladas).length !== cancelled.length || cancelled.some(action => result.cierre!.accionesCanceladas[action.accionId] !== explanations[action.accionId])))) throw new Error('Invalid transition response');
      }
      if (current()) { onDirty(false); onSaved(); }
    } catch (failure) {
      if (!current()) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el resultado. Consulta el riesgo antes de otra escritura.');
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem); if ([0, 404, 409].includes(problem.status) || problem.status >= 500) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  return <Box component="form" aria-label={title} onSubmit={submit} onChange={() => onDirty(true)} aria-busy={pending || state.loading}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" ref={heading} tabIndex={-1}>{title}</Typography><Typography>{risk.codigo} · Revisión {risk.revision} · Estado actual: {labels[risk.estado] || risk.estado}</Typography>
    <Typography>{accepting ? 'AE aprueba la aceptación sobre las valoraciones vigentes. Esta decisión no cambia el estado del riesgo.' : closing ? 'El cierre es definitivo. Requiere valoraciones vigentes, ausencia de borradores pendientes y acciones terminadas o canceladas con justificación. El servidor comprueba todas las condiciones al guardar.' : mode.target === 'EN_ANALISIS' ? 'Volver a análisis cambia el contexto y exige revisar las valoraciones anteriores.' : 'El servidor verifica tratamiento, valoraciones, acciones y aceptación aplicable antes de autorizar la transición.'}</Typography>
    {state.loading && <Typography role="status">Consultando condiciones del riesgo…</Typography>}
    {(error || state.error) && <Alert severity="error">{(error || state.error)!.status === 404 ? 'El riesgo o recurso no está disponible en esta empresa.' : (error || state.error)!.message}{(error || state.error)!.correlationId && ` Referencia de soporte: ${(error || state.error)!.correlationId}`}</Alert>}
    {error?.fields.map((field, index) => <Typography role="alert" color="error" key={index}>{field.field}: {field.message}</Typography>)}
    {error?.retryAfter !== undefined && <Typography>Espera indicada por el servidor: {error.retryAfter} segundos.</Typography>}
    {blocked && <Alert severity="warning">El estado cambió o el resultado puede haberse guardado. No se reenviará automáticamente. Conserva el texto hasta decidir descartar y consultar el servidor.</Alert>}
    {state.data?.acceptance && <Typography>Inherente vigente: {state.data.acceptance.base.valoracionId} · {state.data.acceptance.base.nivel}. Residual vigente: {state.data.acceptance.residual.residualId} · {state.data.acceptance.residual.nivel}.</Typography>}
    {closing && state.data && <Stack spacing={1}><Typography>Acciones vinculadas consultadas: {state.data.actions.length}</Typography>{state.data.actions.map(action => <Typography key={action.accionId}>{action.codigo} · {labels[action.estado] || action.estado}</Typography>)}{open && <Alert severity="warning">Hay acciones abiertas. Completa su recorrido autorizado antes de cerrar el riesgo.</Alert>}<Typography>Las explicaciones de este cierre no sustituyen el motivo original de cancelación. Aquí no se aprueban ni cancelan tareas.</Typography></Stack>}
    <Box component="fieldset" disabled={pending || blocked || state.loading || Boolean(state.error) || !permitted} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={2}>
      <Typography component="label" htmlFor="lifecycle-reason">Justificación *</Typography><Box component="textarea" id="lifecycle-reason" name="motivo" required rows={4} maxLength={2000} sx={fields} />
      {accepting && <><Typography component="label" htmlFor="acceptance-date">Próxima revisión *</Typography><Box component="input" type="date" id="acceptance-date" name="fecha" required sx={fields} /><Typography>Fecha actual de la empresa: {companyDay(company.zonaHoraria)} · {company.zonaHoraria}. El servidor confirma la fecha al guardar.</Typography></>}
      {cancelled.map(action => <Stack spacing={1} key={action.accionId}><Typography component="label" htmlFor={'cancel-' + action.accionId}>Explicación del cierre para {action.codigo} *</Typography><Box component="textarea" id={'cancel-' + action.accionId} name={action.accionId} required rows={3} maxLength={2000} sx={fields} /></Stack>)}
    </Stack></Box>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked || state.loading || Boolean(state.error) || !permitted || Boolean(open)}>{pending ? 'Guardando…' : title}</Button><Button onClick={onCancel}>Cancelar y volver</Button>
      {(blocked || state.error) && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultará el estado del servidor. ¿Continuar?')) { onDirty(false); onSaved(); } }}>Descartar formulario y consultar estado</Button>}
    </Stack>
  </Stack></Box>;
}
