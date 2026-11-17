import { api, ApiError } from '../../shared/api/client';
import type { components, operations } from '../../shared/api/generated/schema';
export type Risk = components['schemas']['Risk'];
export type NewRisk = components['schemas']['CreateRisk'];
export type EditRisk = components['schemas']['EditRisk'];
export type Reference = { id: string; label: string };
export type RiskPage = components['schemas']['RiskPage'];
export type RiskQuery = NonNullable<operations['listarRiesgos']['parameters']['query']>;
export type Inherent = components['schemas']['InherentAssessment'];
export type Residual = components['schemas']['ResidualAssessment'];
export type ControlLink = components['schemas']['RiskControlLink'];
export type Acceptance = components['schemas']['RiskAcceptance'];
export type History = { inherent: Inherent; residual: Residual; links: ControlLink; acceptances: Acceptance };
export type Page<T> = { elementos: T[]; pagina: number; tamano: number; hayMas: boolean };
export const states = ['IDENTIFICADO', 'EN_ANALISIS', 'EN_TRATAMIENTO', 'EN_SEGUIMIENTO', 'CERRADO'] as const;
export const levels = ['BAJO', 'MODERADO', 'ALTO', 'EXTREMO'];
export const probabilities = ['MUY_BAJA', 'BAJA', 'MEDIA', 'ALTA', 'MUY_ALTA'];
export const impacts = ['LEVE', 'MENOR', 'MODERADO', 'MAYOR', 'CATASTROFICO'];
export const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const id = (value: unknown) => typeof value === 'string' && uuid.test(value);
const optionalId = (value: unknown) => value === null || id(value);
const text = (value: unknown) => typeof value === 'string';
const optionalText = (value: unknown) => value === null || value === undefined || text(value);
const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const instant = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const date = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && instant(value) && new Date(value).toISOString().slice(0, 10) === value;
const invalid = () => new ApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos validar la información de riesgos.');
export interface RiskService {
  create(company: string, body: NewRisk, signal: AbortSignal): Promise<Risk>;
  edit(company: string, risk: string, body: EditRisk, signal: AbortSignal): Promise<Risk>;
  analyze(company: string, risk: string, revision: number, signal: AbortSignal): Promise<Risk>;
  assets(company: string, page: number, text: string, signal: AbortSignal): Promise<Page<Reference>>;
  responsibles(company: string, page: number, signal: AbortSignal): Promise<Page<Reference>>;
  list(company: string, query: RiskQuery, signal: AbortSignal): Promise<RiskPage>;
  detail(company: string, risk: string, signal: AbortSignal): Promise<Risk>;
  inherent(company: string, risk: string, page: number, signal: AbortSignal): Promise<Page<Inherent>>;
  residual(company: string, risk: string, page: number, signal: AbortSignal): Promise<Page<Residual>>;
  links(company: string, risk: string, page: number, signal: AbortSignal): Promise<Page<ControlLink>>;
  acceptances(company: string, risk: string, page: number, signal: AbortSignal): Promise<Page<Acceptance>>;
}
export const createRiskService = (client = api): RiskService => ({
  create: async (empresaId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/riesgos', { path: { empresaId }, body, signal })).data,
  edit: async (empresaId, riesgoId, body, signal) => (await client.request('put', '/api/v1/empresas/{empresaId}/riesgos/{riesgoId}', { path: { empresaId, riesgoId }, body, signal })).data,
  analyze: async (empresaId, riesgoId, revisionEsperada, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/iniciar-analisis', { path: { empresaId, riesgoId }, body: { revisionEsperada }, signal })).data,
  assets: async (empresaId, pagina, texto, signal) => {
    const result = validatePage((await client.request('get', '/api/v1/empresas/{empresaId}/activos', { path: { empresaId }, query: { pagina, tamano: 5, estado: 'ACTIVO', texto: texto || undefined }, signal })).data, pagina, item => { if (!id(item.activoId) || !text(item.codigo) || !text(item.nombre) || item.estado !== 'ACTIVO') throw invalid(); });
    return { ...result, elementos: result.elementos.map(item => ({ id: item.activoId, label: item.codigo + ' · ' + item.nombre })) };
  },
  responsibles: async (empresaId, pagina, signal) => {
    const result = validatePage((await client.request('get', '/api/v1/empresas/{empresaId}/responsables-negocio', { path: { empresaId }, query: { pagina, tamano: 5, estado: 'ACTIVO' }, signal })).data, pagina, item => { if (!id(item.responsableId) || !text(item.nombre) || item.estado !== 'ACTIVO') throw invalid(); });
    return { ...result, elementos: result.elementos.map(item => ({ id: item.responsableId, label: item.nombre })) };
  },
  list: async (empresaId, query, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/riesgos', { path: { empresaId }, query, signal })).data,
  detail: async (empresaId, riesgoId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/riesgos/{riesgoId}', { path: { empresaId, riesgoId }, signal })).data,
  inherent: async (empresaId, riesgoId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/valoraciones-inherentes', { path: { empresaId, riesgoId }, query: { pagina, tamano: 5 }, signal })).data,
  residual: async (empresaId, riesgoId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/valoraciones-residuales', { path: { empresaId, riesgoId }, query: { pagina, tamano: 5 }, signal })).data,
  links: async (empresaId, riesgoId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/implementaciones-control', { path: { empresaId, riesgoId }, query: { pagina, tamano: 5 }, signal })).data,
  acceptances: async (empresaId, riesgoId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/riesgos/{riesgoId}/aceptaciones', { path: { empresaId, riesgoId }, query: { pagina, tamano: 5 }, signal })).data,
});
export function validateRisk(value: Risk, expected?: string) {
  if (!value || !id(value.riesgoId) || (expected && value.riesgoId.toLowerCase() !== expected.toLowerCase()) || !text(value.codigo) || !states.includes(value.estado)
    || !count(value.revision) || !value.detalle || !id(value.detalle.activoPrincipalId) || !id(value.detalle.responsableId)
    || !text(value.detalle.amenaza) || !text(value.detalle.vulnerabilidad) || !text(value.detalle.descripcion)
    || (value.detalle.tratamientoPropuesto != null && !['REDUCIR', 'COMPARTIR', 'ACEPTAR', 'EVITAR'].includes(value.detalle.tratamientoPropuesto!))
    || !optionalId(value.inherenteVigenteId) || !optionalId(value.riesgoRelacionadoId) || (value.nivelInherente !== null && !levels.includes(value.nivelInherente))
    || typeof value.requiereRevision !== 'boolean' || !optionalText(value.motivoRevision) || !id(value.creadaPor) || !instant(value.creadaEn)) throw invalid();
  if (value.cierre !== null) {
    const c = value.cierre;
    if (!c || value.estado !== 'CERRADO' || !text(c.justificacion) || !id(c.cerradaPor) || !instant(c.cerradaEn) || !id(c.inherenteId)
      || !id(c.residualId) || !optionalId(c.aceptacionId) || !c.accionesCanceladas || typeof c.accionesCanceladas !== 'object' || Array.isArray(c.accionesCanceladas)
      || Object.entries(c.accionesCanceladas).some(([key, reason]) => !id(key) || !text(reason))) throw invalid();
  } else if (value.estado === 'CERRADO') throw invalid();
  return value;
}
export function validatePage<T>(value: Page<T>, page: number, validate: (item: T) => unknown) {
  if (!value || value.pagina !== page || value.tamano !== 5 || typeof value.hayMas !== 'boolean' || !Array.isArray(value.elementos) || value.elementos.length > 5) throw invalid();
  value.elementos.forEach(validate); return value;
}
function inputs(value: components['schemas']['InherentInputs']) {
  if (!value || (value.probabilidad != null && !probabilities.includes(value.probabilidad)) || (value.impacto != null && !impacts.includes(value.impacto))
    || !['periodoReferencia', 'fundamento', 'supuestos', 'fuente'].every(key => optionalText(value[key as keyof typeof value]))) throw invalid();
}
function assessment(value: Inherent | Residual, risk: string) {
  if (!value || value.riesgoId !== risk || !id(value.versionMetodologiaId) || !count(value.revisionRiesgo) || !['BORRADOR', 'CONFIRMADA'].includes(value.estadoResultado)
    || (value.nivel !== null && !levels.includes(value.nivel)) || ![value.probabilidadIndice, value.impactoIndice].every(v => v === null || (typeof v === 'number' && Number.isFinite(v) && v >= 0))
    || typeof value.requiereRevision !== 'boolean' || !optionalText(value.motivoReevaluacion) || !instant(value.creadaEn) || !id(value.creadaPor)
    || !optionalId(value.confirmadaPor) || (value.confirmadaEn !== null && !instant(value.confirmadaEn))) throw invalid();
}
export const validators: { [K in keyof History]: (value: History[K], risk: string) => void } = {
  inherent: (value, risk) => { assessment(value, risk); inputs(value.entradas); if (!id(value.valoracionId) || !optionalId(value.valoracionAnteriorId)) throw invalid();
    if (value.base !== null && (!value.base || !id(value.base.activoPrincipalId) || !text(value.base.amenaza) || !text(value.base.vulnerabilidad) || !text(value.base.descripcion))) throw invalid(); },
  residual: (value, risk) => { assessment(value, risk); if (!value.datos) throw invalid(); inputs(value.datos.entradas);
    if (!id(value.residualId) || !id(value.inherenteId) || !optionalId(value.anteriorId) || typeof value.vigente !== 'boolean'
      || (value.datos.sinMitigacion != null && typeof value.datos.sinMitigacion !== 'boolean') || !optionalText(value.datos.justificacionSinMitigacion)
      || (value.datos.verificaciones != null && (!Array.isArray(value.datos.verificaciones) || !value.datos.verificaciones.every(id))) || !Array.isArray(value.pruebas) || !Array.isArray(value.avisos)) throw invalid();
    for (const p of value.pruebas) if (!p || ![p.implementacionId, p.versionId, p.verificacionId, p.evidenciaAplicacionId, p.evidenciaVerificacionId].every(id) || !instant(p.venceEn)) throw invalid();
    for (const n of value.avisos) if (!n || !['CONTEXTO_CAMBIADO', 'INHERENTE_SUSTITUIDA', 'VERSION_CONTROL_CAMBIADA', 'VERIFICACION_SUSTITUIDA', 'EVIDENCIA_BLOQUEADA', 'CONTROL_VINCULADO', 'VERIFICACION_VENCIDA'].includes(n.causa) || !id(n.referenciaId) || !instant(n.detectadoEn) || (n.resueltoEn !== null && !instant(n.resueltoEn))) throw invalid(); },
  links: value => { if (!value || !id(value.vinculoId) || !id(value.implementacionId) || !['PROBABILIDAD', 'IMPACTO', 'AMBOS'].includes(value.efectoEsperado) || !text(value.justificacion) || !count(value.revisionRiesgo) || !id(value.creadaPor) || !instant(value.creadaEn)) throw invalid(); },
  acceptances: (value, risk) => { if (!value || value.riesgoId !== risk || ![value.aceptacionId, value.inherenteId, value.residualId, value.aprobadaPor].every(id) || !text(value.justificacion) || !date(value.fechaProximaRevision) || !instant(value.aprobadaEn) || !['VIGENTE', 'REVISION_PENDIENTE', 'HISTORICA'].includes(value.estado) || !count(value.revisionRiesgo)) throw invalid(); },
};
