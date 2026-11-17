import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { capabilities } from '../access/workspace';
import type { Company } from '../access/workspace';
import { timestamp } from '../dashboard/panel';
import { ActionError, ActionFile, ActionPager, useActionRead } from './ActionWorkspace';
import { canExecute, currentDelivery, executing, validateAction, validateEvidence, validatePage } from './actions';
import type { Action, ActionService, Evidence } from './actions';
export type ExecutionMode = 'progress' | 'deliver' | 'approve' | 'return';
const titles = { progress: 'Registrar avance', deliver: 'Solicitar revisión', approve: 'Aprobar entrega', return: 'Devolver entrega' };
const fields = { width: '100%', minHeight: 44, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
export default function ActionExecution({ company, action, userId, mode, service, scope, onAuthorization, onDirty, onPending, onCancel, onSaved }: {
  company: Company; action: Action; userId?: string; mode: ExecutionMode; service: ActionService; scope?: AbortSignal;
  onAuthorization: (error: ApiError) => void; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void; onCancel: () => void; onSaved: () => void;
}) {
  const reviewing = mode === 'approve' || mode === 'return'; const permitted = reviewing ? capabilities(company).write && action.estado === 'EN_REVISION' : canExecute(company.roles) && executing(action);
  const [page, setPage] = useState(0); const [selected, setSelected] = useState<Evidence>();
  const [pending, setPending] = useState(false); const [blocked, setBlocked] = useState(false); const [error, setError] = useState<ApiError>();
  const load = useCallback(async (signal: AbortSignal) => {
    if (!permitted) throw new ApiError(403, 'OPERACION_NO_AUTORIZADA', 'Tus roles o el estado no permiten esta operación.');
    return { review: reviewing ? await currentDelivery(company.empresaId, action, userId, service, signal, scope) : undefined, files: mode === 'deliver' ? validatePage(await service.evidence(company.empresaId, action.accionId, page, signal), page, validateEvidence) : undefined };
  }, [permitted, reviewing, company.empresaId, action, userId, service, scope, mode, page]);
  const state = useActionRead(load, { scope, onAuthorization });
  const heading = useRef<HTMLHeadingElement>(null); const alive = useRef(false); const busy = useRef(false); const request = useRef<AbortController | undefined>(undefined);
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; request.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  const current = () => alive.current && !scope?.aborted && !request.current?.signal.aborted;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || !permitted || scope?.aborted || state.loading || state.error || !state.data || state.data.review?.own) return;
    const comment = String(new FormData(event.currentTarget).get('comentario') || '').trim();
    if (!comment || comment.length > 2000) { setError(new ApiError(400, 'COMENTARIO_REQUERIDO', 'Registra un comentario o motivo de hasta 2000 caracteres.')); return; }
    if (mode === 'deliver' && action.evidenciaRequerida && !selected) { setError(new ApiError(400, 'EVIDENCIA_REQUERIDA', 'Esta tarea exige seleccionar un adjunto de la acción antes de solicitar revisión.')); return; }
    if (reviewing && (!state.data.review || state.data.review.event.eventoId !== action.entregaVigenteId || state.data.review.event.autorId.toLowerCase() === userId?.toLowerCase())) return;
    if (mode !== 'progress' && !window.confirm(titles[mode] + ' · ' + action.codigo + '. ' + (mode === 'deliver' ? 'La tarea quedará en revisión hasta la decisión de otra persona autorizada. ' : mode === 'approve' ? 'Se completará esta acción sobre la entrega vigente. ' : 'La acción volverá a ejecución y conservará la entrega y su motivo en el historial. ') + '¿Confirmar?')) return;
    busy.current = true; request.current = new AbortController(); setPending(true); onPending(true); onDirty(true); setError(undefined);
    try {
      const result = validateAction(mode === 'progress' ? await service.progress(company.empresaId, action.accionId, { revisionEsperada: action.revision, comentario: comment }, request.current.signal) : mode === 'deliver' ? await service.deliver(company.empresaId, action.accionId, { revisionEsperada: action.revision, comentario: comment, evidenciaId: selected?.evidenciaId || null }, request.current.signal) : await service.decide(company.empresaId, action.accionId, state.data.review!.event.eventoId, { revisionEsperada: action.revision, decision: mode === 'approve' ? 'APROBAR' : 'DEVOLVER', motivo: comment }, request.current.signal), action.accionId);
      const revision = action.revision + (!reviewing && action.estado === 'PENDIENTE' ? 2 : 1); const expected = mode === 'deliver' ? 'EN_REVISION' : mode === 'approve' ? 'COMPLETADA' : 'EN_EJECUCION';
      if (result.revision !== revision || result.estado !== expected || result.codigo !== action.codigo || ['riesgoId', 'hallazgoId', 'descripcion', 'resultadoEsperado', 'responsableMembresiaId', 'fechaLimite', 'evidenciaRequerida', 'descripcionEvidencia', 'justificacionSinEvidencia', 'resumenContextoRa'].some(key => result[key as keyof Action] !== action[key as keyof Action]) || result.evidenciasContexto.length !== action.evidenciasContexto.length || action.evidenciasContexto.some(item => !result.evidenciasContexto.some(saved => saved.evidenciaId === item.evidenciaId && saved.motivoContexto === item.motivoContexto))) throw new Error('Invalid action execution');
      if ((mode === 'deliver' && (!result.entregaVigenteId || result.entregaVigenteId === action.entregaVigenteId || result.finalizadaEn != null)) || (mode === 'approve' && (result.entregaVigenteId !== action.entregaVigenteId || !result.finalizadaEn)) || (mode === 'return' && (result.entregaVigenteId != null || result.finalizadaEn != null)) || (mode === 'progress' && ((result.entregaVigenteId ?? null) !== (action.entregaVigenteId ?? null) || result.finalizadaEn != null))) throw new Error('Invalid delivery metadata');
      if (current()) { onDirty(false); onSaved(); }
    } catch (failure) {
      if (!current()) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el resultado. Consulta la acción y su historial antes de otra escritura.');
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem); if ([0, 404, 409].includes(problem.status) || problem.status >= 500) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  return <Box component="form" aria-label={titles[mode]} onSubmit={submit} onChange={() => onDirty(true)} aria-busy={state.loading || pending}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" ref={heading} tabIndex={-1}>{titles[mode]}</Typography><Typography>{action.codigo} · Revisión {action.revision}</Typography>
    <Typography>{reviewing ? 'La decisión corresponde a la entrega vigente. Una persona AE/GS distinta de quien entregó puede aprobarla o devolverla; el servidor vuelve a comprobar identidad, revisión y evidencia aplicable.' : 'Solo el responsable actual puede registrar avances, adjuntar o entregar. El servidor verifica la asignación en cada operación. Un primer avance o entrega desde pendiente registra también el inicio; vencer el plazo no impide avanzar.'}</Typography>
    {state.loading && <Typography role="status">Consultando información para la decisión…</Typography>}{(error || state.error) && <ActionError error={(error || state.error)!} />}{error?.fields.map((item, index) => <Typography role="alert" color="error" key={index}>{item.field}: {item.message}</Typography>)}
    {state.data?.review && <Stack spacing={1}><Typography sx={{ whiteSpace: 'pre-wrap' }}>Entrega vigente: {state.data.review.event.comentario}</Typography><Typography>Entregada: {timestamp(state.data.review.event.creadaEn, company.zonaHoraria)} · Autor (identificador): {state.data.review.event.autorId}</Typography>{state.data.review.event.evidenciaId ? <ActionFile company={company.empresaId} actionId={action.accionId} evidenceId={state.data.review.event.evidenciaId} kind="action" name="evidencia-entrega" label="Descargar evidencia de la entrega vigente" service={service} scope={scope} onAuthorization={onAuthorization} /> : <Typography>Entrega sin adjunto, según los requisitos registrados en la tarea.</Typography>}{state.data.review.own && <Alert severity="warning">Esta entrega es tuya. Otra persona AE/GS debe revisarla; no puedes aprobarla ni devolverla aunque combines roles.</Alert>}</Stack>}
    {blocked && <Alert severity="warning">El estado o la revisión cambió, o el resultado puede haberse guardado. No se reenviará automáticamente. Confirma el descarte antes de consultar el servidor.</Alert>}
    <Box component="fieldset" disabled={pending || blocked || state.loading || Boolean(state.error || state.data?.review?.own) || !permitted} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={2}>
      <Typography component="label" htmlFor="action-execution-comment">{reviewing ? 'Motivo de la decisión *' : 'Comentario *'}</Typography><Box component="textarea" id="action-execution-comment" name="comentario" required rows={4} maxLength={2000} sx={fields} />
      {mode === 'deliver' && <><Typography component="label" htmlFor="action-delivery-evidence">{action.evidenciaRequerida ? 'Adjunto de la entrega *' : 'Adjunto de la entrega (opcional)'}</Typography><Box component="select" id="action-delivery-evidence" required={action.evidenciaRequerida} value={selected?.evidenciaId || ''} sx={fields} onChange={event => setSelected(state.data?.files?.elementos.find(item => item.evidenciaId === event.target.value) || (selected?.evidenciaId === event.target.value ? selected : undefined))}><option value="">{action.evidenciaRequerida ? 'Seleccionar…' : 'Sin adjunto'}</option>{selected && !state.data?.files?.elementos.some(item => item.evidenciaId === selected.evidenciaId) && <option value={selected.evidenciaId}>{selected.nombreOriginal} · Selección conservada</option>}{state.data?.files?.elementos.map(item => <option key={item.evidenciaId} value={item.evidenciaId}>{item.nombreOriginal} · {item.tamanoBytes} bytes · {item.estadoInspeccion}</option>)}</Box><Typography>Selecciona un archivo adjunto a esta acción. El servidor vuelve a comprobar su integridad e inspección. Los archivos de contexto no sustituyen el adjunto de la entrega. Para cargar otro, cancela y vuelve tras adjuntarlo.</Typography>{state.data?.files && !state.data.files.elementos.length && <Typography>No hay adjuntos de acción en esta página.</Typography>}{state.data?.files && <ActionPager page={page} more={state.data.files.hayMas} name="adjuntos de entrega" load={setPage} />}</>}
    </Stack></Box>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked || state.loading || Boolean(state.error || state.data?.review?.own) || !permitted}>{pending ? 'Guardando…' : titles[mode]}</Button><Button onClick={onCancel}>Cancelar y volver</Button>{(blocked || state.error) && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultará la acción y su historial. ¿Continuar?')) { onDirty(false); onSaved(); } }}>Descartar formulario y consultar estado</Button>}</Stack>
  </Stack></Box>;
}
