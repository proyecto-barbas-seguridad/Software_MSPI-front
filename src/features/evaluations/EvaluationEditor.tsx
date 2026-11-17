import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { ReferencePicker } from './ReferencePicker';
import { validateAnswers, validateEvaluation, validateFinding, uuid } from './evaluations';
import type { Answer, EditAnswer, Evaluation, EvaluationService, Finding, NewEvaluation } from './evaluations';

export type Editor = { kind: 'create' } | { kind: 'answer'; answer: Answer } | { kind: 'finding'; answer: Answer; finding?: Finding };
const fields = { width: '100%', minHeight: 44, px: 1.5, py: 1, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
const titles = { create: 'Crear evaluación', answer: 'Diligenciar respuesta', finding: 'Registrar hallazgo' };
export default function EvaluationEditor({ companyId, mode, evaluation, service, scope, onSaved, onCancel, onAuthorization, onDirty, onPending }: {
  companyId: string; mode: Editor; evaluation?: Evaluation; service: EvaluationService; scope?: AbortSignal;
  onSaved: (created?: Evaluation) => void; onCancel: () => void; onAuthorization: (error: ApiError) => void;
  onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void;
}) {
  const [error, setError] = useState<ApiError>(); const [pending, setPending] = useState(false); const [blocked, setBlocked] = useState(false);
  const [refs, setRefs] = useState({ responsableId: '', versionCatalogoId: '', versionMetodologiaId: '' });
  const answer = mode.kind === 'create' ? undefined : mode.answer;
  const finding = mode.kind === 'finding' ? mode.finding : undefined;
  const [applicability, setApplicability] = useState<EditAnswer['aplicabilidad']>(answer?.respuesta.aplicabilidad || 'SIN_DECIDIR');
  const alive = useRef(false); const busy = useRef(false); const request = useRef<AbortController | undefined>(undefined); const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; request.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  const current = () => alive.current && !request.current?.signal.aborted && !scope?.aborted;
  const fieldError = (name: string) => error?.fields.find(value => value.field === name || value.field === 'respuesta.' + name)?.message;
  const field = (name: string, label: string, value = '', required = false, multiline = false, maxLength?: number, type = 'text') => <Stack spacing={1}>
    <Typography component="label" htmlFor={'evaluation-' + name}>{label}{required ? ' *' : ''}</Typography>
    {multiline ? <Box component="textarea" id={'evaluation-' + name} name={name} rows={4} defaultValue={value} required={required} maxLength={maxLength} aria-invalid={Boolean(fieldError(name))} aria-describedby={fieldError(name) ? 'error-' + name : undefined} sx={fields} />
      : <Box component="input" id={'evaluation-' + name} name={name} type={type} defaultValue={value} required={required} maxLength={maxLength} aria-invalid={Boolean(fieldError(name))} aria-describedby={fieldError(name) ? 'error-' + name : undefined} sx={fields} />}
    {fieldError(name) && <Typography id={'error-' + name} role="alert" color="error">{fieldError(name)}</Typography>}
  </Stack>;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || scope?.aborted) return;
    if (mode.kind !== 'create' && (!evaluation || evaluation.estado !== 'BORRADOR' || answer?.revisionEvaluacion !== evaluation.revision || (finding && finding.revisionEvaluacion !== evaluation.revision))) return;
    const data = new FormData(event.currentTarget); const value = (name: string) => String(data.get(name) || '').trim();
    const body: NewEvaluation = { nombre: value('nombre'), fechaEvaluacion: value('fechaEvaluacion'), alcance: value('alcance'), ...refs };
    const response: EditAnswer = { revisionEsperada: answer?.revisionEvaluacion || 0, aplicabilidad: applicability,
      calificacion: applicability === 'APLICA' && value('calificacion') !== '' ? Number(value('calificacion')) as EditAnswer['calificacion'] : null,
      fundamento: value('fundamento') || null, justificacionAplicabilidad: applicability === 'NO_APLICA' ? value('justificacionAplicabilidad') || null : null };
    if ((mode.kind === 'create' && (!body.nombre || !body.alcance || !body.fechaEvaluacion || Object.values(refs).some(id => !uuid.test(id))))
      || (mode.kind === 'answer' && ((response.calificacion !== null && !response.fundamento) || (applicability === 'NO_APLICA' && (answer?.tipo !== 'CONTROL' || !response.justificacionAplicabilidad))))
      || (mode.kind === 'finding' && !value('descripcionBrecha'))) {
      setError(new ApiError(400, 'DATOS_INCOMPLETOS', 'Completa los campos obligatorios, las referencias y el fundamento de cualquier nota, incluida cero.')); return;
    }
    const controller = request.current = new AbortController(); busy.current = true; setPending(true); onDirty(true); onPending(true); setError(undefined);
    try {
      let created: Evaluation | undefined;
      if (mode.kind === 'create') created = validateEvaluation(await service.create(companyId, body, controller.signal));
      else if (mode.kind === 'answer') {
        const result = await service.editAnswer(companyId, evaluation!.evaluacionId, mode.answer.respuestaId, response, controller.signal);
        validateAnswers({ elementos: [result], pagina: 0, tamano: 5, hayMas: false }, {}, evaluation!);
        if (result.respuestaId !== mode.answer.respuestaId || result.revisionEvaluacion !== response.revisionEsperada + 1) throw new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar la respuesta guardada.');
      } else {
        const body = { revisionEsperada: finding?.revisionEvaluacion ?? mode.answer.revisionEvaluacion, descripcionBrecha: value('descripcionBrecha'), recomendacion: value('recomendacion') || null };
        const result = validateFinding(finding ? await service.editFinding(companyId, evaluation!.evaluacionId, mode.answer.respuestaId, finding.hallazgoId, body, controller.signal)
          : await service.createFinding(companyId, evaluation!.evaluacionId, mode.answer.respuestaId, body, controller.signal), mode.answer.respuestaId);
        if (result.revisionEvaluacion !== body.revisionEsperada + 1 || (finding && result.hallazgoId !== finding.hallazgoId)) throw new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el hallazgo guardado.');
      }
      if (current()) { onDirty(false); onSaved(created); }
    } catch (failure) {
      if (!current()) return;
      const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar el resultado.');
      if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(problem); return; }
      setError(problem); if (problem.status === 0 || problem.status >= 500 || problem.status === 409 || problem.status === 404) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  return <Box component="form" aria-label={finding ? 'Editar hallazgo' : titles[mode.kind]} onSubmit={submit} onChange={() => onDirty(true)} aria-busy={pending}><Stack spacing={3}>
    <Typography variant="h2" tabIndex={-1} ref={heading}>{finding ? 'Editar hallazgo' : titles[mode.kind]}</Typography>
    <Typography>{answer ? `${answer.codigo} · ${answer.titulo} · Revisión ${answer.revisionEvaluacion}` : 'Las referencias elegidas quedarán fijadas al crear el borrador. * Campo obligatorio.'}</Typography>
    {error && <Alert severity="error">{error.code === 'REVISION_DESACTUALIZADA' ? 'La evaluación cambió. Consulta su estado actual antes de volver a editar.' : error.message}{error.correlationId && ` Referencia de soporte: ${error.correlationId}`}</Alert>}
    {error?.retryAfter !== undefined && <Typography>El servidor indicó esperar {error.retryAfter} segundos antes de reintentar.</Typography>}
    {blocked && <Alert severity="warning">{error?.status === 0 || (error?.status || 0) >= 500 ? 'No se confirmó el resultado. Puede haberse guardado. No se reenviará automáticamente. Consulta el estado antes de otra escritura.' : 'Se conserva tu formulario. El recurso, estado, revisión o referencias cambiaron; consulta de nuevo antes de editar.'}{mode.kind === 'create' && ' El nombre no es único: encontrar uno igual no confirma por sí solo esta operación.'}</Alert>}
    <Box component="fieldset" disabled={pending || blocked} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={3}>
      {mode.kind === 'create' ? <>
        {field('nombre', 'Nombre', '', true, false, 200)}{field('fechaEvaluacion', 'Fecha de evaluación', '', true, false, undefined, 'date')}{field('alcance', 'Alcance', '', true, true)}
        {(['responsableId', 'versionCatalogoId', 'versionMetodologiaId'] as const).map(name => <ReferencePicker key={name} name={name} company={companyId} service={service} scope={scope} onAuthorization={onAuthorization} onChange={id => { setRefs(previous => ({ ...previous, [name]: id })); onDirty(true); }} />)}
        {(['responsableId', 'versionCatalogoId', 'versionMetodologiaId'] as const).map(name => fieldError(name) && <Typography key={name} role="alert" color="error">{fieldError(name)}</Typography>)}
      </> : mode.kind === 'answer' ? <>
        <Stack spacing={1}><Typography component="label" htmlFor="evaluation-applicability">Aplicabilidad</Typography><Box component="select" id="evaluation-applicability" value={applicability} onChange={event => setApplicability(event.target.value as EditAnswer['aplicabilidad'])} sx={fields}>
          <option value="SIN_DECIDIR">Sin decidir</option><option value="APLICA">Aplica</option>{answer?.tipo === 'CONTROL' && <option value="NO_APLICA">No aplica</option>}</Box>{fieldError('aplicabilidad') && <Typography role="alert" color="error">{fieldError('aplicabilidad')}</Typography>}</Stack>
        <Stack spacing={1}><Typography component="label" htmlFor="evaluation-score">Calificación</Typography><Box component="select" id="evaluation-score" name="calificacion" disabled={applicability !== 'APLICA'} defaultValue={answer?.respuesta.calificacion ?? ''} sx={fields}>
          <option value="">Pendiente</option>{[0, 20, 40, 60, 80, 100].map(score => <option key={score} value={score}>{score} / 100</option>)}</Box>{fieldError('calificacion') && <Typography role="alert" color="error">{fieldError('calificacion')}</Typography>}</Stack>
        {applicability === 'NO_APLICA' && field('justificacionAplicabilidad', 'Justificación de no aplica', answer?.respuesta.justificacionAplicabilidad || '', true, true, 2000)}
        {field('fundamento', 'Fundamento (obligatorio al calificar)', answer?.respuesta.fundamento || '', false, true)}
        <Typography color="text.secondary">Puedes guardar pendientes. Cero es una calificación y requiere fundamento. Guardar confirma también las respuestas heredadas.</Typography>
      </> : <>{field('descripcionBrecha', 'Descripción de la brecha', finding?.hallazgo.descripcionBrecha || '', true, true)}{field('recomendacion', 'Recomendación (opcional)', finding?.hallazgo.recomendacion || '', false, true)}</>}
    </Stack></Box>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked}>{pending ? 'Guardando…' : 'Guardar borrador'}</Button><Button onClick={onCancel}>Cancelar y volver</Button>
      {blocked && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultará el estado actual. ¿Continuar?')) { onDirty(false); onSaved(); } }}>Descartar formulario y consultar estado</Button>}
    </Stack>
  </Stack></Box>;
}
