import { api, ApiError } from '../../shared/api/client';
import type { components, operations } from '../../shared/api/generated/schema';

export type Panel = components['schemas']['CompanyPanel'];
export type Results = components['schemas']['EvaluationResults'];
export type Totals = components['schemas']['EvaluationTotals'];
export type PanelQuery = NonNullable<operations['consultarPanelEmpresa']['parameters']['query']>;
export interface PanelService {
  panel(id: string, query: PanelQuery, signal: AbortSignal): Promise<Panel>;
  results(id: string, evaluationId: string, signal: AbortSignal): Promise<Results>;
}
export const createPanelService = (client = api): PanelService => ({
  panel: async (empresaId, query, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/panel', { path: { empresaId }, query, signal })).data,
  results: async (empresaId, evaluacionId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/resultados', { path: { empresaId, evaluacionId }, signal })).data,
});
export const labels: Record<string, string> = {
  BORRADOR: 'Borrador', EN_REVISION: 'En revisión', CERRADA: 'Cerrada',
  IDENTIFICADO: 'Identificado', EN_ANALISIS: 'En análisis', EN_TRATAMIENTO: 'En tratamiento', EN_SEGUIMIENTO: 'En seguimiento', CERRADO: 'Cerrado',
  PENDIENTE: 'Pendiente', EN_EJECUCION: 'En ejecución', COMPLETADA: 'Completada', CANCELADA: 'Cancelada',
  VIGENTE: 'Vigente', REVISION_REQUERIDA: 'Revisión requerida', BAJO: 'Bajo', MODERADO: 'Moderado', ALTO: 'Alto', EXTREMO: 'Extremo',
  SIN_ELEMENTOS: 'Sin elementos', NO_APLICA: 'No aplica', PROVISIONAL: 'Provisional', CALCULADO: 'Calculado',
  MUY_BAJA: 'Muy baja', BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta', MUY_ALTA: 'Muy alta',
  LEVE: 'Leve', MENOR: 'Menor', MAYOR: 'Mayor', CATASTROFICO: 'Catastrófico',
  ORGANIZACIONAL: 'Organizacionales', PERSONAS: 'Personas', FISICO: 'Físicos', TECNOLOGICO: 'Tecnológicos',
};
export const number = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
export const date = (value: string) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value + 'T00:00:00Z'));
export function timestamp(value: string, zone: string) {
  return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: zone }).format(new Date(value));
}
const invalid = () => new ApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos validar los datos del panel.');
const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const calendarDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const map = (value: unknown) => value !== null && typeof value === 'object' && !Array.isArray(value) && Object.values(value).every(count);
export function validatePanel(data: Panel, companyId: string, query: PanelQuery) {
  if (!data || data.empresaId?.toLowerCase() !== companyId.toLowerCase() || typeof data.empresa !== 'string'
    || !Number.isFinite(Date.parse(data.generadoEn)) || data.pagina !== (query.pagina ?? 0) || data.tamano !== (query.tamano ?? 5)
    || data.detalle !== (query.detalle ?? 'EVALUACIONES') || !data.filtros || data.filtros.baseRiesgo !== (query.baseRiesgo ?? 'RESIDUAL')
    || data.filtros.desde !== (query.desde || null) || data.filtros.hasta !== (query.hasta || null)) throw invalid();
  try { timestamp(data.generadoEn, data.zonaHoraria); } catch { throw invalid(); }
  for (const section of [data.evaluaciones, data.riesgos, data.acciones]) {
    if (!section || !count(section.total) || !map(section.porEstado) || !Array.isArray(section.elementos)) throw invalid();
  }
  if (!map(data.riesgos.porSituacion) || !map(data.riesgos.porNivel) || !count(data.acciones.vencidas) || !Array.isArray(data.riesgos.matriz)) throw invalid();
  for (const cell of data.riesgos.matriz) if (!cell || !count(cell.total) || !labels[cell.probabilidad] || !labels[cell.impacto] || !labels[cell.nivel]) throw invalid();
  for (const evaluation of data.evaluaciones.elementos) {
    if (!evaluation || !uuid.test(evaluation.evaluacionId) || typeof evaluation.nombre !== 'string'
      || !calendarDate(evaluation.fecha) || !labels[evaluation.estado]
      || ![evaluation.sinDecidir, evaluation.sinCalificacion, evaluation.heredadasPendientes,
        evaluation.controlesAplicables, evaluation.controlesEvaluados, evaluation.clausulasAplicables, evaluation.clausulasEvaluadas].every(count)) throw invalid();
  }
  for (const risk of data.riesgos.elementos) if (!risk || !uuid.test(risk.riesgoId) || typeof risk.codigo !== 'string' || !labels[risk.estado] || !labels[risk.situacion]
    || (risk.nivel !== null && !labels[risk.nivel]) || (risk.probabilidad !== null && !labels[risk.probabilidad]) || (risk.impacto !== null && !labels[risk.impacto])) throw invalid();
  for (const action of data.acciones.elementos) if (!action || !uuid.test(action.accionId) || typeof action.codigo !== 'string' || !labels[action.estado]
    || !calendarDate(action.fechaLimite) || typeof action.vencida !== 'boolean') throw invalid();
  return data;
}
function validateTotals(value: Totals) {
  if (!value || ![value.total, value.aplicables, value.evaluados, value.pendientes, value.sinDecidir, value.noAplican].every(count)
    || !['SIN_ELEMENTOS', 'NO_APLICA', 'PENDIENTE', 'PROVISIONAL', 'CALCULADO'].includes(value.estado)
    || [value.puntaje, value.avance].some(metric => metric !== null && (typeof metric !== 'number' || !Number.isFinite(metric) || metric < 0 || metric > 100))) throw invalid();
}
export function validateResults(data: Results, evaluationId: string) {
  if (!data || data.evaluacionId !== evaluationId || !count(data.revision) || !Array.isArray(data.dominios) || !Array.isArray(data.clausulas)) throw invalid();
  validateTotals(data.controlesGlobal);
  for (const group of [...data.dominios, ...data.clausulas]) {
    if (!group || typeof group.grupo !== 'string') throw invalid();
    validateTotals(group.resultado);
  }
  return data;
}
