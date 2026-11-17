import { Alert, Box, Button, Link, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { EvaluationResults } from '../dashboard/CompanyDashboard';
import { timestamp } from '../dashboard/panel';
import { validateAnswers, validateClosure, validateEvaluation, validateEvidence, uuid } from './evaluations';
import type { Answer, AnswerPage, Closure, Evaluation, EvaluationService, EvidencePage } from './evaluations';
import { ReferencePicker } from './ReferencePicker';

export type LifecycleMode = { kind: 'submit' | 'return' | 'close' | 'correct' } | { kind: 'confirm'; answer: Answer };
const titles = { submit: 'Enviar a revisión', return: 'Devolver a borrador', close: 'Cerrar evaluación', correct: 'Crear corrección vinculada', confirm: 'Confirmar respuesta heredada' };
const fields = { width: '100%', minHeight: 44, p: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
const problem = (failure: unknown) => failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar la información.');
type Selection = { id: string; label: string };
export default function EvaluationLifecycle({ companyId, evaluation, mode, service, scope, onSaved, onCancel, onAuthorization, onDirty, onPending }: {
  companyId: string; evaluation: Evaluation; mode: LifecycleMode; service: EvaluationService; scope?: AbortSignal;
  onSaved: (created?: Evaluation) => void; onCancel: () => void; onAuthorization: (error: ApiError) => void; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void;
}) {
  const reviewing = mode.kind === 'submit' || mode.kind === 'close';
  const [page, setPage] = useState(0); const [attempt, setAttempt] = useState(0); const [answers, setAnswers] = useState<AnswerPage>();
  const [previous, setPrevious] = useState<Closure>(); const [loading, setLoading] = useState(reviewing); const [readError, setReadError] = useState<ApiError>();
  const [selection, setSelection] = useState<Record<string, Selection>>({}); const [responsible, setResponsible] = useState('');
  const [error, setError] = useState<ApiError>(); const [pending, setPending] = useState(false); const [blocked, setBlocked] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null); const alive = useRef(false); const busy = useRef(false); const controller = useRef<AbortController | undefined>(undefined);
  const seen = useRef(new Map<string, string>());
  useEffect(() => { alive.current = true; heading.current?.focus(); return () => { alive.current = false; controller.current?.abort(); onDirty(false); onPending(false); }; }, [onDirty, onPending]);
  useEffect(() => {
    if (!reviewing) return;
    const request = new AbortController(); setLoading(true); setReadError(undefined); setAnswers(undefined); setPrevious(undefined);
    void (async () => {
      const result = validateAnswers(await service.answers(companyId, evaluation.evaluacionId, { pagina: page, tamano: 5 }, request.signal), { pagina: page }, evaluation);
      if (result.elementos.some(item => item.revisionEvaluacion !== evaluation.revision)) throw new ApiError(409, 'REVISION_DESACTUALIZADA', 'La evaluación cambió. Vuelve a consultar su ficha.');
      const closure = evaluation.evaluacionAnteriorId ? validateClosure(await service.closure(companyId, evaluation.evaluacionAnteriorId, request.signal), evaluation.evaluacionAnteriorId) : undefined;
      if (request.signal.aborted || scope?.aborted) return;
      result.elementos.forEach(item => seen.current.set(item.respuestaId, item.codigo)); setAnswers(result); setPrevious(closure);
    })().catch(failure => {
      if (request.signal.aborted || scope?.aborted) return; const issue = problem(failure); setReadError(issue);
      if ([401, 403].includes(issue.status)) onAuthorization(issue);
      if (issue.status === 409) setBlocked(true);
    }).finally(() => { if (!request.signal.aborted && !scope?.aborted) setLoading(false); });
    return () => request.abort();
  }, [reviewing, companyId, evaluation, service, page, attempt, scope, onAuthorization]);
  const current = () => alive.current && !controller.current?.signal.aborted && !scope?.aborted;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy.current || blocked || scope?.aborted || (reviewing && (loading || readError))) return;
    const expectedState = mode.kind === 'submit' || mode.kind === 'confirm' ? 'BORRADOR' : mode.kind === 'correct' ? 'CERRADA' : 'EN_REVISION';
    if (evaluation.estado !== expectedState || (mode.kind === 'confirm' && (!mode.answer.respuestaAnteriorId || mode.answer.heredadaConfirmada || mode.answer.revisionEvaluacion !== evaluation.revision))) return;
    const data = new FormData(event.currentTarget); const motivo = String(data.get('motivo') || '').trim();
    if (((mode.kind === 'return' || mode.kind === 'correct') && (!motivo || motivo.length > 2000)) || (mode.kind === 'correct' && !uuid.test(responsible))) {
      setError(new ApiError(400, 'DATOS_INCOMPLETOS', 'Indica el motivo y, para una corrección, selecciona un responsable disponible.')); return;
    }
    if (!window.confirm(`${titles[mode.kind]}: ${evaluation.nombre}. ${mode.kind === 'close' ? 'El cierre quedará inmutable; las correcciones crearán otro registro.' : 'Se registrará esta operación.'} ¿Continuar?`)) return;
    const request = controller.current = new AbortController(); busy.current = true; setPending(true); setError(undefined); onDirty(true); onPending(true);
    try {
      const revisionEsperada = evaluation.revision;
      const body = { revisionEsperada, evidencias: Object.fromEntries(Object.entries(selection).map(([id, value]) => [id, value.id])) };
      let created: Evaluation | undefined;
      if (mode.kind === 'confirm') {
        const response = await service.confirmInherited(companyId, evaluation.evaluacionId, mode.answer.respuestaId, revisionEsperada, request.signal);
        validateAnswers({ elementos: [response], pagina: 0, tamano: 5, hayMas: false }, {}, evaluation);
        if (response.respuestaId !== mode.answer.respuestaId || response.respuestaAnteriorId !== mode.answer.respuestaAnteriorId || !response.heredadaConfirmada || response.revisionEvaluacion !== revisionEsperada + 1) throw new Error('Invalid inherited confirmation');
      } else {
        const result = validateEvaluation(mode.kind === 'submit' ? await service.submit(companyId, evaluation.evaluacionId, body, request.signal)
          : mode.kind === 'close' ? await service.close(companyId, evaluation.evaluacionId, body, request.signal)
            : mode.kind === 'return' ? await service.returnDraft(companyId, evaluation.evaluacionId, { revisionEsperada, motivo }, request.signal)
              : await service.correct(companyId, evaluation.evaluacionId, { revisionEsperada, motivo, responsableId: responsible }, request.signal));
        const targetState = mode.kind === 'submit' ? 'EN_REVISION' : mode.kind === 'close' ? 'CERRADA' : 'BORRADOR';
        if (result.estado !== targetState || result.versionCatalogoId !== evaluation.versionCatalogoId || result.versionMetodologiaId !== evaluation.versionMetodologiaId
          || (mode.kind === 'correct' ? result.evaluacionId === evaluation.evaluacionId || result.evaluacionAnteriorId !== evaluation.evaluacionId || result.responsableId !== responsible
            : result.evaluacionId !== evaluation.evaluacionId || result.revision !== revisionEsperada + 1)
          || (mode.kind === 'close' && (!result.cerradaEn || !result.cerradaPor || !uuid.test(result.cerradaPor)))) throw new Error('Invalid evaluation transition');
        if (mode.kind === 'correct') created = result;
      }
      if (current()) { onDirty(false); onSaved(created); }
    } catch (failure) {
      if (!current()) return; const issue = problem(failure);
      if (issue.status === 401 || (issue.status === 403 && issue.code !== 'CSRF_INVALIDO')) { onDirty(false); onAuthorization(issue); return; }
      setError(issue);
      if (issue.status === 0 || issue.status >= 500 || issue.status === 404 || (issue.status === 409 && issue.code !== 'EVALUACION_INCOMPLETA')) setBlocked(true);
    } finally { busy.current = false; if (current()) { setPending(false); onPending(false); } }
  }
  const issueLabel = (field: string) => { const match = /^respuestas\.([0-9a-f-]{36})\.(.+)$/i.exec(field); return match ? `Respuesta ${seen.current.get(match[1]) || match[1]} · ${match[2]}` : field; };
  return <Box component="form" aria-label={titles[mode.kind]} onSubmit={submit} onChange={() => onDirty(true)} aria-busy={pending || loading}><Stack spacing={3} sx={{ overflowWrap: 'anywhere' }}>
    <Typography variant="h2" ref={heading} tabIndex={-1}>{titles[mode.kind]}</Typography><Typography>{evaluation.nombre} · Revisión {evaluation.revision}</Typography>
    <Typography>{mode.kind === 'correct' ? 'Se creará otro borrador vinculado, conservando el cierre original y sus versiones. Sus respuestas heredadas deberán confirmarse o actualizarse.' : mode.kind === 'confirm' ? 'Confirma los valores heredados sin modificarlos. Comprueba la aplicabilidad, nota y fundamento antes de continuar.' : mode.kind === 'return' ? 'La evaluación volverá a permitir cambios. Indica el motivo de la devolución.' : 'El servidor comprueba toda la evaluación: aplicabilidad resuelta, calificación y fundamento, herencia confirmada y un adjunto íntegro por respuesta con nota mayor que cero. Cero no requiere adjunto por esta política. No aplica conserva su justificación.'}</Typography>
    {error && <Alert severity="error"><Stack spacing={1}><Typography>{error.message}</Typography>{error.correlationId && <Typography>Referencia de soporte: {error.correlationId}</Typography>}
      {error.fields.length > 0 && <Box component="ul" sx={{ pl: 2 }}>{error.fields.map((field, index) => <Typography component="li" key={index} sx={{ overflowWrap: 'anywhere' }}>{issueLabel(field.field)}: {field.message}</Typography>)}</Box>}
    </Stack></Alert>}{error?.retryAfter !== undefined && <Typography>El servidor indicó esperar {error.retryAfter} segundos antes de reintentar.</Typography>}
    {error?.code === 'EVALUACION_INCOMPLETA' && <Alert severity="info">Los faltantes corresponden a toda la evaluación. Puedes ajustar las evidencias y reintentar; para completar o confirmar respuestas, cancela y vuelve al borrador.</Alert>}
    {readError && <Alert severity="error">{readError.message}</Alert>}
    {blocked && <Alert severity="warning">{error?.status === 0 || (error?.status || 0) >= 500 ? 'El resultado no se confirmó y puede haberse aplicado. No se reenviará automáticamente.' : 'El estado, revisión o política impide continuar. Se conserva tu selección hasta que decidas descartarla.'}{mode.kind === 'correct' && ' No crees otra corrección sin comprobar si ya existe.'}</Alert>}
    <Box component="fieldset" disabled={pending || blocked} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={3}>
      {(mode.kind === 'return' || mode.kind === 'correct') && <Stack spacing={1}><Typography component="label" htmlFor="lifecycle-reason">Motivo *</Typography><Box component="textarea" id="lifecycle-reason" name="motivo" rows={4} required maxLength={2000} sx={fields} /></Stack>}
      {mode.kind === 'correct' && <ReferencePicker company={companyId} name="responsableId" service={service} scope={scope} onAuthorization={onAuthorization} onChange={id => { setResponsible(id); onDirty(true); }} />}
      {mode.kind === 'confirm' && <Paper sx={{ p: 2 }}><Typography>{mode.answer.codigo} · {mode.answer.titulo}</Typography><Typography>Aplicabilidad: {mode.answer.respuesta.aplicabilidad === 'APLICA' ? 'Aplica' : mode.answer.respuesta.aplicabilidad === 'NO_APLICA' ? 'No aplica' : 'Sin decidir'}</Typography><Typography>Calificación: {mode.answer.respuesta.aplicabilidad === 'NO_APLICA' ? 'No aplica' : mode.answer.respuesta.calificacion === null ? 'Pendiente' : `${mode.answer.respuesta.calificacion} / 100`}</Typography><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Fundamento: {mode.answer.respuesta.fundamento || 'Pendiente'}</Typography><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Justificación: {mode.answer.respuesta.justificacionAplicabilidad || 'No registrada'}</Typography></Paper>}
      {reviewing && <>
        <Typography variant="h2" component="h3">Evidencias para {mode.kind === 'close' ? 'el cierre' : 'la revisión'}</Typography><Typography>Selección explícita: {Object.keys(selection).length} adjuntos. Se conserva al paginar y no se preselecciona ninguna evidencia. En el cierre debes revisar y seleccionar los adjuntos nuevamente. La carga de nuevos archivos corresponde a otra historia.</Typography>
        {loading && <Typography role="status">Consultando respuestas y referencias históricas…</Typography>}
        <Button disabled={loading} onClick={() => setAttempt(attempt + 1)}>Actualizar esta página de respuestas</Button>
        {answers && <>{!answers.elementos.length && <Alert severity="info">No hay respuestas en esta página.</Alert>}{answers.elementos.map(answer => <Paper key={answer.respuestaId} component="article" sx={{ p: 2 }}><Stack spacing={2}>
          <Typography variant="h2" component="h4">{answer.codigo} · {answer.titulo}</Typography><Typography>{answer.respuesta.aplicabilidad === 'NO_APLICA' ? 'No aplica' : answer.respuesta.aplicabilidad === 'SIN_DECIDIR' ? 'Sin decidir' : answer.respuesta.calificacion === null ? 'Pendiente' : `${answer.respuesta.calificacion} / 100`}{answer.respuestaAnteriorId && !answer.heredadaConfirmada ? ' · Heredada pendiente de confirmar' : ''}</Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Fundamento: {answer.respuesta.fundamento || 'Pendiente'}</Typography>
          {answer.respuesta.aplicabilidad === 'NO_APLICA' && <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Justificación: {answer.respuesta.justificacionAplicabilidad || 'Pendiente'}</Typography>}
          {answer.respuesta.aplicabilidad === 'APLICA' ? <EvidencePicker key={answer.respuestaId} company={companyId} evaluation={evaluation} answer={answer} service={service} scope={scope} onAuthorization={onAuthorization}
            selected={selection[answer.respuestaId]} inherited={answer.respuestaAnteriorId ? previous?.instantanea.evidencias[answer.respuestaAnteriorId] : undefined}
            onChange={value => { setSelection(prior => { const next = { ...prior }; if (value) next[answer.respuestaId] = value; else delete next[answer.respuestaId]; return next; }); onDirty(true); }} /> : <Typography>La selección de adjuntos corresponde a respuestas aplicables.</Typography>}
        </Stack></Paper>)}<Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}><Button disabled={loading || page === 0} onClick={() => setPage(page - 1)}>Página anterior de respuestas</Button><Typography sx={{ alignSelf: 'center' }}>Página {page + 1}</Typography><Button disabled={loading || !answers.hayMas} onClick={() => setPage(page + 1)}>Página siguiente de respuestas</Button></Stack></>}
      </>}
    </Stack></Box>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained" disabled={pending || blocked || (reviewing && (loading || Boolean(readError)))}>{pending ? 'Procesando…' : titles[mode.kind]}</Button><Button onClick={onCancel}>Cancelar y volver</Button>
      {blocked && <Button disabled={pending} onClick={() => { if (window.confirm('Se descartará el formulario y se consultará el estado actual de la evaluación. ¿Continuar?')) { onDirty(false); onSaved(); } }}>Descartar formulario y consultar estado</Button>}
    </Stack>
  </Stack></Box>;
}

