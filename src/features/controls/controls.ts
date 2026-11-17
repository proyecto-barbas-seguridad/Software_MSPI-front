import { api, ApiError } from '../../shared/api/client';
import type { components } from '../../shared/api/generated/schema';
export type Control = components['schemas']['ControlImplementation'];
export type Version = components['schemas']['ControlVersion'];
export type Verification = components['schemas']['ControlVerification'];
export type Page<T> = { elementos: T[]; pagina: number; tamano: number; hayMas: boolean };
export const controlLabels: Record<string, string> = { PROPUESTO: 'Propuesto', EN_IMPLEMENTACION: 'En implementación', IMPLEMENTADO: 'Implementado', SIN_VERIFICAR: 'Sin verificar', EFECTIVO: 'Efectivo', PARCIALMENTE_EFECTIVO: 'Parcialmente efectivo', NO_EFECTIVO: 'No efectivo', VENCIDA: 'Verificación vencida', EVIDENCIA_BLOQUEADA: 'Evidencia bloqueada', PREVENTIVO: 'Preventivo', DETECTIVO: 'Detectivo', CORRECTIVO: 'Correctivo', MANUAL: 'Manual', AUTOMATICO: 'Automático' };
export const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const id = (v: unknown) => typeof v === 'string' && uuid.test(v);
const text = (v: unknown) => typeof v === 'string';
const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const instant = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));
const day = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && instant(v) && new Date(v).toISOString().slice(0,10) === v;
const invalid = () => new ApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos validar la información del control.');
export interface ControlService {
  list(company: string, page: number, signal: AbortSignal): Promise<Page<Control>>;
  detail(company: string, control: string, signal: AbortSignal): Promise<Control>;
  versions(company: string, control: string, page: number, signal: AbortSignal): Promise<Page<Version>>;
  verifications(company: string, control: string, version: string, page: number, signal: AbortSignal): Promise<Page<Verification>>;
}
export const createControlService = (client = api): ControlService => ({
  list: async (empresaId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/implementaciones-control', { path: { empresaId }, query: { pagina, tamano: 5 }, signal })).data,
  detail: async (empresaId, implementacionId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}', { path: { empresaId, implementacionId }, signal })).data,
  versions: async (empresaId, implementacionId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/versiones', { path: { empresaId, implementacionId }, query: { pagina, tamano: 5 }, signal })).data,
  verifications: async (empresaId, implementacionId, versionId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/versiones/{versionId}/verificaciones', { path: { empresaId, implementacionId, versionId }, query: { pagina, tamano: 5 }, signal })).data,
});
export const controlService = createControlService();
export function validateVersion(v: Version) {
  if (!v || !id(v.versionId) || !count(v.numero) || v.numero < 1 || !v.detalle || !['nombre','descripcion','alcance','trabajo'].every(key => text(v.detalle[key as keyof typeof v.detalle]))
    || !id(v.detalle.responsableId) || (v.detalle.tipo != null && !['PREVENTIVO','DETECTIVO','CORRECTIVO'].includes(v.detalle.tipo)) || (v.detalle.modo != null && !['MANUAL','AUTOMATICO'].includes(v.detalle.modo))
    || (v.motivoCambio !== null && !text(v.motivoCambio)) || !id(v.creadaPor) || !instant(v.creadaEn)) throw invalid();
  const a = v.aplicacion;
  if (a !== null && (!a || !day(a.fechaAplicacion) || !id(a.evidenciaId) || !id(a.registradaPor) || !instant(a.registradaEn))) throw invalid();
  return v;
}
export function validateControl(v: Control, expected?: string) {
  if (!v || !id(v.implementacionId) || (expected && v.implementacionId.toLowerCase() !== expected.toLowerCase()) || !id(v.versionCatalogoId) || !id(v.elementoId)
    || !['PROPUESTO','EN_IMPLEMENTACION','IMPLEMENTADO'].includes(v.estado) || !count(v.revision) || !['SIN_VERIFICAR','EFECTIVO','PARCIALMENTE_EFECTIVO','NO_EFECTIVO'].includes(v.resultadoVigente)
    || (v.ultimaVerificacionId !== null && !id(v.ultimaVerificacionId)) || (v.causaSinVigencia !== null && !['VENCIDA','EVIDENCIA_BLOQUEADA'].includes(v.causaSinVigencia))) throw invalid();
  validateVersion(v.versionActual); return v;
}
export function validateVerification(v: Verification, version: string) {
  if (!v || !id(v.verificacionId) || v.versionId !== version || !count(v.revisionImplementacion) || !['SIN_VERIFICAR','EFECTIVO','PARCIALMENTE_EFECTIVO','NO_EFECTIVO'].includes(v.resultado)
    || !text(v.prueba) || !text(v.fundamento) || !count(v.criteriosEvaluados) || v.criteriosEvaluados < 1 || !count(v.criteriosCumplidos) || v.criteriosCumplidos > v.criteriosEvaluados
    || !day(v.proximaRevision) || !id(v.evidenciaId) || !id(v.verificadaPor) || !instant(v.verificadaEn)) throw invalid();
  return v;
}
export function validatePage<T>(page: Page<T>, expected: number, validate: (item: T) => unknown) {
  if (!page || page.pagina !== expected || page.tamano !== 5 || typeof page.hayMas !== 'boolean' || !Array.isArray(page.elementos) || page.elementos.length > 5) throw invalid();
  page.elementos.forEach(validate); return page;
}
