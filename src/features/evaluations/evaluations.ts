import { api, ApiError } from '../../shared/api/client';
import type { components, operations } from '../../shared/api/generated/schema';
import { validateResults } from '../dashboard/panel';
import type { Results } from '../dashboard/panel';

export type Evaluation = components['schemas']['EvaluationDraft'];
export type EvaluationPage = components['schemas']['EvaluationPage'];
export type Answer = components['schemas']['EvaluationResponse'];
export type AnswerPage = components['schemas']['EvaluationResponsePage'];
export type AnswerQuery = NonNullable<operations['listarRespuestasEvaluacion']['parameters']['query']>;
export type Evidence = components['schemas']['ResponseEvidence'];
export type EvidencePage = components['schemas']['ResponseEvidencePage'];
export type NewEvaluation = components['schemas']['CreateEvaluationDraft'];
export type EditAnswer = components['schemas']['EditEvaluationResponse'];
export type Finding = components['schemas']['EvaluationFinding'];
export type FindingPage = components['schemas']['EvaluationFindingPage'];
export type EditFinding = components['schemas']['EditEvaluationFinding'];
export type CatalogPage = components['schemas']['ReferenceCatalogPage'];
export type MethodPage = components['schemas']['ReferenceMethodPage'];
export type ResponsiblePage = components['schemas']['CompanyResponsiblePage'];
export const states = { BORRADOR: 'Borrador', EN_REVISION: 'En revisión', CERRADA: 'Cerrada' };
export const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const text = (value: unknown) => typeof value === 'string';
const optionalText = (value: unknown) => value === null || text(value);
const instant = (value: string) => Number.isFinite(Date.parse(value));
const invalid = () => new ApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos validar la información de la evaluación.');
export interface EvaluationService {
  create(company: string, body: NewEvaluation, signal: AbortSignal): Promise<Evaluation>;
  editAnswer(company: string, id: string, response: string, body: EditAnswer, signal: AbortSignal): Promise<Answer>;
  findings(company: string, id: string, response: string, page: number, signal: AbortSignal): Promise<FindingPage>;
  createFinding(company: string, id: string, response: string, body: EditFinding, signal: AbortSignal): Promise<Finding>;
  editFinding(company: string, id: string, response: string, finding: string, body: EditFinding, signal: AbortSignal): Promise<Finding>;
  catalogs(company: string, page: number, signal: AbortSignal): Promise<CatalogPage>;
  methods(company: string, page: number, signal: AbortSignal): Promise<MethodPage>;
  responsibles(company: string, page: number, signal: AbortSignal): Promise<ResponsiblePage>;
  list(company: string, page: number, signal: AbortSignal): Promise<EvaluationPage>;
  detail(company: string, id: string, signal: AbortSignal): Promise<Evaluation>;
  answers(company: string, id: string, query: AnswerQuery, signal: AbortSignal): Promise<AnswerPage>;
  results(company: string, id: string, signal: AbortSignal): Promise<Results>;
  evidence(company: string, id: string, responseId: string, page: number, signal: AbortSignal): Promise<EvidencePage>;
  file(company: string, id: string, responseId: string, evidenceId: string, signal: AbortSignal): Promise<Blob>;
}
export const createEvaluationService = (client = api): EvaluationService => ({
  create: async (empresaId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/evaluaciones', { path: { empresaId }, body, signal })).data,
  editAnswer: async (empresaId, evaluacionId, respuestaId, body, signal) => (await client.request('put', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}', { path: { empresaId, evaluacionId, respuestaId }, body, signal })).data,
  findings: async (empresaId, evaluacionId, respuestaId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/hallazgos', { path: { empresaId, evaluacionId, respuestaId }, query: { pagina, tamano: 5 }, signal })).data,
  createFinding: async (empresaId, evaluacionId, respuestaId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/hallazgos', { path: { empresaId, evaluacionId, respuestaId }, body, signal })).data,
  editFinding: async (empresaId, evaluacionId, respuestaId, hallazgoId, body, signal) => (await client.request('put', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/hallazgos/{hallazgoId}', { path: { empresaId, evaluacionId, respuestaId, hallazgoId }, body, signal })).data,
  catalogs: async (empresaId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/catalogos', { path: { empresaId }, query: { pagina, tamano: 5, disponibleNuevos: true }, signal })).data,
  methods: async (empresaId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/metodologias', { path: { empresaId }, query: { pagina, tamano: 5, disponibleNuevos: true }, signal })).data,
  responsibles: async (empresaId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/responsables', { path: { empresaId }, query: { pagina, tamano: 5 }, signal })).data,
  list: async (empresaId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones', { path: { empresaId }, query: { pagina, tamano: 5 }, signal })).data,
  detail: async (empresaId, evaluacionId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}', { path: { empresaId, evaluacionId }, signal })).data,
  answers: async (empresaId, evaluacionId, query, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas', { path: { empresaId, evaluacionId }, query, signal })).data,
  results: async (empresaId, evaluacionId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/resultados', { path: { empresaId, evaluacionId }, signal })).data,
  evidence: async (empresaId, evaluacionId, respuestaId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/evidencias', { path: { empresaId, evaluacionId, respuestaId }, query: { pagina, tamano: 5 }, signal })).data,
  file: async (empresaId, evaluacionId, respuestaId, evidenciaId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/evidencias/{evidenciaId}/archivo', { path: { empresaId, evaluacionId, respuestaId, evidenciaId }, signal })).data,
});
export function validateEvaluation(value: Evaluation, id?: string) {
  if (!value || !uuid.test(value.evaluacionId) || (id && value.evaluacionId.toLowerCase() !== id.toLowerCase())
    || !text(value.nombre) || !text(value.alcance) || !Object.hasOwn(states, value.estado) || !count(value.revision)
    || !/^\d{4}-\d{2}-\d{2}$/.test(value.fechaEvaluacion) || !instant(value.fechaEvaluacion)
    || new Date(value.fechaEvaluacion).toISOString().slice(0, 10) !== value.fechaEvaluacion
    || !uuid.test(value.versionCatalogoId) || !uuid.test(value.versionMetodologiaId) || !uuid.test(value.responsableId)
    || !instant(value.creadaEn) || !instant(value.actualizadaEn) || !optionalText(value.motivoRevision)
    || (value.evaluacionAnteriorId !== null && !uuid.test(value.evaluacionAnteriorId)) || (value.cerradaEn !== null && !instant(value.cerradaEn))) throw invalid();
  return value;
}
export function validatePage<T>(page: { elementos: T[]; pagina: number; tamano: number; hayMas: boolean }, expected: number) {
  if (!page || page.pagina !== expected || page.tamano !== 5 || typeof page.hayMas !== 'boolean' || !Array.isArray(page.elementos) || page.elementos.length > 5) throw invalid();
  return page;
}
export function validateAnswers(page: AnswerPage, query: AnswerQuery, evaluation: Evaluation) {
  validatePage(page, query.pagina ?? 0);
  for (const value of page.elementos) {
    if (!value || !uuid.test(value.respuestaId) || !uuid.test(value.elementoId) || value.versionCatalogoId !== evaluation.versionCatalogoId
      || !['CONTROL', 'CLAUSULA'].includes(value.tipo) || (query.tipo && value.tipo !== query.tipo) || (query.grupo && value.grupo !== query.grupo)
      || !text(value.codigo) || !text(value.titulo) || !text(value.grupo) || !value.respuesta
      || !['APLICA', 'NO_APLICA', 'SIN_DECIDIR'].includes(value.respuesta.aplicabilidad) || !count(value.revisionEvaluacion)
      || ![null, 0, 20, 40, 60, 80, 100].includes(value.respuesta.calificacion) || !optionalText(value.respuesta.fundamento)
      || !optionalText(value.respuesta.justificacionAplicabilidad) || typeof value.heredadaConfirmada !== 'boolean'
      || (value.respuestaAnteriorId !== null && !uuid.test(value.respuestaAnteriorId))) throw invalid();
  }
  return page;
}
export function validateEvidence(page: EvidencePage, expected: number) {
  validatePage(page, expected);
  for (const value of page.elementos) if (!value || !uuid.test(value.evidenciaId) || !text(value.nombreOriginal) || !value.nombreOriginal.trim() || !optionalText(value.descripcion)
    || !['application/pdf', 'image/png', 'image/jpeg'].includes(value.tipoDetectado) || !count(value.tamanoBytes) || !instant(value.creadaEn)
    || !['PENDIENTE', 'LIMPIA', 'ERROR'].includes(value.estadoInspeccion)) throw invalid();
  return page;
}
export type EvaluationState = { status: 'loading' | 'list' | 'detail' | 'error'; page: number; query: AnswerQuery;
  list?: EvaluationPage; evaluation?: Evaluation; answers?: AnswerPage; results?: Results; error?: ApiError;
  answersError?: ApiError; resultsError?: ApiError; differingRevisions?: boolean };
export class EvaluationStore {
  private state: EvaluationState = { status: 'loading', page: 0, query: {} };
  private listeners = new Set<() => void>(); private controller?: AbortController; private generation = 0; private id?: string;
  constructor(private company: string, private service: EvaluationService, private onAuthorization: (error: ApiError) => void, private scope?: AbortSignal) {}
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private set(state: EvaluationState) { this.state = state; this.listeners.forEach(fn => fn()); }
  private task(state: EvaluationState) {
    this.controller?.abort(); const controller = this.controller = new AbortController(); const version = ++this.generation; this.set(state);
    return { signal: controller.signal, current: () => version === this.generation && !controller.signal.aborted && !this.scope?.aborted };
  }
  dispose() { ++this.generation; this.controller?.abort(); }
  private problem(error: unknown) { return error instanceof ApiError ? error : invalid(); }
  private fail(error: unknown, base: EvaluationState) {
    const problem = this.problem(error); this.set({ ...base, status: 'error', error: problem });
    if ([401, 403].includes(problem.status)) this.onAuthorization(problem);
  }
  list = async (page = 0) => {
    this.id = undefined; const base: EvaluationState = { status: 'loading', page, query: {} }; const task = this.task(base);
    try {
      const list = validatePage(await this.service.list(this.company, page, task.signal), page); list.elementos.forEach(value => validateEvaluation(value));
      if (task.current()) this.set({ ...base, status: 'list', list });
    } catch (error) { if (task.current()) this.fail(error, base); }
  };
  detail = async (id: string, query: AnswerQuery = {}) => {
    this.id = id; const effective = { ...query, pagina: query.pagina ?? 0, tamano: 5 };
    const base: EvaluationState = { status: 'loading', page: this.state.page, query: effective }; const task = this.task(base);
    try {
      if (!uuid.test(id)) throw new ApiError(404, 'EVALUACION_NO_DISPONIBLE', 'Evaluación no disponible.');
      const evaluation = validateEvaluation(await this.service.detail(this.company, id, task.signal), id);
      if (!task.current()) return;
      const [responses, results] = await Promise.allSettled([
        this.service.answers(this.company, id, effective, task.signal).then(value => validateAnswers(value, effective, evaluation)),
        this.service.results(this.company, id, task.signal).then(value => validateResults(value, evaluation.evaluacionId)),
      ]);
      if (!task.current()) return;
      for (const result of [responses, results]) if (result.status === 'rejected' && [401, 403].includes(this.problem(result.reason).status)) throw result.reason;
      const state: EvaluationState = { ...base, status: 'detail', evaluation };
      if (responses.status === 'fulfilled') state.answers = responses.value; else state.answersError = this.problem(responses.reason);
      if (results.status === 'fulfilled') state.results = results.value; else state.resultsError = this.problem(results.reason);
      state.differingRevisions = Boolean((state.results && state.results.revision !== evaluation.revision)
        || state.answers?.elementos.some(value => value.revisionEvaluacion !== evaluation.revision));
      this.set(state);
    } catch (error) { if (task.current()) this.fail(error, base); }
  };
  retry = () => this.id ? this.detail(this.id, this.state.query) : this.list(this.state.page);
}

export function validateFinding(value: Finding, response: string) {
  if (!value || !uuid.test(value.hallazgoId) || value.respuestaId !== response || !count(value.revisionEvaluacion)
    || !value.hallazgo || !text(value.hallazgo.descripcionBrecha) || !value.hallazgo.descripcionBrecha.trim()
    || !optionalText(value.hallazgo.recomendacion) || !instant(value.creadaEn) || !instant(value.actualizadaEn)) throw invalid();
  return value;
}
