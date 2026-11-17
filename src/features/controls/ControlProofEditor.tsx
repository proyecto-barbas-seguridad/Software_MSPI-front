import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { calendarDay, companyDay } from '../../shared/date/companyDay';
import { capabilities } from '../access/workspace';
import type { Company } from '../access/workspace';
import { ControlError, ControlPager, useControlRead } from './ControlPanel';
import { validateControl, validateEvidence, validatePage, validateVerification } from './controls';
import type { Control, ControlService, Evidence } from './controls';
export type ProofMode = 'apply' | 'verify';
const fields = { width: '100%', minHeight: 44, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
export async function usedVerificationEvidence(company: string, control: Control, service: ControlService, signal: AbortSignal, scope?: AbortSignal) {
  const used = new Set<string>(); const seen = new Set<string>();
  for (let page = 0; ; page++) {
    if (signal.aborted || scope?.aborted) throw new DOMException('Cancelada', 'AbortError');
    const data = validatePage(await service.verifications(company, control.implementacionId, control.versionActual.versionId, page, signal), page, item => validateVerification(item, control.versionActual.versionId));
    if (signal.aborted || scope?.aborted) throw new DOMException('Cancelada', 'AbortError');
    for (const item of data.elementos) { if (seen.has(item.verificacionId)) throw new ApiError(409, 'HISTORIAL_CAMBIADO', 'El historial cambió durante la consulta. Actualiza la ficha.'); seen.add(item.verificacionId); if (item.revisionImplementacion > control.revision) throw new ApiError(409, 'REVISION_DESACTUALIZADA', 'La implementación cambió durante la consulta. Actualiza la ficha.'); used.add(item.evidenciaId); }
    if (!data.hayMas) return used;
  }
}
export default function ControlProofEditor({ company, control, mode, service, scope, onAuthorization, onDirty, onPending, onCancel, onSaved }: {
  company: Company; control: Control; mode: ProofMode; service: ControlService; scope?: AbortSignal;
  onAuthorization: (error: ApiError) => void; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void; onCancel: () => void; onSaved: () => void;
}) {
  const applying = mode === 'apply'; const title = applying ? 'Confirmar aplicación' : 'Registrar verificación';
  const permitted = capabilities(company).write && control.estado === (applying ? 'EN_IMPLEMENTACION' : 'IMPLEMENTADO');
  const [page, setPage] = useState(0); const [selected, setSelected] = useState<Evidence>(); const [rejected, setRejected] = useState<string>();
  const [error, setError] = useState<ApiError>(); const [pending, setPending] = useState(false); const [blocked, setBlocked] = useState(false);
  const load = useCallback(async (signal: AbortSignal) => validatePage(await service.evidence(company.empresaId, control.implementacionId, control.versionActual.versionId, page, signal), page, validateEvidence), [company.empresaId, control.implementacionId, control.versionActual.versionId, page, service]);
  const prepare = useCallback((signal: AbortSignal) => applying ? Promise.resolve(new Set<string>()) : usedVerificationEvidence(company.empresaId, control, service, signal, scope), [applying, company.empresaId, control, service, scope]);
  const evidence = useControlRead(load, { scope, onAuthorization }); const history = useControlRead(prepare, { scope, onAuthorization });
  const heading = useRef<HTMLHeadingElement>(null); const alive = useRef(false); const busy = useRef(false); const request = useRef<AbortController | undefined>(undefined);
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; request.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  const current = () => alive.current && !scope?.aborted && !request.current?.signal.aborted;
  const used = (item: Evidence) => history.data?.has(item.evidenciaId) || rejected === item.evidenciaId;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || !permitted || scope?.aborted || history.loading || history.error || evidence.loading || evidence.error) return;
    const values = new FormData(event.currentTarget); const text = (name: string) => String(values.get(name) || '').trim(); const day = text('fecha');
    const total = text('criteriosEvaluados'); const met = text('criteriosCumplidos'); const proof = text('prueba'); const rationale = text('fundamento');
    if (!selected || used(selected)) { setError(new ApiError(400, 'EVIDENCIA_REQUERIDA', applying ? 'Selecciona una evidencia disponible de esta versión.' : 'Selecciona una evidencia de esta versión que no haya sido utilizada en una verificación anterior.')); return; }
    if (!calendarDay(day) || (applying ? day > companyDay(company.zonaHoraria) : day <= companyDay(company.zonaHoraria))) { setError(new ApiError(400, 'FECHA_CONTROL_INVALIDA', applying ? 'La fecha de aplicación no puede ser futura.' : 'La próxima revisión debe ser posterior al día actual de la empresa.')); return; }
    if (!applying && (!proof || !rationale || !/^\d+$/.test(total) || !/^\d+$/.test(met) || !Number.isSafeInteger(Number(total)) || !Number.isSafeInteger(Number(met)) || Number(total) < 1 || Number(total) > 2147483647 || Number(met) > Number(total))) { setError(new ApiError(400, 'CRITERIOS_VERIFICACION_INVALIDOS', 'Describe la prueba y su fundamento. Indica al menos un criterio evaluado y entre cero y el total de criterios cumplidos.')); return; }
    if (!window.confirm(title + ' · Versión ' + control.versionActual.numero + '. ' + (applying ? 'Aplicar no acredita efectividad. ' : 'Se conservará la verificación y el servidor determinará el resultado. ') + '¿Confirmar?')) return;
    busy.current = true; request.current = new AbortController(); setPending(true); onPending(true); onDirty(true); setError(undefined);
    try {
      if (applying) {
        const result = validateControl(await service.apply(company.empresaId, control.implementacionId, { revisionEsperada: control.revision, fechaAplicacion: day, evidenciaId: selected.evidenciaId }, request.current.signal), control.implementacionId);
        const version = result.versionActual;
        if (result.revision !== control.revision + 1 || result.estado !== 'IMPLEMENTADO' || result.versionCatalogoId !== control.versionCatalogoId || result.elementoId !== control.elementoId || version.versionId !== control.versionActual.versionId || version.numero !== control.versionActual.numero || !version.aplicacion || version.aplicacion.fechaAplicacion !== day || version.aplicacion.evidenciaId !== selected.evidenciaId || result.resultadoVigente !== 'SIN_VERIFICAR' || result.ultimaVerificacionId !== null || result.causaSinVigencia !== null || Object.entries(control.versionActual.detalle).some(([key, value]) => (version.detalle[key as keyof typeof version.detalle] ?? null) !== (value ?? null))) throw new Error('Invalid application response');
      } else {
        const result = await service.verify(company.empresaId, control.implementacionId, { revisionEsperada: control.revision, prueba: proof, fundamento: rationale, criteriosEvaluados: Number(total), criteriosCumplidos: Number(met), proximaRevision: day, evidenciaId: selected.evidenciaId }, request.current.signal);
        validateVerification(result, control.versionActual.versionId);
        if (result.revisionImplementacion !== control.revision + 1 || result.resultado === 'SIN_VERIFICAR' || result.prueba !== proof || result.fundamento !== rationale || result.criteriosEvaluados !== Number(total) || result.criteriosCumplidos !== Number(met) || result.proximaRevision !== day || result.evidenciaId !== selected.evidenciaId) throw new Error('Invalid verification response');
      }
      if (current()) { onDirty(false); onSaved(); }
    } catch (failure) {
      if (!current()) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el resultado. Consulta el servidor antes de otra escritura.');
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem); const correctable = ['EVIDENCIA_CONTROL_NO_DISPONIBLE', 'EVIDENCIA_CONTROL_YA_VERIFICADA', 'RESPONSABLE_NO_DISPONIBLE'].includes(problem.code);
      if (problem.code.startsWith('EVIDENCIA_CONTROL_')) setRejected(selected.evidenciaId);
      if ([0, 404].includes(problem.status) || problem.status >= 500 || (problem.status === 409 && !correctable)) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  return <Box component="form" aria-label={title} onSubmit={submit} onChange={() => onDirty(true)} aria-busy={pending || history.loading || evidence.loading}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" ref={heading} tabIndex={-1}>{title}</Typography><Typography>{control.versionActual.detalle.nombre} · Versión {control.versionActual.numero} · Revisión {control.revision}</Typography>
    <Typography>{applying ? 'Selecciona una evidencia ya adjunta y registra la fecha real de aplicación. El servidor revalida su integridad y seguridad; confirmar no acredita efectividad.' : 'Documenta una prueba y sus criterios. El resultado procede del servidor, sin porcentajes de reducción de riesgo. Cada nueva verificación requiere otro adjunto; el historial se conserva.'}</Typography>
    <Typography>Día actual de la empresa: {companyDay(company.zonaHoraria)} · {company.zonaHoraria}. El servidor vuelve a comprobar las fechas al guardar.</Typography>
    {!permitted && <Alert severity="warning">El estado o tus roles no permiten esta operación.</Alert>}{(error || evidence.error || history.error) && <ControlError error={(error || evidence.error || history.error)!} />}{error?.fields.map((item, index) => <Typography role="alert" key={index} color="error">{item.field}: {item.message}</Typography>)}
    {blocked && <Alert severity="warning">La revisión o el estado cambió, o el resultado puede haberse guardado. No se reenviará automáticamente; confirma el descarte antes de consultar.</Alert>}
    <Box component="fieldset" disabled={pending || blocked || !permitted} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={2}>
      {(evidence.loading || history.loading) && <Typography role="status">Consultando evidencias y antecedentes de la versión…</Typography>}
      <Typography component="label" htmlFor="proof-evidence">Evidencia de esta versión *</Typography><Box component="select" id="proof-evidence" required sx={fields} value={selected?.evidenciaId || ''} disabled={evidence.loading || history.loading || Boolean(evidence.error || history.error)} onChange={event => { setSelected(evidence.data?.elementos.find(item => item.evidenciaId === event.target.value) || (selected?.evidenciaId === event.target.value ? selected : undefined)); }}><option value="">Seleccionar…</option>{selected && !evidence.data?.elementos.some(item => item.evidenciaId === selected.evidenciaId) && <option value={selected.evidenciaId} disabled={Boolean(used(selected))}>{selected.nombreOriginal} · Selección conservada</option>}{evidence.data?.elementos.map(item => <option key={item.evidenciaId} value={item.evidenciaId} disabled={Boolean(used(item))}>{item.nombreOriginal} · {item.tamanoBytes} bytes · {item.estadoInspeccion}{used(item) ? ' · No disponible para esta decisión' : ''}</option>)}</Box>
      <Typography>La inspección indicada es la última registrada; el servidor vuelve a inspeccionar al confirmar. Si necesitas otro archivo, cancela para adjuntarlo y luego vuelve a esta decisión.</Typography>
      {evidence.data && !evidence.data.elementos.length && <Typography>No hay evidencias en esta página de la versión.</Typography>}{evidence.data && <ControlPager page={page} more={evidence.data.hayMas} label="evidencias para decisión" load={setPage} />}<Button disabled={evidence.loading} onClick={evidence.retry}>Actualizar evidencias para decisión</Button>
      <Typography component="label" htmlFor="proof-date">{applying ? 'Fecha de aplicación *' : 'Próxima revisión *'}</Typography><Box component="input" type="date" id="proof-date" name="fecha" required sx={fields} />
      {!applying && <>{(['prueba', 'fundamento'] as const).map(name => <Stack spacing={1} key={name}><Typography component="label" htmlFor={'proof-' + name}>{name === 'prueba' ? 'Prueba realizada *' : 'Fundamento *'}</Typography><Box component="textarea" id={'proof-' + name} name={name} required rows={4} sx={fields} /></Stack>)}{(['criteriosEvaluados', 'criteriosCumplidos'] as const).map(name => <Stack spacing={1} key={name}><Typography component="label" htmlFor={'proof-' + name}>{name === 'criteriosEvaluados' ? 'Criterios evaluados *' : 'Criterios cumplidos *'}</Typography><Box component="input" type="number" id={'proof-' + name} name={name} min={name === 'criteriosEvaluados' ? 1 : 0} max={2147483647} step={1} required sx={fields} /></Stack>)}<Typography>Cero criterios cumplidos es un dato válido; vacío sigue pendiente. El resultado no se selecciona manualmente.</Typography></>}
    </Stack></Box>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked || !permitted || history.loading || evidence.loading || Boolean(history.error || evidence.error)}>{pending ? 'Guardando…' : title}</Button><Button onClick={onCancel}>Cancelar y volver</Button>{(blocked || history.error) && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultará la ficha del servidor. ¿Continuar?')) { onDirty(false); onSaved(); } }}>Descartar formulario y consultar estado</Button>}</Stack>
  </Stack></Box>;
}
