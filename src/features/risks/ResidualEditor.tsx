import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { useControlRead } from '../controls/ControlPanel';
import type { ControlService } from '../controls/controls';
import { labels } from '../dashboard/panel';
import { impacts, probabilities, validators } from './risks';
import type { InherentEntries, Residual, ResidualData, Risk, RiskService } from './risks';
import { residualContext, residualStates } from './residualContext';
import ResidualVerificationPicker from './ResidualVerificationPicker';
import type { SelectedVerification } from './ResidualVerificationPicker';
export type ResidualMode = { kind: 'create' } | { kind: 'edit' | 'confirm'; assessment: Residual };
const names = { probabilidad: 'Probabilidad', impacto: 'Impacto', periodoReferencia: 'Periodo de referencia', fundamento: 'Fundamento', supuestos: 'Supuestos', fuente: 'Fuente' };
const title = { create: 'Nueva valoración residual', edit: 'Editar borrador residual', confirm: 'Confirmar valoración residual' };
const fields = { width: '100%', minHeight: 44, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
export default function ResidualEditor({ company, risk, mode, service, controls, scope, onSaved, onCancel, onAuthorization, onDirty, onPending }: {
  company: string; risk: Risk; mode: ResidualMode; service: RiskService; controls: ControlService; scope?: AbortSignal;
  onSaved: () => void; onCancel: () => void; onAuthorization: (error: ApiError) => void; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void;
}) {
  const initial = mode.kind === 'create' ? undefined : mode.assessment; const confirming = mode.kind === 'confirm';
  const [probability, setProbability] = useState(initial?.datos.entradas.probabilidad || ''); const [impact, setImpact] = useState(initial?.datos.entradas.impacto || '');
  const [mitigation, setMitigation] = useState(initial?.datos.sinMitigacion == null ? '' : String(initial.datos.sinMitigacion));
  const [selected, setSelected] = useState<SelectedVerification[]>(() => (initial?.datos.verificaciones || []).map(id => ({ id, label: 'Verificación guardada · ' + id })));
  const [error, setError] = useState<ApiError>(); const [pending, setPending] = useState(false); const [blocked, setBlocked] = useState(false);
  const alive = useRef(false); const busy = useRef(false); const request = useRef<AbortController | undefined>(undefined); const heading = useRef<HTMLHeadingElement>(null);
  const load = useCallback(async (signal: AbortSignal) => { try { return await residualContext(company, risk, service, signal, scope); } catch (failure) { if (failure instanceof ApiError || signal.aborted || scope?.aborted) throw failure; throw new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo consultar la base y el historial residual.'); } }, [company, risk, service, scope]);
  const context = useControlRead(load, { scope, onAuthorization }); const base = context.data?.base;
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; request.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  const current = () => alive.current && !request.current?.signal.aborted && !scope?.aborted;
  const mismatch = initial && (initial.riesgoId !== risk.riesgoId || initial.revisionRiesgo !== risk.revision || initial.estadoResultado !== 'BORRADOR');
  const staleBase = initial && (initial.inherenteId !== risk.inherenteVigenteId || initial.requiereRevision);
  const existing = mode.kind === 'create' && context.data?.existingDraft;
  const fieldError = (name: string) => error?.fields.find(field => [name, 'datos.' + name, 'datos.entradas.' + name].includes(field.field))?.message;
  const confirmationMissing = confirming ? (Object.keys(names) as (keyof typeof names)[]).filter(key => !String(initial?.datos.entradas[key] ?? '').trim()).map(key => names[key]) : [];
  if (confirming && initial?.datos.sinMitigacion == null) confirmationMissing.push('Decisión sobre mitigación');
  if (confirming && initial?.datos.sinMitigacion === true && (!initial.datos.justificacionSinMitigacion?.trim() || selected.length || (base && (probability !== base.entradas.probabilidad || impact !== base.entradas.impacto)))) confirmationMissing.push('Justificar sin mitigación, retirar verificaciones y conservar las categorías de la base');
  if (confirming && initial?.datos.sinMitigacion === false && (!selected.length || initial.datos.justificacionSinMitigacion)) confirmationMissing.push('Seleccionar verificaciones y omitir justificación de ausencia de mitigación');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || mismatch || existing || !base || context.loading || context.error || scope?.aborted || !residualStates.includes(risk.estado) || (confirming && (staleBase || confirmationMissing.length))) return;
    const values = new FormData(event.currentTarget); const value = (name: string) => String(values.get(name) || '').trim();
    const entradas: InherentEntries = { probabilidad: probability as InherentEntries['probabilidad'] || null, impacto: impact as InherentEntries['impacto'] || null, periodoReferencia: value('periodoReferencia') || null, fundamento: value('fundamento') || null, supuestos: value('supuestos') || null, fuente: value('fuente') || null };
    const motivo = value('motivoReevaluacion'); const ids = selected.map(item => item.id);
    const datos: ResidualData = { entradas, sinMitigacion: mitigation === '' ? null : mitigation === 'true', justificacionSinMitigacion: mitigation === 'false' ? null : value('justificacionSinMitigacion') || null, verificaciones: ids };
    if (!confirming && ((probability && !probabilities.includes(probability)) || (impact && !impacts.includes(impact)) || (entradas.periodoReferencia?.length || 0) > 150 || ids.length > 100 || new Set(ids).size !== ids.length
      || (datos.justificacionSinMitigacion?.length || 0) > 2000 || (mitigation === 'true' && ids.length > 0) || (mode.kind === 'create' && context.data!.reevaluation && (!motivo || motivo.length > 2000)))) {
      setError(new ApiError(400, 'DATOS_INVALIDOS', 'Revisa las entradas, los límites, el motivo de reevaluación y la selección: sin mitigación no admite verificaciones.')); return;
    }
    if (confirming && !window.confirm(`¿Confirmar la valoración residual de ${risk.codigo}? El servidor validará base, verificaciones, evidencias y calculará el resultado.`)) return;
    const controller = request.current = new AbortController(); busy.current = true; setPending(true); setError(undefined); onDirty(true); onPending(true);
    try {
      const revisionEsperada = initial?.revisionRiesgo ?? risk.revision;
      const result = mode.kind === 'create' ? await service.startResidual(company, risk.riesgoId, { revisionEsperada, datos, ...(context.data!.reevaluation ? { motivoReevaluacion: motivo } : {}) }, controller.signal)
        : mode.kind === 'edit' ? await service.editResidual(company, risk.riesgoId, initial!.residualId, { revisionEsperada, datos }, controller.signal)
          : await service.confirmResidual(company, risk.riesgoId, initial!.residualId, revisionEsperada, controller.signal);
      validators.residual(result, risk.riesgoId);
      const expectedIds = confirming ? initial!.datos.verificaciones || [] : ids;
      if (result.revisionRiesgo !== revisionEsperada + 1 || result.inherenteId !== base.valoracionId || result.versionMetodologiaId !== base.versionMetodologiaId || result.requiereRevision
        || (initial && (result.residualId !== initial.residualId || result.anteriorId !== initial.anteriorId || result.motivoReevaluacion !== initial.motivoReevaluacion))
        || (mode.kind === 'create' && ((context.data!.reevaluation ? !result.anteriorId : result.anteriorId !== null) || result.motivoReevaluacion !== (context.data!.reevaluation ? motivo : null)))
        || result.estadoResultado !== (confirming ? 'CONFIRMADA' : 'BORRADOR')
        || (confirming ? !result.vigente || !result.nivel || result.probabilidadIndice === null || result.impactoIndice === null || !result.confirmadaPor || !result.confirmadaEn || result.pruebas.length !== expectedIds.length || result.pruebas.some(p => !expectedIds.includes(p.verificacionId))
          : result.vigente || result.nivel !== null || result.probabilidadIndice !== null || result.impactoIndice !== null || result.confirmadaPor !== null || result.confirmadaEn !== null)) throw new Error('Invalid residual write response');
      if (current()) { onDirty(false); onSaved(); }
    } catch (failure) {
      if (!current()) return; const issue = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el resultado residual.');
      if (issue.status === 401 || (issue.status === 403 && issue.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(issue); return; }
      setError(issue); if (issue.status === 0 || issue.status >= 500 || issue.status === 404 || (issue.status === 409 && issue.code !== 'VALORACION_RESIDUAL_INCOMPLETA')) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  return <Box component="form" aria-label={title[mode.kind]} onSubmit={submit} onChange={() => onDirty(true)} aria-busy={pending || context.loading}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" ref={heading} tabIndex={-1}>{title[mode.kind]}</Typography><Typography>{risk.codigo} · Revisión {initial?.revisionRiesgo ?? risk.revision}</Typography>
    <Typography>Guardar admite pendientes y no confirma. Confirmar es otro paso sobre los datos guardados. Las verificaciones se seleccionan expresamente; no se aplican descuentos automáticos.</Typography>
    {context.loading && <Typography role="status">Consultando la base inherente indicada y antecedentes residuales…</Typography>}{context.error && <Alert severity="error">{context.error.status === 404 ? 'El riesgo o sus valoraciones no están disponibles en esta empresa.' : context.error.message}{context.error.correlationId && ` Referencia de soporte: ${context.error.correlationId}`}{context.error.retryAfter !== undefined && ` El servidor indicó esperar ${context.error.retryAfter} segundos antes de reintentar.`}</Alert>}
    {base && <Alert severity="info">Base inherente confirmada: {base.valoracionId} · {labels[base.entradas.probabilidad!] } / {labels[base.entradas.impacto!]} · Metodología: {base.versionMetodologiaId}</Alert>}
    {existing && <Alert severity="warning">Ya existe un borrador residual. Vuelve a las valoraciones para consultarlo y editarlo; no se creará otro.</Alert>}
    {mismatch && <Alert severity="warning">El borrador no corresponde al mismo riesgo, revisión o estado editable. Actualiza la ficha.</Alert>}
    {staleBase && <Alert severity="warning">La base o el contexto requiere revisión. Revisa las entradas y guarda explícitamente para asociar el borrador a la base vigente antes de confirmar.</Alert>}
    {confirmationMissing.length > 0 && <Alert severity="warning">Antes de confirmar, edita y guarda: {confirmationMissing.join(', ')}.</Alert>}
    {error && <Alert severity="error"><Stack spacing={1}><Typography>{error.message}</Typography>{error.correlationId && <Typography>Referencia de soporte: {error.correlationId}</Typography>}{error.fields.length > 0 && <Box component="ul" sx={{ pl: 2 }}>{error.fields.map((f, i) => <Typography component="li" key={i}>{names[f.field.replace(/^datos\.entradas\./, '') as keyof typeof names] || f.field}: {f.message}</Typography>)}</Box>}</Stack></Alert>}{error?.retryAfter !== undefined && <Typography>El servidor indicó esperar {error.retryAfter} segundos antes de reintentar.</Typography>}
    {blocked && <Alert severity="warning">{error?.status === 0 || (error?.status || 0) >= 500 ? 'El resultado no se confirmó y puede haberse guardado. No se reenviará automáticamente. Consulta la ficha y los antecedentes antes de otra escritura.' : 'El estado, revisión, base o pruebas cambió. Conserva tu formulario hasta que decidas descartarlo y consultar nuevamente.'}</Alert>}
    <Box component="fieldset" disabled={pending || blocked || context.loading || Boolean(context.error || mismatch || existing)} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={3}>
      {(['probabilidad', 'impacto'] as const).map(name => <Stack key={name} spacing={1}><Typography component="label" htmlFor={'residual-' + name}>{names[name]}</Typography><Box component="select" id={'residual-' + name} disabled={confirming} value={name === 'probabilidad' ? probability : impact} onChange={event => name === 'probabilidad' ? setProbability(event.target.value) : setImpact(event.target.value)} sx={fields} aria-invalid={Boolean(fieldError(name))}><option value="">Pendiente</option>{(name === 'probabilidad' ? probabilities : impacts).map(code => <option key={code} value={code}>{labels[code]}</option>)}</Box>{fieldError(name) && <Typography role="alert" color="error">{fieldError(name)}</Typography>}</Stack>)}
      {(['periodoReferencia', 'fundamento', 'supuestos', 'fuente'] as const).map(name => <Stack key={name} spacing={1}><Typography component="label" htmlFor={'residual-' + name}>{names[name]}</Typography><Box component="textarea" id={'residual-' + name} name={name} rows={name === 'periodoReferencia' ? 2 : 4} readOnly={confirming} defaultValue={initial?.datos.entradas[name] || ''} maxLength={name === 'periodoReferencia' ? 150 : undefined} sx={fields} aria-invalid={Boolean(fieldError(name))} />{fieldError(name) && <Typography role="alert" color="error">{fieldError(name)}</Typography>}</Stack>)}
      <Stack spacing={1}><Typography component="label" htmlFor="residual-mitigation">Sin mitigación</Typography><Box component="select" id="residual-mitigation" value={mitigation} disabled={confirming} onChange={event => setMitigation(event.target.value)} sx={fields}><option value="">Pendiente de decidir</option><option value="true">Sí, sin mitigación</option><option value="false">No, seleccionar verificaciones</option></Box></Stack>
      <Stack spacing={1}><Typography component="label" htmlFor="residual-absence">Justificación sin mitigación</Typography><Box component="textarea" id="residual-absence" name="justificacionSinMitigacion" rows={3} maxLength={2000} readOnly={confirming} disabled={mitigation === 'false'} defaultValue={initial?.datos.justificacionSinMitigacion || ''} sx={fields} /><Typography variant="body2">Obligatoria al confirmar sin mitigación; no se envía si seleccionas mitigación. Sin mitigación conserva la probabilidad e impacto de la base, sin verificaciones.</Typography></Stack>
      {!confirming && mitigation === 'true' && base && <Button onClick={() => { setProbability(base.entradas.probabilidad!); setImpact(base.entradas.impacto!); onDirty(true); }}>Usar categorías de la base inherente</Button>}
      <Typography>Verificaciones seleccionadas: {selected.length} / 100</Typography>{selected.map(item => <Stack key={item.id} direction="row" sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}><Typography>{item.label}</Typography>{!confirming && <Button aria-label={'Retirar verificación ' + item.id} onClick={() => { setSelected(prior => prior.filter(v => v.id !== item.id)); onDirty(true); }}>Retirar</Button>}</Stack>)}
      {confirming && <Typography>Se confirmarán las referencias guardadas, sin sustituirlas ni acreditarlas por su identificador. El servidor comprobará versión, vinculación, vigencia e integridad.</Typography>}
      {!confirming && mitigation === 'false' && <ResidualVerificationPicker company={company} risk={risk} service={service} controls={controls} selected={selected} scope={scope} onAuthorization={onAuthorization} onToggle={(item, checked) => { setSelected(prior => checked ? prior.some(v => v.id === item.id) ? prior : [...prior, item] : prior.filter(v => v.id !== item.id)); onDirty(true); }} />}
      {mode.kind === 'create' && context.data?.reevaluation && <Stack spacing={1}><Typography component="label" htmlFor="residual-reason">Motivo de reevaluación *</Typography><Box component="textarea" id="residual-reason" name="motivoReevaluacion" required rows={3} maxLength={2000} sx={fields} /></Stack>}
      {initial && <Typography variant="body2">Residual: {initial.residualId} · Base guardada: {initial.inherenteId} · Antecedente: {initial.anteriorId || 'No registrado'} · Motivo conservado: {initial.motivoReevaluacion || 'No registrado'}</Typography>}
    </Stack></Box>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked || context.loading || !base || Boolean(context.error || mismatch || existing) || (confirming && Boolean(staleBase || confirmationMissing.length))}>{pending ? 'Procesando…' : confirming ? 'Confirmar residual guardada' : 'Guardar borrador residual'}</Button><Button onClick={onCancel}>{confirming ? 'Volver para editar' : 'Cancelar y volver'}</Button>
      {(blocked || context.error || existing) && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultarán la ficha y las valoraciones residuales. ¿Continuar?')) { onDirty(false); onSaved(); } }}>Descartar formulario y consultar estado</Button>}
    </Stack>
  </Stack></Box>;
}
