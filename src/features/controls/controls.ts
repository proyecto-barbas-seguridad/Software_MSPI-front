import { api, ApiError } from '../../shared/api/client';
import type { components, operations } from '../../shared/api/generated/schema';
export type ApplyControl = components['schemas']['ApplyControlImplementation'];
export type VerifyControl = components['schemas']['VerifyControlImplementation'];
export type Evidence = components['schemas']['ResponseEvidence'];
export type Upload = components['schemas']['ControlEvidenceUpload'];
export type UploadBody = operations['cargarEvidenciaControl']['requestBody']['content']['multipart/form-data'];
export type NewControl = components['schemas']['CreateControlImplementation'];
export type ChangeControl = components['schemas']['ChangeControlImplementation'];
export type Choice = { id: string; label: string };
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
  apply(company: string, control: string, body: ApplyControl, signal: AbortSignal): Promise<Control>;
  verify(company: string, control: string, body: VerifyControl, signal: AbortSignal): Promise<Verification>;
  upload(company: string, control: string, version: string, body: UploadBody, signal: AbortSignal): Promise<Upload>;
  evidence(company: string, control: string, version: string, page: number, signal: AbortSignal): Promise<Page<Evidence>>;
  file(company: string, control: string, version: string, evidence: string, signal: AbortSignal): Promise<Blob>;
  create(company: string, body: NewControl, signal: AbortSignal): Promise<Control>;
  start(company: string, control: string, revision: number, signal: AbortSignal): Promise<Control>;
  change(company: string, control: string, body: ChangeControl, signal: AbortSignal): Promise<Control>;
  catalogs(company: string, page: number, signal: AbortSignal): Promise<Page<Choice>>;
  elements(company: string, catalog: string, page: number, signal: AbortSignal): Promise<Page<Choice>>;
  responsibles(company: string, page: number, signal: AbortSignal): Promise<Page<Choice>>;
  list(company: string, page: number, signal: AbortSignal): Promise<Page<Control>>;
  detail(company: string, control: string, signal: AbortSignal): Promise<Control>;
  versions(company: string, control: string, page: number, signal: AbortSignal): Promise<Page<Version>>;
  verifications(company: string, control: string, version: string, page: number, signal: AbortSignal): Promise<Page<Verification>>;
}
export const createControlService = (client = api): ControlService => ({
  apply: async (empresaId, implementacionId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/confirmar-aplicacion', { path: { empresaId, implementacionId }, body, signal })).data,
  verify: async (empresaId, implementacionId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/verificar', { path: { empresaId, implementacionId }, body, signal })).data,
  upload: async (empresaId, implementacionId, versionId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/versiones/{versionId}/evidencias', { path: { empresaId, implementacionId, versionId }, body, signal })).data,
  evidence: async (empresaId, implementacionId, versionId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/versiones/{versionId}/evidencias', { path: { empresaId, implementacionId, versionId }, query: { pagina, tamano: 5 }, signal })).data,
  file: async (empresaId, implementacionId, versionId, evidenciaId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/versiones/{versionId}/evidencias/{evidenciaId}/archivo', { path: { empresaId, implementacionId, versionId, evidenciaId }, signal })).data,
  create: async (empresaId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/implementaciones-control', { path: { empresaId }, body, signal })).data,
  start: async (empresaId, implementacionId, revisionEsperada, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/iniciar', { path: { empresaId, implementacionId }, body: { revisionEsperada }, signal })).data,
  change: async (empresaId, implementacionId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/implementaciones-control/{implementacionId}/cambiar', { path: { empresaId, implementacionId }, body, signal })).data,
  catalogs: async (empresaId, pagina, signal) => {
    const result = validatePage((await client.request('get', '/api/v1/empresas/{empresaId}/catalogos', { path: { empresaId }, query: { pagina, tamano: 5, disponibleNuevos: true }, signal })).data, pagina, item => { if (!id(item.versionId) || !text(item.nombre) || !text(item.codigo) || !text(item.version) || typeof item.disponibleNuevos !== 'boolean') throw invalid(); });
    return { ...result, elementos: result.elementos.filter(item => item.disponibleNuevos).map(item => ({ id: item.versionId, label: `${item.nombre} · ${item.codigo} · ${item.version}` })) };
  },
  elements: async (empresaId, versionId, pagina, signal) => {
    const result = validatePage((await client.request('get', '/api/v1/empresas/{empresaId}/catalogos/{versionId}/elementos', { path: { empresaId, versionId }, query: { pagina, tamano: 5, tipo: 'CONTROL' }, signal })).data, pagina, item => { if (!id(item.elementoId) || item.versionId !== versionId || item.tipo !== 'CONTROL' || !text(item.codigo) || !text(item.titulo)) throw invalid(); });
    return { ...result, elementos: result.elementos.map(item => ({ id: item.elementoId, label: `${item.codigo} · ${item.titulo}` })) };
  },
  responsibles: async (empresaId, pagina, signal) => {
    const result = validatePage((await client.request('get', '/api/v1/empresas/{empresaId}/responsables-negocio', { path: { empresaId }, query: { pagina, tamano: 5, estado: 'ACTIVO' }, signal })).data, pagina, item => { if (!id(item.responsableId) || !text(item.nombre) || item.estado !== 'ACTIVO') throw invalid(); });
    return { ...result, elementos: result.elementos.map(item => ({ id: item.responsableId, label: item.nombre })) };
  },
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

export function validateEvidence(v: Evidence) {
  if (!v || !id(v.evidenciaId) || !text(v.nombreOriginal) || !v.nombreOriginal.trim() || !['application/pdf', 'image/png', 'image/jpeg'].includes(v.tipoDetectado) || !count(v.tamanoBytes) || v.tamanoBytes < 1 || (v.descripcion !== null && !text(v.descripcion)) || !id(v.creadaPor) || !instant(v.creadaEn) || !['PENDIENTE', 'LIMPIA', 'ERROR'].includes(v.estadoInspeccion)) throw invalid();
  return v;
}
