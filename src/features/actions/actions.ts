import { api, ApiError } from '../../shared/api/client';
import type { components } from '../../shared/api/generated/schema';
import { calendarDay } from '../../shared/date/companyDay';
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
  list(company: string, page: number, signal: AbortSignal): Promise<Page<Action>>;
  detail(company: string, action: string, signal: AbortSignal): Promise<Action>;
  history(company: string, action: string, page: number, signal: AbortSignal): Promise<ActionEvent[]>;
  evidence(company: string, action: string, page: number, signal: AbortSignal): Promise<Page<Evidence>>;
  file(company: string, action: string, evidence: string, kind: 'action' | 'context', signal: AbortSignal): Promise<Blob>;
}
export const createActionService = (client = api): ActionService => ({
  list: async (empresaId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/acciones', { path: { empresaId }, query: { pagina, tamano: 5 }, signal })).data,
  detail: async (empresaId, accionId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/acciones/{accionId}', { path: { empresaId, accionId }, signal })).data,
  history: async (empresaId, accionId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/acciones/{accionId}/historial', { path: { empresaId, accionId }, query: { pagina, tamano: 5 }, signal })).data,
  evidence: async (empresaId, accionId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/acciones/{accionId}/evidencias', { path: { empresaId, accionId }, query: { pagina, tamano: 5 }, signal })).data,
  file: async (empresaId, accionId, evidenciaId, kind, signal) => (await client.request('get', kind === 'context' ? '/api/v1/empresas/{empresaId}/acciones/{accionId}/evidencias-contexto/{evidenciaId}/archivo' : '/api/v1/empresas/{empresaId}/acciones/{accionId}/evidencias/{evidenciaId}/archivo', { path: { empresaId, accionId, evidenciaId }, signal })).data,
});
export function validateAction(v: Action, expected?: string) {
  if (!v || !id(v.accionId) || (expected && v.accionId.toLowerCase() !== expected.toLowerCase()) || !text(v.codigo) || !nullableId(v.riesgoId) || !nullableId(v.hallazgoId) || !optionalText(v.nombreActivo)
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