function EvidencePicker({ company, evaluation, answer, service, scope, onAuthorization, selected, inherited, onChange }: { company: string; evaluation: Evaluation; answer: Answer; service: EvaluationService; scope?: AbortSignal; onAuthorization: (error: ApiError) => void; selected?: Selection; inherited?: Closure['instantanea']['evidencias'][string]; onChange: (value?: Selection) => void }) {
  const [open, setOpen] = useState(false); const [page, setPage] = useState(0); const [attempt, setAttempt] = useState(0); const [data, setData] = useState<EvidencePage>(); const [error, setError] = useState<ApiError>(); const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    const request = new AbortController(); setData(undefined); setError(undefined); setLoading(true);
    void service.evidence(company, evaluation.evaluacionId, answer.respuestaId, page, request.signal).then(value => {
      validateEvidence(value, page); if (!request.signal.aborted && !scope?.aborted) setData(value);
    }).catch(failure => { if (request.signal.aborted || scope?.aborted) return; const issue = problem(failure); setError(issue); if ([401, 403].includes(issue.status)) onAuthorization(issue); })
      .finally(() => { if (!request.signal.aborted && !scope?.aborted) setLoading(false); });
    return () => request.abort();
  }, [open, page, attempt, company, evaluation.evaluacionId, answer.respuestaId, service, scope, onAuthorization]);
  return <Stack spacing={1}><Typography>Adjunto seleccionado: {selected?.label || 'Ninguno'}</Typography><Button onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Ocultar' : 'Elegir'} adjunto de {answer.codigo}</Button>
    {open && <Stack spacing={1} aria-busy={loading}>
      {loading && <Typography role="status">Consultando adjuntos de {answer.codigo}…</Typography>}{error && <Alert severity="error">{error.message}</Alert>}
      <Typography component="label" htmlFor={'proof-' + answer.respuestaId}>Adjunto para {answer.codigo}</Typography>
      <Box component="select" id={'proof-' + answer.respuestaId} value={selected?.id || ''} disabled={loading || Boolean(error)} sx={fields} onChange={event => {
        const id = event.target.value; const item = data?.elementos.find(item => item.evidenciaId === id);
        onChange(item ? { id, label: item.nombreOriginal } : inherited?.evidenciaId === id ? { id, label: 'Adjunto del cierre anterior · ' + id } : selected?.id === id ? selected : undefined);
      }}><option value="">Sin adjunto seleccionado</option>{selected && !data?.elementos.some(item => item.evidenciaId === selected.id) && inherited?.evidenciaId !== selected.id && <option value={selected.id}>{selected.label}</option>}
        {inherited && <option value={inherited.evidenciaId}>Adjunto del cierre anterior · {inherited.evidenciaId}</option>}{data?.elementos.map(item => <option key={item.evidenciaId} value={item.evidenciaId} disabled={item.estadoInspeccion !== 'LIMPIA'}>{item.nombreOriginal} · {item.estadoInspeccion === 'LIMPIA' ? 'Inspección limpia registrada' : item.estadoInspeccion === 'PENDIENTE' ? 'Inspección pendiente' : 'Error de inspección'}</option>)}
      </Box>{inherited && <Link href={`#/empresas/${company}/evaluaciones/${inherited.evaluacionOrigenId}`}>Consultar origen del adjunto histórico</Link>}
      {!loading && data && !data.elementos.length && <Typography>No hay adjuntos en esta página.</Typography>}
      <Typography variant="body2">La inspección mostrada es el último estado registrado. El servidor verificará asociación, integridad y autorización al continuar.</Typography>
      <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}><Button disabled={loading || page === 0} aria-label={'Adjuntos anteriores de ' + answer.codigo} onClick={() => setPage(page - 1)}>Anterior</Button><Typography sx={{ alignSelf: 'center' }}>Página {page + 1}</Typography><Button disabled={loading || !data?.hayMas} aria-label={'Adjuntos siguientes de ' + answer.codigo} onClick={() => setPage(page + 1)}>Siguiente</Button><Button disabled={loading} aria-label={'Actualizar adjuntos de ' + answer.codigo} onClick={() => setAttempt(attempt + 1)}>Actualizar</Button></Stack>
    </Stack>}
  </Stack>;
}

