import { Alert, Box, Button, Chip, Link, Paper, Stack, Typography } from '@mui/material';
import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ApiError } from '../../shared/api/client';
import { accessMessage, capabilities } from '../access/workspace';
import type { Company } from '../access/workspace';
import { EvaluationResults } from '../dashboard/CompanyDashboard';
import { date, labels, timestamp } from '../dashboard/panel';
import { EvaluationStore, states, validateEvidence, validateFinding, validatePage } from './evaluations';
import type { Answer, AnswerQuery, Evidence, EvidencePage, EvaluationService, Finding, FindingPage } from './evaluations';

import type { Editor } from './EvaluationEditor';
import type { LifecycleMode } from './EvaluationLifecycle';
const EvaluationLifecycle = lazy(() => import('./EvaluationLifecycle'));
const ClosureView = lazy(() => import('./EvaluationLifecycle').then(module => ({ default: module.ClosureView })));
const EvidenceUpload = lazy(() => import('./EvidenceUpload'));
const EvaluationEditor = lazy(() => import('./EvaluationEditor'));
const noop = () => {};
const allow = () => true;
const fields = { width: '100%', minHeight: 44, px: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
function Pager({ label, page, more, load }: { label: string; page: number; more: boolean; load: (page: number) => void }) {
  return <Stack direction="row" useFlexGap sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }} aria-label={'Paginación de ' + label}>
    <Button disabled={page === 0} aria-label={'Anterior en ' + label} onClick={() => load(page - 1)}>Anterior</Button><Typography>Página {page + 1}</Typography>
    <Button disabled={!more} aria-label={'Siguiente en ' + label} onClick={() => load(page + 1)}>Siguiente</Button>
  </Stack>;
}
function Details({ children }: { children: ReactNode }) {
  return <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px,1fr) minmax(0,2fr)' }, gap: 1, '& dt': { color: 'text.secondary' }, '& dd': { m: 0, mb: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } }}>{children}</Box>;
}
function ErrorNotice({ error }: { error: ApiError }) {
  const message = error.code === 'EVIDENCIA_BLOQUEADA' ? 'El archivo no superó la inspección de seguridad y no se descargó.'
    : error.code === 'INSPECCION_EVIDENCIAS_NO_DISPONIBLE' ? 'No se pudo verificar la seguridad del archivo. Intenta descargarlo más tarde.'
      : error.code === 'ALMACENAMIENTO_EVIDENCIAS_NO_DISPONIBLE' ? 'El archivo no está disponible temporalmente.'
        : error.status === 404 ? 'La evaluación o el recurso no está disponible en esta empresa.' : accessMessage(error);
  return <Alert severity="error">{message}{error.correlationId && ` Referencia de soporte: ${error.correlationId}`}{error.retryAfter !== undefined && ` El servidor indicó esperar ${error.retryAfter} segundos antes de reintentar.`}</Alert>;
}
export default function EvaluationWorkspace({ company, evaluationId, page = 0, query, service, scope, onAuthorization, onPage, onQuery, onDirty = noop, onPending = noop, onLeave = allow }: {
  company: Company; evaluationId?: string; page?: number; service: EvaluationService; onAuthorization: (error: ApiError) => void; onPage: (page: number) => void;
  query?: AnswerQuery; onQuery?: (query: AnswerQuery) => void;
  scope?: AbortSignal; onDirty?: (dirty: boolean) => void; onPending?: (pending: boolean) => void; onLeave?: () => boolean;
}) {
  const [editor, setEditor] = useState<Editor>();
  const [upload, setUpload] = useState<Answer>();
  const [expandedEvidence, setExpandedEvidence] = useState<string>();
  const [lifecycle, setLifecycle] = useState<LifecycleMode>();
  const [notice, setNotice] = useState<string>();
  const [store] = useState(() => new EvaluationStore(company.empresaId, service, onAuthorization, scope));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const heading = useRef<HTMLHeadingElement>(null);
  const base = '#/empresas/' + company.empresaId + '/evaluaciones';
  useEffect(() => { setEditor(undefined); setLifecycle(undefined); setUpload(undefined); setExpandedEvidence(undefined); if (evaluationId) void store.detail(evaluationId, query); else void store.list(page); return () => store.dispose(); }, [store, evaluationId, page, query]);
  useEffect(() => { if (state.status !== 'loading') heading.current?.focus(); }, [state.status]);
  const list = (page: number) => { onPage(page); void store.list(page); };
  const detail = (query: AnswerQuery = {}) => { onQuery?.(query); void store.detail(evaluationId!, query); };
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const type = String(form.get('tipo') || '');
    detail({ pagina: 0, tipo: type === 'CONTROL' || type === 'CLAUSULA' ? type : undefined, grupo: String(form.get('grupo') || '').trim() || undefined });
  }
  const evaluation = state.evaluation;
  if (upload && evaluation) return <Suspense fallback={<Typography role="status">Abriendo carga de evidencia…</Typography>}><EvidenceUpload companyId={company.empresaId} evaluation={evaluation} answer={upload} service={service} scope={scope} onAuthorization={onAuthorization} onDirty={onDirty} onPending={onPending}
    onCancel={() => { if (onLeave()) setUpload(undefined); }} onSaved={evidence => { setExpandedEvidence(upload.respuestaId); setUpload(undefined); setNotice(evidence ? `Carga confirmada: ${evidence.nombreOriginal}. Consulta actualizada del servidor; el adjunto no se selecciona automáticamente para revisión o cierre.` : 'Consulta actualizada del servidor. Revisa las evidencias y la revisión antes de otra carga.'); void store.retry(); }} /></Suspense>;
  if (lifecycle && evaluation) return <Suspense fallback={<Typography role="status">Abriendo ciclo de evaluación…</Typography>}><EvaluationLifecycle companyId={company.empresaId} evaluation={evaluation} mode={lifecycle} service={service} scope={scope} onAuthorization={onAuthorization} onDirty={onDirty} onPending={onPending}
    onCancel={() => { if (onLeave()) setLifecycle(undefined); }} onSaved={created => { setLifecycle(undefined); if (created) window.location.hash = base + '/' + created.evaluacionId;
      else { setNotice('Estado de evaluación consultado de nuevo. Revisa la información vigente antes de continuar.'); void store.retry(); } }} /></Suspense>;
  if (editor) return <Suspense fallback={<Typography role="status">Abriendo formulario…</Typography>}><EvaluationEditor companyId={company.empresaId} mode={editor} evaluation={evaluation} service={service} scope={scope}
    onAuthorization={onAuthorization} onDirty={onDirty} onPending={onPending} onCancel={() => { if (onLeave()) setEditor(undefined); }} onSaved={created => {
      setEditor(undefined); if (created) window.location.hash = base + '/' + created.evaluacionId;
      else { setNotice('Consulta actualizada del servidor. Revisa el estado antes de otra escritura.'); void store.retry(); }
    }} /></Suspense>;
  const editable = capabilities(company).write && evaluation?.estado === 'BORRADOR' && !state.differingRevisions;
  return <Stack component="section" aria-labelledby="evaluations-title" spacing={3} aria-busy={state.status === 'loading'}>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
      <Typography id="evaluations-title" variant="h2" tabIndex={-1} ref={heading}>{evaluationId ? 'Ficha de evaluación' : 'Evaluaciones'}</Typography>
      {evaluationId && <Link href={base}>Volver a evaluaciones</Link>}
      <Button disabled={state.status === 'loading'} onClick={() => { void store.retry(); }}>Actualizar {evaluationId ? 'evaluación' : 'listado'}</Button>
    </Stack>
    {!evaluationId && capabilities(company).write && <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setEditor({ kind: 'create' })}>Crear evaluación</Button>}
    {notice && <Alert severity="info">{notice}</Alert>}
    <Typography color="text.secondary">Consulta de la empresa activa. Las notas cero, los pendientes y las exclusiones justificadas se presentan por separado.</Typography>
    {state.status === 'loading' && <Typography role="status">Consultando {evaluationId ? 'evaluación, respuestas y resultados' : 'evaluaciones'}…</Typography>}
    {state.error && <ErrorNotice error={state.error} />}
    {state.list && <>
      {!state.list.elementos.length && <Alert severity="info">No hay evaluaciones en esta página.</Alert>}
      <Stack component="ul" spacing={2} sx={{ listStyle: 'none', m: 0, p: 0 }}>{state.list.elementos.map(item => <Paper component="li" key={item.evaluacionId} sx={{ p: 2 }}>
        <Stack spacing={1}><Link href={base + '/' + item.evaluacionId} sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{item.nombre}</Link><Typography>{date(item.fechaEvaluacion)} · {states[item.estado]}</Typography><Typography variant="body2">Revisión: {item.revision}</Typography></Stack>
      </Paper>)}</Stack><Pager label="evaluaciones" page={state.list.pagina} more={state.list.hayMas} load={list} />
    </>}
    {evaluation && <>
      <Paper component="article" sx={{ p: { xs: 2, md: 3 } }}><Stack spacing={2}>
        <Typography variant="h2" component="h3" sx={{ overflowWrap: 'anywhere' }}>{evaluation.nombre}</Typography><Chip label={states[evaluation.estado]} variant="outlined" sx={{ alignSelf: 'flex-start' }} />
        <Details><Typography component="dt">Fecha de evaluación</Typography><Typography component="dd">{date(evaluation.fechaEvaluacion)}</Typography>
          <Typography component="dt">Alcance</Typography><Typography component="dd">{evaluation.alcance}</Typography><Typography component="dt">Revisión de ficha</Typography><Typography component="dd">{evaluation.revision}</Typography>
          <Typography component="dt">Actualizada</Typography><Typography component="dd">{timestamp(evaluation.actualizadaEn, company.zonaHoraria)}</Typography>
          <Typography component="dt">Cierre registrado</Typography><Typography component="dd">{evaluation.cerradaEn ? timestamp(evaluation.cerradaEn, company.zonaHoraria) : 'Sin cierre registrado'}</Typography>
        </Details>
        <Box component="details"><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Ver referencias de la evaluación</Typography><Details>
          <Typography component="dt">Catálogo (versión)</Typography><Typography component="dd">{evaluation.versionCatalogoId}</Typography><Typography component="dt">Metodología (versión)</Typography><Typography component="dd">{evaluation.versionMetodologiaId}</Typography>
          <Typography component="dt">Responsable (identificador)</Typography><Typography component="dd">{evaluation.responsableId}</Typography><Typography component="dt">Evaluación anterior</Typography><Typography component="dd">{evaluation.evaluacionAnteriorId ? <Link href={base + '/' + evaluation.evaluacionAnteriorId}>Consultar evaluación anterior</Link> : 'No registrada'}</Typography>
          <Typography component="dt">Motivo de revisión</Typography><Typography component="dd">{evaluation.motivoRevision || 'No registrado'}</Typography>
        </Details></Box>
      </Stack></Paper>
      {capabilities(company).write && !state.differingRevisions && <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }} aria-label="Ciclo de evaluación">
        {evaluation.estado === 'BORRADOR' && <Button variant="contained" onClick={() => setLifecycle({ kind: 'submit' })}>Enviar a revisión</Button>}
        {evaluation.estado === 'EN_REVISION' && <><Button onClick={() => setLifecycle({ kind: 'return' })}>Devolver a borrador</Button><Button variant="contained" onClick={() => setLifecycle({ kind: 'close' })}>Cerrar evaluación</Button></>}
        {evaluation.estado === 'CERRADA' && <Button onClick={() => setLifecycle({ kind: 'correct' })}>Crear corrección vinculada</Button>}
      </Stack>}
      {evaluation.estado === 'CERRADA' && <Suspense fallback={<Typography role="status">Abriendo cierre…</Typography>}><ClosureView company={company.empresaId} evaluation={evaluation} service={service} scope={scope} onAuthorization={onAuthorization} zone={company.zonaHoraria} /></Suspense>}
      {state.differingRevisions && <Alert severity="warning">La ficha, las respuestas o los resultados corresponden a revisiones distintas. Actualiza la evaluación antes de compararlos como un mismo corte.</Alert>}
      {evaluation.estado !== 'CERRADA' && state.results && <EvaluationResults data={state.results} name={evaluation.nombre} panelSnapshot={false} />}
      {evaluation.estado !== 'CERRADA' && state.resultsError && <ErrorNotice error={state.resultsError} />}
      <Typography variant="h2" component="h3">Respuestas</Typography>
      <Box component="form" aria-label="Filtros de respuestas" onSubmit={filter} key={JSON.stringify(state.query)}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' }, gap: 2, alignItems: 'end' }}>
          <Stack spacing={1}><Typography component="label" htmlFor="response-type">Tipo de elemento</Typography><Box component="select" id="response-type" name="tipo" defaultValue={state.query.tipo || ''} sx={fields}><option value="">Controles y cláusulas</option><option value="CONTROL">Control</option><option value="CLAUSULA">Cláusula</option></Box></Stack>
          <Stack spacing={1}><Typography component="label" htmlFor="response-group">Grupo del catálogo</Typography><Box component="input" id="response-group" name="grupo" maxLength={80} defaultValue={state.query.grupo || ''} sx={fields} /></Stack>
          <Stack direction="row" sx={{ gap: 1 }}><Button variant="contained" type="submit">Aplicar filtros</Button><Button onClick={event => { event.currentTarget.form?.reset(); detail(); }}>Limpiar filtros</Button></Stack>
        </Box><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>El grupo corresponde al código exacto del catálogo, por ejemplo ORGANIZACIONAL o CLAUSULA_4. Los resultados globales conservan el alcance de toda la evaluación.</Typography>
      </Box>
      {state.answersError && <ErrorNotice error={state.answersError} />}
      {state.answers && <>
        {!state.answers.elementos.length && <Alert severity="info">No hay respuestas en esta página con los filtros aplicados.</Alert>}
        {state.answers.elementos.map(answer => <AnswerCard key={answer.respuestaId} answer={answer} company={company} evaluationId={evaluation.evaluacionId} service={service} scope={scope} onAuthorization={onAuthorization} editable={Boolean(editable)} revision={evaluation.revision} expandEvidence={expandedEvidence === answer.respuestaId} onUpload={() => setUpload(answer)} onConfirm={() => setLifecycle({ kind: 'confirm', answer })} onEdit={() => setEditor({ kind: 'answer', answer })} onFinding={finding => setEditor({ kind: 'finding', answer, finding })} />)}
        <Pager label="respuestas" page={state.answers.pagina} more={state.answers.hayMas} load={pagina => detail({ ...state.query, pagina })} />
      </>}
    </>}
  </Stack>;
}
function AnswerCard({ answer, company, evaluationId, service, scope, onAuthorization, editable, revision, onEdit, onFinding, onConfirm, onUpload, expandEvidence }: { onUpload: () => void; expandEvidence: boolean; onConfirm: () => void; editable: boolean; revision: number; onEdit: () => void; onFinding: (finding?: Finding) => void; answer: Answer; company: Company; evaluationId: string; service: EvaluationService; scope?: AbortSignal; onAuthorization: (error: ApiError) => void }) {
  const [open, setOpen] = useState(expandEvidence); const [findingsOpen, setFindingsOpen] = useState(false); const value = answer.respuesta;
  return <Paper component="article" aria-label={'Respuesta ' + answer.codigo} sx={{ p: 2 }}><Stack spacing={2}>
    <Typography variant="overline">{answer.tipo === 'CONTROL' ? 'Control' : 'Cláusula'} · {labels[answer.grupo] || answer.grupo}</Typography>
    <Typography variant="h2" component="h4" sx={{ overflowWrap: 'anywhere' }}>{answer.codigo} · {answer.titulo}</Typography>
    <Typography>Revisión de respuesta: {answer.revisionEvaluacion}</Typography>
    <Details><Typography component="dt">Aplicabilidad</Typography><Typography component="dd">{value.aplicabilidad === 'APLICA' ? 'Aplica' : value.aplicabilidad === 'NO_APLICA' ? 'No aplica' : 'Sin decidir'}</Typography>
      <Typography component="dt">Calificación</Typography><Typography component="dd">{value.aplicabilidad === 'NO_APLICA' ? 'No aplica' : value.calificacion === null ? 'Pendiente' : `${value.calificacion} / 100`}</Typography>
      <Typography component="dt">Justificación de aplicabilidad</Typography><Typography component="dd">{value.justificacionAplicabilidad || (value.aplicabilidad === 'NO_APLICA' ? 'Pendiente' : 'No aplica')}</Typography>
      <Typography component="dt">Fundamento</Typography><Typography component="dd">{value.fundamento || (value.aplicabilidad === 'NO_APLICA' ? 'No registrado' : 'Pendiente')}</Typography>
    </Details>
    {answer.respuestaAnteriorId && <Alert severity={answer.heredadaConfirmada ? 'info' : 'warning'}>{answer.heredadaConfirmada ? 'Respuesta heredada confirmada.' : 'Respuesta heredada pendiente de confirmación en esta evaluación.'}</Alert>}
    {editable && answer.respuestaAnteriorId && !answer.heredadaConfirmada && <Button sx={{ alignSelf: 'flex-start' }} onClick={onConfirm}>Confirmar heredada {answer.codigo}</Button>}
    {editable && <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button onClick={onUpload}>Adjuntar evidencia en {answer.codigo}</Button><Button onClick={onEdit}>Diligenciar {answer.codigo}</Button><Button onClick={() => onFinding()}>Registrar hallazgo en {answer.codigo}</Button></Stack>}
    <Box component="details" onToggle={event => setFindingsOpen(event.currentTarget.open)}><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Ver hallazgos de {answer.codigo}</Typography>
      {findingsOpen && <FindingsList company={company} evaluationId={evaluationId} answer={answer} service={service} scope={scope} onAuthorization={onAuthorization} editable={editable} revision={revision} onEdit={onFinding} />}
    </Box>
    <Box component="details" open={open} onToggle={event => setOpen(event.currentTarget.open)}><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Ver evidencias de {answer.codigo}</Typography>
      {open && <EvidenceList key={answer.respuestaId} company={company} evaluationId={evaluationId} responseId={answer.respuestaId} service={service} scope={scope} onAuthorization={onAuthorization} />}
    </Box>
  </Stack></Paper>;
}
function EvidenceList({ company, evaluationId, responseId, service, scope, onAuthorization }: { company: Company; evaluationId: string; responseId: string; service: EvaluationService; scope?: AbortSignal; onAuthorization: (error: ApiError) => void }) {
  const [page, setPage] = useState(0); const [retry, setRetry] = useState(0); const [data, setData] = useState<EvidencePage>(); const [error, setError] = useState<ApiError>(); const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string>(); const alive = useRef(false); const file = useRef<AbortController | undefined>(undefined); const urls = useRef(new Set<string>());
  const busy = useRef(false);
  const timers = useRef(new Map<string, number>());
  const fail = (failure: unknown) => {
    if (scope?.aborted) return;
    const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo consultar la evidencia.'); setError(problem);
    if ([401, 403].includes(problem.status)) { setData(undefined); onAuthorization(problem); }
  };
  useEffect(() => {
    alive.current = true; const controller = new AbortController(); setLoading(true); setData(undefined); setError(undefined); setDownloading(undefined);
    void service.evidence(company.empresaId, evaluationId, responseId, page, controller.signal).then(result => {
      if (!controller.signal.aborted && !scope?.aborted) setData(validateEvidence(result, page));
    }).catch(failure => { if (!controller.signal.aborted) fail(failure); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    const resources = urls.current;
    const pendingTimers = timers.current;
    return () => { alive.current = false; controller.abort(); file.current?.abort(); busy.current = false; pendingTimers.forEach(timer => window.clearTimeout(timer)); pendingTimers.clear(); resources.forEach(url => URL.revokeObjectURL(url)); resources.clear(); };
  // Error handling shares only the current scope. All callbacks are guarded by their request's signal.
  }, [company.empresaId, evaluationId, responseId, service, page, retry, onAuthorization, scope]);
  async function download(evidence: Evidence) {
    if (busy.current || scope?.aborted) return;
    busy.current = true;
    const controller = file.current = new AbortController(); setDownloading(evidence.evidenciaId); setError(undefined);
    try {
      const blob = await service.file(company.empresaId, evaluationId, responseId, evidence.evidenciaId, controller.signal);
      if (!alive.current || controller.signal.aborted || scope?.aborted) return;
      if (!(blob instanceof Blob) || !['application/pdf', 'image/png', 'image/jpeg'].includes(blob.type) || blob.type !== evidence.tipoDetectado) throw new ApiError(502, 'RESPUESTA_INVALIDA', 'El archivo recibido no tiene el tipo esperado.');
      const url = URL.createObjectURL(blob); urls.current.add(url); const anchor = document.createElement('a');
      const extension = blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : 'jpg';
      const name = evidence.nombreOriginal.replace(/[\\/\x00-\x1f\x7f]/g, '_').slice(0, 180) || 'evidencia';
      const correctSuffix = blob.type === 'image/jpeg' ? /\.jpe?g$/i : new RegExp('\\.' + extension + '$', 'i');
      anchor.href = url; anchor.download = correctSuffix.test(name) ? name : name + '.' + extension; anchor.hidden = true;
      document.body.append(anchor); anchor.click(); anchor.remove();
      timers.current.set(url, window.setTimeout(() => { URL.revokeObjectURL(url); urls.current.delete(url); timers.current.delete(url); }, 1000));
    } catch (failure) { if (alive.current && !controller.signal.aborted) fail(failure); }
    finally { if (alive.current && !controller.signal.aborted) { busy.current = false; setDownloading(undefined); } }
  }
  return <Stack spacing={2} sx={{ mt: 2 }} aria-busy={loading}>
    {loading && <Typography role="status">Consultando evidencias…</Typography>}{error && <ErrorNotice error={error} />}
    <Button disabled={loading || Boolean(downloading)} onClick={() => setRetry(retry + 1)}>Actualizar evidencias</Button>
    {data && <>
      {!data.elementos.length && <Typography>No hay evidencias disponibles en esta página.</Typography>}
      <Typography variant="body2" color="text.secondary">La inspección mostrada es el último estado registrado. El servidor vuelve a comprobar el archivo al descargarlo.</Typography>
      <Stack component="ul" spacing={2} sx={{ listStyle: 'none', m: 0, p: 0 }}>{data.elementos.map(item => <Box component="li" key={item.evidenciaId}>
        <Typography sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{item.nombreOriginal}</Typography><Typography>{item.tipoDetectado} · {item.tamanoBytes} bytes · {timestamp(item.creadaEn, company.zonaHoraria)}</Typography>
        <Typography>Inspección registrada: {({ PENDIENTE: 'Pendiente', LIMPIA: 'Limpia', ERROR: 'Error' })[item.estadoInspeccion]}</Typography>
        {item.descripcion && <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.descripcion}</Typography>}
        <Button disabled={Boolean(downloading)} onClick={() => { void download(item); }} aria-label={'Descargar ' + item.nombreOriginal}>{downloading === item.evidenciaId ? 'Descargando…' : 'Descargar archivo'}</Button>
      </Box>)}</Stack><Pager label="evidencias" page={data.pagina} more={data.hayMas} load={setPage} />
    </>}
  </Stack>;
}

function FindingsList({ company, evaluationId, answer, service, scope, onAuthorization, editable, revision, onEdit }: { company: Company; evaluationId: string; answer: Answer; service: EvaluationService; scope?: AbortSignal; onAuthorization: (error: ApiError) => void; editable: boolean; revision: number; onEdit: (finding: Finding) => void }) {
  const [page, setPage] = useState(0); const [attempt, setAttempt] = useState(0); const [data, setData] = useState<FindingPage>(); const [error, setError] = useState<ApiError>(); const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setData(undefined); setError(undefined);
    void service.findings(company.empresaId, evaluationId, answer.respuestaId, page, controller.signal).then(result => {
      validatePage(result, page); result.elementos.forEach(item => validateFinding(item, answer.respuestaId));
      if (!controller.signal.aborted && !scope?.aborted) setData(result);
    }).catch(failure => { if (controller.signal.aborted || scope?.aborted) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudieron validar los hallazgos.'); setError(problem); if ([401, 403].includes(problem.status)) onAuthorization(problem); })
      .finally(() => { if (!controller.signal.aborted && !scope?.aborted) setLoading(false); });
    return () => controller.abort();
  }, [company.empresaId, evaluationId, answer.respuestaId, service, page, attempt, scope, onAuthorization]);
  return <Stack spacing={2} sx={{ mt: 2 }} aria-busy={loading}>
    {loading && <Typography role="status">Consultando hallazgos…</Typography>}{error && <ErrorNotice error={error} />}<Button disabled={loading} onClick={() => setAttempt(attempt + 1)}>Actualizar hallazgos</Button>
    {data && <>{!data.elementos.length && <Typography>No hay hallazgos en esta página.</Typography>}{data.elementos.map(item => <Box component="article" key={item.hallazgoId}>
      <Typography sx={{ fontWeight: 600, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.hallazgo.descripcionBrecha}</Typography><Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{item.hallazgo.recomendacion || 'Sin recomendación registrada'}</Typography>
      <Typography>Revisión: {item.revisionEvaluacion} · {timestamp(item.actualizadaEn, company.zonaHoraria)}</Typography>
      {item.revisionEvaluacion !== revision && <Alert severity="warning">El hallazgo pertenece a otra revisión. Actualiza la evaluación antes de editar.</Alert>}
      {editable && <Button disabled={item.revisionEvaluacion !== revision} onClick={() => onEdit(item)}>Editar hallazgo</Button>}
    </Box>)}<Pager label="hallazgos" page={data.pagina} more={data.hayMas} load={setPage} /></>}
  </Stack>;
}
