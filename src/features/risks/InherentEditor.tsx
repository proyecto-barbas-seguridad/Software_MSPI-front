import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { labels } from '../dashboard/panel';
import { impacts, probabilities, validators } from './risks';
import type { Inherent, InherentEntries, Risk, RiskService } from './risks';
export type InherentMode = { kind: 'create' } | { kind: 'edit' | 'confirm'; assessment: Inherent };
const fields = { width: '100%', minHeight: 44, px: 1.5, py: 1, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
const names = { probabilidad: 'Probabilidad', impacto: 'Impacto', periodoReferencia: 'Periodo de referencia', fundamento: 'Fundamento', supuestos: 'Supuestos', fuente: 'Fuente' };
const title = { create: 'Nueva valoración inherente', edit: 'Editar borrador inherente', confirm: 'Confirmar valoración inherente' };
export default function InherentEditor({ companyId, risk, mode, service, scope, onSaved, onCancel, onAuthorization, onDirty, onPending }: {
  companyId: string; risk: Risk; mode: InherentMode; service: RiskService; scope?: AbortSignal;
  onSaved: () => void; onCancel: () => void; onAuthorization: (error: ApiError) => void; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void;
}) {
  const initial = mode.kind === 'create' ? undefined : mode.assessment; const confirming = mode.kind === 'confirm';
  const reevaluation = mode.kind === 'create' && risk.inherenteVigenteId !== null;
  const missing = confirming ? (Object.keys(names) as (keyof typeof names)[]).filter(key => initial?.entradas[key] == null || !String(initial.entradas[key]).trim()) : [];
  const [error, setError] = useState<ApiError>(); const [blocked, setBlocked] = useState(false); const [pending, setPending] = useState(false);
  const alive = useRef(false); const busy = useRef(false); const request = useRef<AbortController | undefined>(undefined); const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; request.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  const current = () => alive.current && !request.current?.signal.aborted && !scope?.aborted;
  const mismatched = initial && (initial.riesgoId !== risk.riesgoId || initial.revisionRiesgo !== risk.revision || initial.estadoResultado !== 'BORRADOR');
  const fieldError = (name: string) => error?.fields.find(field => field.field === name || field.field === 'entradas.' + name)?.message;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || scope?.aborted || mismatched || risk.estado !== 'EN_ANALISIS' || (confirming && (missing.length > 0 || initial?.requiereRevision))) return;
    const values = new FormData(event.currentTarget); const value = (name: string) => String(values.get(name) || '').trim();
    const entradas: InherentEntries = { probabilidad: value('probabilidad') as InherentEntries['probabilidad'] || null, impacto: value('impacto') as InherentEntries['impacto'] || null,
      periodoReferencia: value('periodoReferencia') || null, fundamento: value('fundamento') || null, supuestos: value('supuestos') || null, fuente: value('fuente') || null };
    const motivo = value('motivoReevaluacion');
    if (!confirming && ((entradas.probabilidad != null && !probabilities.includes(entradas.probabilidad)) || (entradas.impacto != null && !impacts.includes(entradas.impacto))
      || (entradas.periodoReferencia?.length || 0) > 150 || (mode.kind === 'create' && ((reevaluation && !motivo) || motivo.length > 2000)))) {
      setError(new ApiError(400, 'DATOS_INVALIDOS', 'Revisa las categorías, el periodo de hasta 150 caracteres y el motivo obligatorio de reevaluación.')); return;
    }
    if (confirming && !window.confirm(`¿Confirmar la valoración inherente de ${risk.codigo}? El servidor calculará el nivel y conservará esta versión.`)) return;
    const controller = request.current = new AbortController(); busy.current = true; setPending(true); setError(undefined); onDirty(true); onPending(true);
    try {
      const revisionEsperada = initial?.revisionRiesgo ?? risk.revision;
      const result = mode.kind === 'create' ? await service.startInherent(companyId, risk.riesgoId, { revisionEsperada, entradas, ...(reevaluation ? { motivoReevaluacion: motivo } : {}) }, controller.signal)
        : mode.kind === 'edit' ? await service.editInherent(companyId, risk.riesgoId, initial!.valoracionId, { revisionEsperada, entradas }, controller.signal)
          : await service.confirmInherent(companyId, risk.riesgoId, initial!.valoracionId, revisionEsperada, controller.signal);
      validators.inherent(result, risk.riesgoId);
      if (result.revisionRiesgo !== revisionEsperada + 1 || result.requiereRevision || (initial && (result.valoracionId !== initial.valoracionId || result.versionMetodologiaId !== initial.versionMetodologiaId))
        || result.estadoResultado !== (confirming ? 'CONFIRMADA' : 'BORRADOR')
        || (mode.kind === 'create' && (result.valoracionAnteriorId !== risk.inherenteVigenteId || result.motivoReevaluacion !== (reevaluation ? motivo : null)))
        || (confirming ? !result.nivel || result.probabilidadIndice === null || result.impactoIndice === null || !result.base || !result.confirmadaPor || !result.confirmadaEn
          : result.nivel !== null || result.probabilidadIndice !== null || result.impactoIndice !== null || result.base !== null || result.confirmadaPor !== null || result.confirmadaEn !== null)) throw new Error('Invalid inherent write response');
      if (current()) { onDirty(false); onSaved(); }
    } catch (failure) {
      if (!current()) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el resultado de la valoración.');
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem);
      if (problem.status === 0 || problem.status >= 500 || problem.status === 404 || (problem.status === 409 && problem.code !== 'VALORACION_INHERENTE_INCOMPLETA')) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  return <Box component="form" aria-label={title[mode.kind]} onSubmit={submit} onChange={() => onDirty(true)} aria-busy={pending}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" ref={heading} tabIndex={-1}>{title[mode.kind]}</Typography><Typography>{risk.codigo} · Revisión {initial?.revisionRiesgo ?? risk.revision}</Typography>
    <Typography>{confirming ? 'Confirmar publica una versión conservada y calcula sus índices y nivel en el servidor. No aplica descuentos por controles.' : 'Puedes guardar con campos pendientes. Guardar no confirma ni calcula un nivel. La confirmación será otro paso sobre el borrador guardado.'}</Typography>
    <Box component="details"><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Contexto actual del riesgo</Typography><Stack spacing={1}><Typography>Activo: {risk.detalle.activoPrincipalId}</Typography><Typography>Amenaza: {risk.detalle.amenaza}</Typography><Typography>Vulnerabilidad: {risk.detalle.vulnerabilidad}</Typography><Typography>Descripción: {risk.detalle.descripcion}</Typography></Stack></Box>
    {initial?.requiereRevision && <Alert severity="warning">El contexto del borrador requiere revisión. Revisa el riesgo y guarda explícitamente el borrador para actualizar su contexto antes de confirmar.</Alert>}
    {mismatched && <Alert severity="warning">El borrador y la ficha no corresponden al mismo riesgo, revisión o estado editable. Vuelve y actualiza la ficha.</Alert>}
    {missing.length > 0 && <Alert severity="warning">Antes de confirmar, edita y guarda estos campos pendientes: {missing.map(key => names[key]).join(', ')}.</Alert>}
    {error && <Alert severity="error"><Stack spacing={1}><Typography>{error.message}</Typography>{error.correlationId && <Typography>Referencia de soporte: {error.correlationId}</Typography>}{error.fields.length > 0 && <Box component="ul" sx={{ pl: 2 }}>{error.fields.map((field, index) => <Typography component="li" key={index}>{names[field.field.replace(/^entradas\./, '') as keyof typeof names] || field.field}: {field.message}</Typography>)}</Box>}</Stack></Alert>}
    {error?.retryAfter !== undefined && <Typography>El servidor indicó esperar {error.retryAfter} segundos antes de reintentar.</Typography>}
    {blocked && <Alert severity="warning">{error?.status === 0 || (error?.status || 0) >= 500 ? 'El resultado no se confirmó y puede haberse guardado. No se reenviará automáticamente. Consulta la ficha y las valoraciones antes de otra escritura.' : 'El estado, revisión, contexto o política cambió, o ya existe un borrador. Consulta las valoraciones antes de continuar.'}</Alert>}
    <Box component="fieldset" disabled={pending || blocked || Boolean(mismatched)} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={3}>
      {(['probabilidad', 'impacto'] as const).map(name => <Stack spacing={1} key={name}><Typography component="label" htmlFor={'inherent-' + name}>{names[name]}</Typography><Box component="select" id={'inherent-' + name} name={name} disabled={confirming} defaultValue={initial?.entradas[name] || ''} aria-invalid={Boolean(fieldError(name))} aria-describedby={fieldError(name) ? 'inherent-error-' + name : undefined} sx={fields}><option value="">Pendiente</option>{(name === 'probabilidad' ? probabilities : impacts).map(code => <option key={code} value={code}>{labels[code]}</option>)}</Box>{fieldError(name) && <Typography id={'inherent-error-' + name} color="error" role="alert">{fieldError(name)}</Typography>}</Stack>)}
      {(['periodoReferencia', 'fundamento', 'supuestos', 'fuente'] as const).map(name => <Stack spacing={1} key={name}><Typography component="label" htmlFor={'inherent-' + name}>{names[name]}</Typography><Box component="textarea" id={'inherent-' + name} name={name} rows={name === 'periodoReferencia' ? 2 : 4} readOnly={confirming} defaultValue={initial?.entradas[name] || ''} maxLength={name === 'periodoReferencia' ? 150 : undefined} aria-invalid={Boolean(fieldError(name))} aria-describedby={fieldError(name) ? 'inherent-error-' + name : undefined} sx={fields} />{fieldError(name) && <Typography id={'inherent-error-' + name} color="error" role="alert">{fieldError(name)}</Typography>}</Stack>)}
      {reevaluation && <Stack spacing={1}><Typography component="label" htmlFor="inherent-reason">Motivo de reevaluación *</Typography><Box component="textarea" id="inherent-reason" name="motivoReevaluacion" required rows={3} maxLength={2000} aria-invalid={Boolean(fieldError('motivoReevaluacion'))} sx={fields} /><Typography color="text.secondary">Se conservará la valoración anterior {risk.inherenteVigenteId}; esta nueva valoración no la sustituye hasta confirmar.</Typography></Stack>}
      {initial && <Typography variant="body2" color="text.secondary">Valoración: {initial.valoracionId} · Metodología: {initial.versionMetodologiaId} · Antecedente: {initial.valoracionAnteriorId || 'No registrado'}{initial.motivoReevaluacion && ` · Motivo conservado: ${initial.motivoReevaluacion}`}</Typography>}
    </Stack></Box>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked || Boolean(mismatched) || (confirming && (missing.length > 0 || Boolean(initial?.requiereRevision)))}>{pending ? 'Procesando…' : confirming ? 'Confirmar valoración guardada' : 'Guardar borrador inherente'}</Button><Button onClick={onCancel}>{confirming ? 'Volver para editar' : 'Cancelar y volver'}</Button>
      {blocked && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultarán la ficha y las valoraciones. ¿Continuar?')) { onDirty(false); onSaved(); } }}>Descartar formulario y consultar estado</Button>}
    </Stack>
  </Stack></Box>;
}