export function ClosureView({ company, evaluation, service, scope, onAuthorization, zone }: { company: string; evaluation: Evaluation; service: EvaluationService; scope?: AbortSignal; onAuthorization: (error: ApiError) => void; zone: string }) {
  const [attempt, setAttempt] = useState(0); const [data, setData] = useState<Closure>(); const [error, setError] = useState<ApiError>(); const [loading, setLoading] = useState(true);
  useEffect(() => {
    const request = new AbortController(); setLoading(true); setData(undefined); setError(undefined);
    void service.closure(company, evaluation.evaluacionId, request.signal).then(value => { validateClosure(value, evaluation.evaluacionId, evaluation); if (!request.signal.aborted && !scope?.aborted) setData(value); })
      .catch(failure => { if (request.signal.aborted || scope?.aborted) return; const issue = problem(failure); setError(issue); if ([401, 403].includes(issue.status)) onAuthorization(issue); })
      .finally(() => { if (!request.signal.aborted && !scope?.aborted) setLoading(false); });
    return () => request.abort();
  }, [company, evaluation, service, scope, onAuthorization, attempt]);
  return <Stack spacing={2} aria-busy={loading}><Typography variant="h2" component="h3">Cierre conservado</Typography>{loading && <Typography role="status">Consultando instantánea del cierre…</Typography>}{error && <Alert severity="error">{error.message}</Alert>}<Button disabled={loading} onClick={() => setAttempt(attempt + 1)}>Actualizar cierre</Button>
    {data && <><Typography>Instantánea inmutable · {timestamp(data.cerradaEn, zone)}</Typography><EvaluationResults data={data.instantanea.resultados} name={evaluation.nombre} panelSnapshot={false} />
      <Box component="details"><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Referencias del cierre y evidencias conservadas</Typography><Stack spacing={1} sx={{ overflowWrap: 'anywhere' }}><Typography>Política: {data.instantanea.politica}</Typography><Typography>Persona que cerró: {data.cerradaPor}</Typography><Typography>Catálogo: {data.versionCatalogoId} · Metodología: {data.versionMetodologiaId}</Typography>
        {!Object.keys(data.instantanea.evidencias).length && <Typography>Sin adjuntos seleccionados en el cierre. No equivale a ausencia de fundamento.</Typography>}
        {Object.entries(data.instantanea.evidencias).map(([response, proof]) => <Box key={response}><Typography>Respuesta: {response} · Adjunto: {proof.evidenciaId}</Typography><Link href={`#/empresas/${company}/evaluaciones/${proof.evaluacionOrigenId}`}>Consultar evaluación de origen</Link><Typography>Respuesta de origen: {proof.respuestaOrigenId}</Typography><Typography>Huella SHA-256: {proof.sha256}</Typography></Box>)}
      </Stack></Box></>}
  </Stack>;
}
