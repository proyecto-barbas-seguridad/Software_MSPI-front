import { api, ApiError } from '../../shared/api/client';
import type { components, operations } from '../../shared/api/generated/schema';
import { calendarDay } from '../../shared/date/companyDay';
export type Progress = components['schemas']['ActionProgress'];
export type Delivery = components['schemas']['ActionDelivery'];
export type Decision = components['schemas']['ActionDecision'];
export type ActionUploadResult = components['schemas']['ActionEvidenceUpload'];
export type UploadBody = operations['cargarEvidenciaAccion']['requestBody']['content']['multipart/form-data'] & operations['cargarEvidenciaAccion']['parameters']['query'];
export type ActionData = components['schemas']['ActionData'];
export type NewAction = components['schemas']['CreateAction'];
export type EditAction = components['schemas']['EditAction'];
export type Choice = { id: string; label: string };
export type Action = components['schemas']['ImprovementAction'];
export type ActionEvent = components['schemas']['ActionEvent'];
export type Evidence = components['schemas']['ResponseEvidence'];
export type Page<T> = { elementos: T[]; pagina: number; tamano: number; hayMas: boolean };
export const states: Record<Action['estado'], string> = { PENDIENTE: 'Pendiente', EN_EJECUCION: 'En ejecución', EN_REVISION: 'En revisión', COMPLETADA: 'Completada', CANCELADA: 'Cancelada' };
export const eventNames: Record<ActionEvent['tipo'], string> = { INICIADA: 'Iniciada', AVANCE: 'Avance', SOLICITUD_REVISION: 'Solicitud de revisión', APROBADA: 'Aprobada', DEVUELTA: 'Devuelta' };
export const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const id = (v: unknown) => typeof v === 'string' && uuid.test(v);
const nullableId = (v: unknown) => v === null || id(v);
const optionalId = (v: unknown) => v == null || id(v);
const text = (v: unknown) => typeof v === 'string';
const optionalText = (v: unknown) => v === null || text(v);
const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const instant = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));
const invalid = () => new ApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos validar la información de acciones.');
export interface ActionService {
  progress(company: string, action: string, body: Progress, signal: AbortSignal): Promise<Action>;
  deliver(company: string, action: string, body: Delivery, signal: AbortSignal): Promise<Action>;
  decide(company: string, action: string, delivery: string, body: Decision, signal: AbortSignal): Promise<Action>;
  upload(company: string, action: string, body: UploadBody, signal: AbortSignal): Promise<ActionUploadResult>;
  create(company: string, body: NewAction, signal: AbortSignal): Promise<Action>;
  edit(company: string, action: string, body: EditAction, signal: AbortSignal): Promise<Action>;
  cancel(company: string, action: string, revision: number, reason: string, signal: AbortSignal): Promise<Action>;
  assignees(company: string, page: number, signal: AbortSignal): Promise<Page<Choice>>;
  risks(company: string, page: number, signal: AbortSignal): Promise<Page<Choice>>;
  evaluations(company: string, page: number, signal: AbortSignal): Promise<Page<Choice>>;
  answers(company: string, evaluation: string, page: number, signal: AbortSignal): Promise<Page<Choice>>;
  findings(company: string, evaluation: string, answer: string, page: number, signal: AbortSignal): Promise<Page<Choice>>;
  controls(company: string, page: number, signal: AbortSignal): Promise<Page<Choice>>;
  control(company: string, control: string, signal: AbortSignal): Promise<{ version: string; name: string }>;
  evaluationEvidence(company: string, evaluation: string, answer: string, page: number, signal: AbortSignal): Promise<Page<Evidence>>;
  controlEvidence(company: string, control: string, version: string, page: number, signal: AbortSignal): Promise<Page<Evidence>>;
  list(company: string, page: number, signal: AbortSignal): Promise<Page<Action>>;
  detail(company: string, action: string, signal: AbortSignal): Promise<Action>;
  history(company: string, action: string, page: number, signal: AbortSignal): Promise<ActionEvent[]>;
  evidence(company: string, action: string, page: number, signal: AbortSignal): Promise<Page<Evidence>>;
  file(company: string, action: string, evidence: string, kind: 'action' | 'context', signal: AbortSignal): Promise<Blob>;
}
export const createActionService = (client = api): ActionService => ({
  progress: async (empresaId, accionId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/acciones/{accionId}/avances', { path: { empresaId, accionId }, body, signal })).data,
  deliver: async (empresaId, accionId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/acciones/{accionId}/entregas', { path: { empresaId, accionId }, body, signal })).data,
  decide: async (empresaId, accionId, entregaId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/acciones/{accionId}/entregas/{entregaId}/decision', { path: { empresaId, accionId, entregaId }, body, signal })).data,
  upload: async (empresaId, accionId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/acciones/{accionId}/evidencias', { path: { empresaId, accionId }, query: { revisionEsperada: body.revisionEsperada, ...(body.descripcion ? { descripcion: body.descripcion } : {}) }, body: { archivo: body.archivo }, signal })).data,
  create: async (empresaId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/acciones', { path: { empresaId }, body, signal })).data,
  edit: async (empresaId, accionId, body, signal) => (await client.request('put', '/api/v1/empresas/{empresaId}/acciones/{accionId}', { path: { empresaId, accionId }, body, signal })).data,
  cancel: async (empresaId, accionId, revisionEsperada, motivo, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/acciones/{accionId}/cancelar', { path: { empresaId, accionId }, body: { revisionEsperada, motivo }, signal })).data,
  assignees: async (empresaId, pagina, signal) => choices((await client.request('get', '/api/v1/empresas/{empresaId}/responsables', { path: { empresaId }, query: { pagina, tamano: 5 }, signal })).data, pagina, item => ({ id: item.membresiaId, label: item.nombreVisible })),
  risks: async (empresaId, pagina, signal) => {
    const data = validatePage((await client.request('get', '/api/v1/empresas/{empresaId}/riesgos', { path: { empresaId }, query: { pagina, tamano: 5 }, signal })).data, pagina, item => { if (!id(item.riesgoId) || !text(item.codigo) || !item.detalle || !text(item.detalle.descripcion) || !['IDENTIFICADO', 'EN_ANALISIS', 'EN_TRATAMIENTO', 'EN_SEGUIMIENTO', 'CERRADO'].includes(item.estado)) throw invalid(); });
    return { ...data, elementos: data.elementos.filter(item => item.estado !== 'CERRADO').map(item => ({ id: item.riesgoId, label: item.codigo + ' · ' + item.detalle.descripcion })) };
  },
  evaluations: async (empresaId, pagina, signal) => choices((await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones', { path: { empresaId }, query: { pagina, tamano: 5 }, signal })).data, pagina, item => ({ id: item.evaluacionId, label: item.nombre })),
  answers: async (empresaId, evaluacionId, pagina, signal) => choices((await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas', { path: { empresaId, evaluacionId }, query: { pagina, tamano: 5 }, signal })).data, pagina, item => { if (!text(item.codigo) || !text(item.titulo)) throw invalid(); return { id: item.respuestaId, label: item.codigo + ' · ' + item.titulo }; }),
  findings: async (empresaId, evaluacionId, respuestaId, pagina, signal) => choices((await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/hallazgos', { path: { empresaId, evaluacionId, respuestaId }, query: { pagina, tamano: 5 }, signal })).data, pagina, item => { if (item.respuestaId !== respuestaId || !item.hallazgo || !text(item.hallazgo.descripcionBrecha)) throw invalid(); return { id: item.hallazgoId, label: item.hallazgo.descripcionBrecha }; }),
  controls: async (empresaId, pagina, signal) => choices((await client.request('get', '/api/v1/empresas/{empresaId}/implementaciones-control', { path: { empresaId }, query: { pagina, tamano: 5 }, signal })).data, pagina, item => ({ id: item.implementacionId, label: item.versionActual?.detalle?.nombre })),
  control: async (empresaId, implementacionId, signal) => {
    const item = (await client.request('get', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}', { path: { empresaId, implementacionId }, signal })).data;
    if (!item || item.implementacionId !== implementacionId || !id(item.versionActual?.versionId) || !text(item.versionActual?.detalle?.nombre)) throw invalid();
    return { version: item.versionActual.versionId, name: item.versionActual.detalle.nombre };
  },
  evaluationEvidence: async (empresaId, evaluacionId, respuestaId, pagina, signal) => validatePage((await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/evidencias', { path: { empresaId, evaluacionId, respuestaId }, query: { pagina, tamano: 5 }, signal })).data, pagina, validateEvidence),
  controlEvidence: async (empresaId, implementacionId, versionId, pagina, signal) => validatePage((await client.request('get', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/versiones/{versionId}/evidencias', { path: { empresaId, implementacionId, versionId }, query: { pagina, tamano: 5 }, signal })).data, pagina, validateEvidence),
  list: async (empresaId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/acciones', { path: { empresaId }, query: { pagina, tamano: 5 }, signal })).data,
  detail: async (empresaId, accionId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/acciones/{accionId}', { path: { empresaId, accionId }, signal })).data,
  history: async (empresaId, accionId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/acciones/{accionId}/historial', { path: { empresaId, accionId }, query: { pagina, tamano: 5 }, signal })).data,
  evidence: async (empresaId, accionId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/acciones/{accionId}/evidencias', { path: { empresaId, accionId }, query: { pagina, tamano: 5 }, signal })).data,
  file: async (empresaId, accionId, evidenciaId, kind, signal) => (await client.request('get', kind === 'context' ? '/api/v1/empresas/{empresaId}/acciones/{accionId}/evidencias-contexto/{evidenciaId}/archivo' : '/api/v1/empresas/{empresaId}/acciones/{accionId}/evidencias/{evidenciaId}/archivo', { path: { empresaId, accionId, evidenciaId }, signal })).data,
});
export function validateAction(v: Action, expected?: string) {
  if (!v || !id(v.accionId) || (expected && v.accionId.toLowerCase() !== expected.toLowerCase()) || !text(v.codigo) || !nullableId(v.riesgoId) || !nullableId(v.hallazgoId) || ((v.riesgoId === null) === (v.hallazgoId === null)) || !optionalText(v.nombreActivo)
    || !text(v.descripcion) || !text(v.resultadoEsperado) || !id(v.responsableMembresiaId) || !calendarDay(v.fechaLimite) || !Object.hasOwn(states, v.estado) || typeof v.vencida !== 'boolean'
    || typeof v.evidenciaRequerida !== 'boolean' || !text(v.descripcionEvidencia) || !optionalText(v.justificacionSinEvidencia) || !text(v.resumenContextoRa) || !count(v.revision) || !optionalText(v.motivoCambio)
    || !id(v.creadaPor) || !instant(v.creadaEn) || !optionalId(v.entregaVigenteId) || (v.finalizadaEn != null && !instant(v.finalizadaEn)) || !Array.isArray(v.evidenciasContexto) || v.evidenciasContexto.length > 20
    || v.evidenciasContexto.some(item => !item || !id(item.evidenciaId) || !text(item.motivoContexto)) || new Set(v.evidenciasContexto.map(item => item.evidenciaId)).size !== v.evidenciasContexto.length) throw invalid();
  return v;
}
export function validatePage<T>(v: Page<T>, page: number, validate: (item: T) => unknown) {
  if (!v || v.pagina !== page || v.tamano !== 5 || typeof v.hayMas !== 'boolean' || !Array.isArray(v.elementos) || v.elementos.length > 5) throw invalid();
  v.elementos.forEach(validate); return v;
}
export function validateHistory(v: ActionEvent[]) {
  if (!Array.isArray(v) || v.length > 5 || v.some(item => !item || !id(item.eventoId) || !Object.hasOwn(eventNames, item.tipo) || (item.comentario != null && !text(item.comentario)) || !id(item.autorId) || !id(item.responsableMembresiaId) || !optionalId(item.entregaId) || !optionalId(item.evidenciaId) || !instant(item.creadaEn)) || new Set(v.map(item => item.eventoId)).size !== v.length) throw invalid();
  return v;
}
export function validateEvidence(v: Evidence) {
  if (!v || !id(v.evidenciaId) || !text(v.nombreOriginal) || !v.nombreOriginal.trim() || !['application/pdf', 'image/png', 'image/jpeg'].includes(v.tipoDetectado) || !count(v.tamanoBytes) || v.tamanoBytes < 1 || !optionalText(v.descripcion) || !id(v.creadaPor) || !instant(v.creadaEn) || !['LIMPIA', 'PENDIENTE', 'ERROR'].includes(v.estadoInspeccion)) throw invalid();
  return v;
}

function choices<T>(data: Page<T>, page: number, map: (item: T) => Choice): Page<Choice> {
  validatePage(data, page, () => {}); const elementos = data.elementos.map(map);
  if (elementos.some(item => !id(item.id) || !text(item.label) || !item.label.trim()) || new Set(elementos.map(item => item.id)).size !== elementos.length) throw invalid();
  return { ...data, elementos };
}

export const canExecute = (roles: string[]) => roles.some(role => ['AE', 'GS', 'RA'].includes(role));
export const executing = (action: Action) => ['PENDIENTE', 'EN_EJECUCION'].includes(action.estado);
export async function currentDelivery(company: string, action: Action, userId: string | undefined, service: ActionService, signal: AbortSignal, scope?: AbortSignal) {
  if (action.estado !== 'EN_REVISION' || !action.entregaVigenteId || !userId || !uuid.test(userId)) throw new ApiError(409, 'ENTREGA_NO_DISPONIBLE', 'La revisión requiere una entrega vigente y una identidad de sesión confirmada.');
  const seen = new Set<string>();
  for (let page = 0; ; page++) {
    if (signal.aborted || scope?.aborted) throw new DOMException('Cancelada', 'AbortError');
    const rows = validateHistory(await service.history(company, action.accionId, page, signal));
    if (signal.aborted || scope?.aborted) throw new DOMException('Cancelada', 'AbortError');
    for (const row of rows) {
      if (seen.has(row.eventoId)) throw new ApiError(409, 'HISTORIAL_CAMBIADO', 'El historial cambió durante la consulta. Actualiza la acción.'); seen.add(row.eventoId);
      if (row.eventoId === action.entregaVigenteId) {
        if (row.tipo !== 'SOLICITUD_REVISION' || row.responsableMembresiaId !== action.responsableMembresiaId || !row.comentario?.trim() || (action.evidenciaRequerida && !row.evidenciaId)) throw new ApiError(409, 'ENTREGA_NO_DISPONIBLE', 'La entrega y la ficha no son coherentes. Consulta el estado actual.');
        return { event: row, own: row.autorId.toLowerCase() === userId.toLowerCase() };
      }
    }
    if (rows.length < 5) throw new ApiError(409, 'ENTREGA_NO_DISPONIBLE', 'No se encontró la entrega vigente en el historial autorizado.');
  }
}
