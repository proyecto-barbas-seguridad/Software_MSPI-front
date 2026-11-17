import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { calendarDay, companyDay } from '../../shared/date/companyDay';
import { capabilities } from '../access/workspace';
import type { Company } from '../access/workspace';
import { ActionError } from './ActionWorkspace';
import { ActionChoice, ContextPicker, fields, OriginPicker } from './ActionReferences';
import type { Origin } from './ActionReferences';
import { uuid, validateAction } from './actions';
import type { Action, ActionData, ActionService } from './actions';
export type ActionMode = 'create' | 'edit' | 'cancel';
const titles = { create: 'Crear acción', edit: 'Editar acción', cancel: 'Cancelar acción' };
export default function ActionEditor({ company, action, mode, service, scope, onAuthorization, onDirty, onPending, onCancel, onSaved }: {
  company: Company; action?: Action; mode: ActionMode; service: ActionService; scope?: AbortSignal;
  onAuthorization: (error: ApiError) => void; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void; onCancel: () => void; onSaved: (created?: Action) => void;
}) {
  const initial = mode === 'create' ? undefined : action;
  const [origin, setOrigin] = useState<Origin | undefined>(initial?.riesgoId ? { type: 'risk', id: initial.riesgoId } : initial?.hallazgoId ? { type: 'finding', id: initial.hallazgoId } : undefined);
  const [assignee, setAssignee] = useState(initial?.responsableMembresiaId || ''); const [required, setRequired] = useState(initial ? String(initial.evidenciaRequerida) : ''); const [justification, setJustification] = useState(initial?.justificacionSinEvidencia || '');
  const [context, setContext] = useState<(NonNullable<ActionData['evidenciasContexto']>[number] & { label?: string })[]>(initial?.evidenciasContexto || []);
  const [error, setError] = useState<ApiError>(); const [blocked, setBlocked] = useState(false); const [pending, setPending] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null); const alive = useRef(false); const busy = useRef(false); const request = useRef<AbortController | undefined>(undefined);
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; request.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  const current = () => alive.current && !scope?.aborted && !request.current?.signal.aborted;
  const permitted = capabilities(company).write && (mode === 'create' || (initial && (mode === 'cancel' ? ['PENDIENTE', 'EN_EJECUCION', 'EN_REVISION'] : ['PENDIENTE', 'EN_EJECUCION']).includes(initial.estado)));
  const assignees = useCallback((page: number, signal: AbortSignal) => service.assignees(company.empresaId, page, signal), [company.empresaId, service]);
  const fieldError = (name: string) => error?.fields.find(item => item.field === name || item.field === 'datos.' + name)?.message;
  const field = (name: string, label: string, initialValue = '', maxLength?: number) => <Stack spacing={1}><Typography component="label" htmlFor={'action-edit-' + name}>{label} *</Typography><Box component="textarea" id={'action-edit-' + name} name={name} required defaultValue={initialValue} rows={4} maxLength={maxLength} aria-invalid={Boolean(fieldError(name))} aria-describedby={fieldError(name) ? 'action-error-' + name : undefined} sx={fields} />{fieldError(name) && <Typography role="alert" color="error" id={'action-error-' + name}>{fieldError(name)}</Typography>}</Stack>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || !permitted || scope?.aborted) return;
    const values = new FormData(event.currentTarget); const text = (name: string) => String(values.get(name) || '').trim(); const reason = text('motivo'); const due = text('fechaLimite');
    const contexts = context.map(item => ({ evidenciaId: item.evidenciaId, motivoContexto: item.motivoContexto.trim() }));
    const data: ActionData = { riesgoId: origin?.type === 'risk' ? origin.id : null, hallazgoId: origin?.type === 'finding' ? origin.id : null, descripcion: text('descripcion'), resultadoEsperado: text('resultadoEsperado'), responsableMembresiaId: assignee, fechaLimite: due, evidenciaRequerida: required === 'true', descripcionEvidencia: text('descripcionEvidencia'), justificacionSinEvidencia: required === 'false' ? justification.trim() : null, resumenContextoRa: text('resumenContextoRa'), evidenciasContexto: contexts };
    if (mode !== 'create' && (!reason || reason.length > 2000)) { setError(new ApiError(400, 'MOTIVO_REQUERIDO', 'Registra un motivo de hasta 2000 caracteres.')); return; }
    if (mode !== 'cancel' && (!origin || !uuid.test(origin.id) || !uuid.test(assignee) || !data.descripcion || !data.resultadoEsperado || !data.resumenContextoRa || !data.descripcionEvidencia || data.descripcionEvidencia.length > 2000 || !['true', 'false'].includes(required) || (required === 'false' && (!data.justificacionSinEvidencia || data.justificacionSinEvidencia.length > 2000)) || contexts.length > 20 || contexts.some(item => !uuid.test(item.evidenciaId) || !item.motivoContexto || item.motivoContexto.length > 1000) || new Set(contexts.map(item => item.evidenciaId)).size !== contexts.length)) { setError(new ApiError(400, 'DATOS_INCOMPLETOS', 'Completa origen, responsable, datos de la tarea, decisión de adjunto y motivos de los archivos de contexto.')); return; }
    if (mode !== 'cancel' && (!calendarDay(due) || (due !== initial?.fechaLimite && due < companyDay(company.zonaHoraria)))) { setError(new ApiError(400, 'PLAZO_INVALIDO', 'El plazo nuevo no puede ser anterior al día actual de la empresa. Puedes conservar un plazo vencido sin cambiarlo.')); return; }
    if ((mode === 'cancel' || (mode === 'edit' && assignee !== initial!.responsableMembresiaId)) && !window.confirm(mode === 'cancel' ? 'La acción quedará cancelada con este motivo y no se podrá reabrir. ¿Confirmar?' : 'Al reasignar, el responsable anterior perderá el acceso por asignación y el nuevo verá el contexto seleccionado. ¿Confirmar?')) return;
    busy.current = true; request.current = new AbortController(); setPending(true); onPending(true); onDirty(true); setError(undefined);
    try {
      const result = validateAction(mode === 'create' ? await service.create(company.empresaId, { datos: data }, request.current.signal) : mode === 'edit' ? await service.edit(company.empresaId, initial!.accionId, { revisionEsperada: initial!.revision, datos: data, motivo: reason }, request.current.signal) : await service.cancel(company.empresaId, initial!.accionId, initial!.revision, reason, request.current.signal), mode === 'create' ? undefined : initial!.accionId);
      if (mode === 'cancel') {
        if (result.estado !== 'CANCELADA' || result.revision !== initial!.revision + 1 || result.codigo !== initial!.codigo || result.motivoCambio !== reason || result.riesgoId !== initial!.riesgoId || result.hallazgoId !== initial!.hallazgoId || result.responsableMembresiaId !== initial!.responsableMembresiaId) throw new Error('Invalid cancellation');
      } else {
        if (result.estado !== (mode === 'create' ? 'PENDIENTE' : initial!.estado) || result.revision !== (mode === 'create' ? 0 : initial!.revision + 1) || (mode === 'create' ? !result.codigo.trim() || result.entregaVigenteId != null || result.finalizadaEn != null : result.codigo !== initial!.codigo || result.motivoCambio !== reason)) throw new Error('Invalid action mutation');
        for (const [key, value] of Object.entries(data)) { if (key === 'evidenciasContexto') continue; if ((result[key as keyof Action] ?? null) !== value) throw new Error('Invalid action data'); }
        if (result.evidenciasContexto.length !== contexts.length || contexts.some(item => !result.evidenciasContexto.some(saved => saved.evidenciaId === item.evidenciaId && saved.motivoContexto === item.motivoContexto))) throw new Error('Invalid context data');
      }
      if (current()) { onDirty(false); onSaved(mode === 'create' ? result : undefined); }
    } catch (failure) {
      if (!current()) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el resultado de la acción.');
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem); if ([0, 404, 409].includes(problem.status) || problem.status >= 500) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  return <Box component="form" aria-label={titles[mode]} onSubmit={submit} onChange={() => onDirty(true)} aria-busy={pending}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" ref={heading} tabIndex={-1}>{titles[mode]}</Typography><Typography>{initial ? initial.codigo + ' · Revisión ' + initial.revision : 'El servidor asigna el código. Completa datos propios de esta tarea; no se copian automáticamente del origen.'}</Typography>
    <Typography>{mode === 'cancel' ? 'Cancelar conserva el historial. No equivale a completar la acción ni sustituye la aprobación de una entrega.' : 'Elige una membresía habilitada para acciones. El resumen y los archivos seleccionados serán visibles para el responsable de la tarea, incluido RA. Ningún rol permite revisar su propia entrega.'}</Typography>
    {!permitted && <Alert severity="warning">El estado o tus roles no permiten esta operación.</Alert>}{error && <ActionError error={error} />}{error?.fields.filter(item => !['descripcion', 'resultadoEsperado', 'resumenContextoRa', 'descripcionEvidencia', 'motivo'].some(key => item.field === key || item.field === 'datos.' + key)).map((item, index) => <Typography role="alert" color="error" key={index}>{item.field}: {item.message}</Typography>)}
    {blocked && <Alert severity="warning">La revisión o el estado cambió, o el resultado puede haberse guardado. No se reenviará automáticamente; confirma el descarte para consultar.{mode === 'create' && ' El código lo asigna el servidor: una descripción coincidente no demuestra que la creara esta solicitud.'}</Alert>}
    <Box component="fieldset" disabled={pending || blocked || !permitted} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={3}>
      {mode !== 'cancel' && <><OriginPicker company={company.empresaId} service={service} scope={scope} onAuthorization={onAuthorization} value={origin} onChange={value => { setOrigin(value); onDirty(true); }} />{field('descripcion', 'Descripción', initial?.descripcion)}{field('resultadoEsperado', 'Resultado esperado', initial?.resultadoEsperado)}<ActionChoice label="Responsable de la acción" load={assignees} initial={initial?.responsableMembresiaId} scope={scope} onAuthorization={onAuthorization} onChange={setAssignee} />
        <Typography component="label" htmlFor="action-edit-deadline">Fecha límite *</Typography><Box component="input" type="date" id="action-edit-deadline" name="fechaLimite" required defaultValue={initial?.fechaLimite || ''} sx={fields} /><Typography>Día de la empresa: {companyDay(company.zonaHoraria)} · {company.zonaHoraria}. El servidor vuelve a comprobarlo al guardar.</Typography>
        <Typography component="label" htmlFor="action-edit-required">¿Adjunto requerido para la entrega? *</Typography><Box component="select" id="action-edit-required" value={required} required sx={fields} onChange={event => setRequired(event.target.value)}><option value="">Pendiente</option><option value="true">Sí</option><option value="false">No</option></Box>{field('descripcionEvidencia', 'Evidencia o comprobación esperada', initial?.descripcionEvidencia, 2000)}
        {required === 'false' && <><Typography component="label" htmlFor="action-no-evidence">Justificación sin adjunto *</Typography><Box component="textarea" id="action-no-evidence" value={justification} onChange={event => setJustification(event.target.value)} required rows={4} maxLength={2000} sx={fields} /></>}{required === 'true' && <Typography>Justificación sin adjunto: No aplica.</Typography>}
        {field('resumenContextoRa', 'Resumen de contexto para RA', initial?.resumenContextoRa)}<Typography>Archivos seleccionados para el contexto: {context.length} / 20. Sin archivos seleccionados no se comparten adjuntos del origen.</Typography>
        {context.map(item => <Stack key={item.evidenciaId} spacing={1}><Typography>{item.label || 'Archivo guardado · ' + item.evidenciaId}</Typography><Typography component="label" htmlFor={'context-reason-' + item.evidenciaId}>Motivo de compartir {item.label || item.evidenciaId} *</Typography><Box component="textarea" id={'context-reason-' + item.evidenciaId} value={item.motivoContexto} required rows={3} maxLength={1000} sx={fields} onChange={event => setContext(prior => prior.map(row => row.evidenciaId === item.evidenciaId ? { ...row, motivoContexto: event.target.value } : row))} /><Button onClick={() => { setContext(prior => prior.filter(row => row.evidenciaId !== item.evidenciaId)); onDirty(true); }}>Retirar del contexto {item.label || item.evidenciaId}</Button></Stack>)}
        <ContextPicker company={company.empresaId} service={service} scope={scope} onAuthorization={onAuthorization} onAdd={file => { if (context.some(item => item.evidenciaId === file.evidenciaId)) { setError(new ApiError(400, 'CONTEXTO_DUPLICADO', 'Ese archivo ya está seleccionado.')); return; } if (context.length >= 20) { setError(new ApiError(400, 'CONTEXTO_LIMITE', 'Puedes seleccionar hasta 20 archivos de contexto.')); return; } setContext(prior => [...prior, { evidenciaId: file.evidenciaId, motivoContexto: '', label: file.nombreOriginal }]); onDirty(true); }} />
      </>}{mode !== 'create' && field('motivo', mode === 'cancel' ? 'Motivo de cancelación' : 'Motivo del cambio', '', 2000)}
    </Stack></Box>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked || !permitted}>{pending ? 'Guardando…' : titles[mode]}</Button><Button onClick={onCancel}>Cancelar y volver</Button>{blocked && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultará el servidor antes de otra escritura. ¿Continuar?')) { onDirty(false); onSaved(); } }}>Descartar formulario y consultar estado</Button>}</Stack>
  </Stack></Box>;
}
