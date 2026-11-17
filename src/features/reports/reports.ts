import { api, ApiError } from '../../shared/api/client';
import type { components, operations } from '../../shared/api/generated/schema';
import { calendarDay } from '../../shared/date/companyDay';
export type Report = components['schemas']['CompanyBasicReport'];
export type Query = NonNullable<operations['generarReporteBasicoEmpresa']['parameters']['query']>;
export type Section = NonNullable<Query['secciones']>[number];
export type Method = components['schemas']['ReportMethodReference'];
export type EvaluationChoice = { id: string; label: string };
export type Choices = { elementos: EvaluationChoice[]; pagina: number; tamano: number; hayMas: boolean };
export const sections: Section[] = ['EVALUACIONES', 'RIESGOS', 'ACCIONES'];
export const sectionNames = { EVALUACIONES: 'Evaluaciones', RIESGOS: 'Riesgos', ACCIONES: 'Acciones' };
export const filters = [
  { key: 'estadoEvaluacion', label: 'Estado de evaluación', values: ['BORRADOR', 'EN_REVISION', 'CERRADA'] },
  { key: 'estadoRiesgo', label: 'Estado de riesgo', values: ['IDENTIFICADO', 'EN_ANALISIS', 'EN_TRATAMIENTO', 'EN_SEGUIMIENTO', 'CERRADO'] },
  { key: 'situacionRiesgo', label: 'Situación de valoración', values: ['VIGENTE', 'PENDIENTE', 'REVISION_REQUERIDA'] },
  { key: 'nivelRiesgo', label: 'Nivel de riesgo vigente', values: ['BAJO', 'MODERADO', 'ALTO', 'EXTREMO'] },
  { key: 'probabilidad', label: 'Probabilidad vigente', values: ['MUY_BAJA', 'BAJA', 'MEDIA', 'ALTA', 'MUY_ALTA'] },
  { key: 'impacto', label: 'Impacto vigente', values: ['LEVE', 'MENOR', 'MODERADO', 'MAYOR', 'CATASTROFICO'] },
  { key: 'estadoAccion', label: 'Estado de acción', values: ['PENDIENTE', 'EN_EJECUCION', 'EN_REVISION', 'COMPLETADA', 'CANCELADA'] },
] as const;
export const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const id = (value: unknown) => typeof value === 'string' && uuid.test(value);
const text = (value: unknown) => typeof value === 'string';
const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const invalid = () => new ApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos validar los datos del reporte. No está disponible para imprimir.');
export function effectiveQuery(input: Query): Query {
  const bad = () => new ApiError(400, 'FILTROS_INVALIDOS', 'Revisa el periodo, las secciones y los filtros del reporte.');
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !['desde', 'hasta', 'evaluacionId', 'baseRiesgo', ...filters.map(item => item.key), 'vencida', 'secciones'].includes(key))) throw bad();
  if ((input.desde !== undefined && !calendarDay(input.desde)) || (input.hasta !== undefined && !calendarDay(input.hasta)) || (input.desde && input.hasta && input.desde > input.hasta) || (input.evaluacionId !== undefined && !id(input.evaluacionId)) || (input.vencida !== undefined && typeof input.vencida !== 'boolean') || (input.baseRiesgo !== undefined && !['INHERENTE', 'RESIDUAL'].includes(input.baseRiesgo))) throw bad();
  for (const filter of filters) if (input[filter.key] !== undefined && !(filter.values as readonly string[]).includes(input[filter.key]!)) throw bad();
  const selected = input.secciones ?? sections;
  if (!Array.isArray(selected) || !selected.length || new Set(selected).size !== selected.length || selected.some(value => !sections.includes(value))) throw bad();
  const result: Query = { baseRiesgo: input.baseRiesgo ?? 'RESIDUAL', secciones: sections.filter(value => selected.includes(value)) };
  for (const key of ['desde', 'hasta', 'evaluacionId', ...filters.map(item => item.key), 'vencida'] as const) if (input[key] !== undefined) Object.assign(result, { [key]: input[key] });
  return result;
}
export function queryKey(query: Query) { return JSON.stringify(effectiveQuery(query)); }
export interface ReportService {
  generate(company: string, query: Query, signal: AbortSignal): Promise<Report>;
  evaluations(company: string, page: number, signal: AbortSignal): Promise<Choices>;
}
export const createReportService = (client = api): ReportService => ({
  generate: async (empresaId, query, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/reportes/basico', { path: { empresaId }, query, signal })).data,
  evaluations: async (empresaId, pagina, signal) => {
    const result = (await client.request('get', '/api/v1/empresas/{empresaId}/evaluaciones', { path: { empresaId }, query: { pagina, tamano: 5 }, signal })).data;
    if (!result || result.pagina !== pagina || result.tamano !== 5 || typeof result.hayMas !== 'boolean' || !Array.isArray(result.elementos) || result.elementos.length > 5 || result.elementos.some(item => !item || !id(item.evaluacionId) || !text(item.nombre))) throw invalid();
    return { ...result, elementos: result.elementos.map(item => ({ id: item.evaluacionId, label: item.nombre })) };
  },
});
function counts(value: Record<string, number>, codes: readonly string[], total?: number) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.entries(value).some(([key, n]) => !codes.includes(key) || !count(n)) || (total !== undefined && Object.values(value).reduce((a, b) => a + b, 0) !== total)) throw invalid();
}
function aggregate(value: { total: number; porEstado: Record<string, number>; elementos: unknown[] }, codes: readonly string[]) {
  if (!value || !count(value.total) || !Array.isArray(value.elementos)) throw invalid(); counts(value.porEstado, codes, value.total);
}
function methods(rows: Method[]) {
  if (!Array.isArray(rows) || rows.some(item => !item || !id(item.versionId) || ![item.codigo, item.version, item.identificador, item.nombre].every(value => text(value) && value.trim())) || new Set(rows.map(item => item.versionId)).size !== rows.length) throw invalid();
}
export function validateReport(data: Report, company: string, input: Query) {
  const query = effectiveQuery(input); const requested = query.secciones!;
  if (!data || !id(data.empresaId) || data.empresaId.toLowerCase() !== company.toLowerCase() || !text(data.empresa) || !data.empresa.trim() || !text(data.generadoEn) || !data.generadoEn.includes('T') || !Number.isFinite(Date.parse(data.generadoEn)) || !data.filtros || !Array.isArray(data.secciones) || data.secciones.length !== requested.length || new Set(data.secciones).size !== requested.length || data.secciones.some(value => !requested.includes(value))) throw invalid();
  try { new Intl.DateTimeFormat('es-CO', { timeZone: data.zonaHoraria }).format(new Date(data.generadoEn)); } catch { throw invalid(); }
  if (typeof data.zonaHoraria !== 'string' || !data.zonaHoraria) throw invalid();
  for (const key of ['desde', 'hasta', 'evaluacionId', 'baseRiesgo', ...filters.map(item => item.key), 'vencida'] as const) if (data.filtros[key] !== (query[key] ?? null)) throw invalid();
  if (requested.includes('EVALUACIONES')) {
    if (!data.evaluaciones) throw invalid(); const value = data.evaluaciones; aggregate(value.datos, filters[0].values); methods(value.metodologias);
    if (value.datos.elementos.length > (query.evaluacionId ? 1 : 0) || (query.evaluacionId && value.datos.total !== value.datos.elementos.length)) throw invalid();
    for (const row of value.datos.elementos) if (!row || row.evaluacionId !== query.evaluacionId || !text(row.nombre) || !calendarDay(row.fecha) || !filters[0].values.includes(row.estado) || !id(row.versionCatalogoId) || !id(row.versionMetodologiaId) || !value.metodologias.some(method => method.versionId === row.versionMetodologiaId) || ![row.sinDecidir, row.sinCalificacion, row.heredadasPendientes, row.controlesAplicables, row.controlesEvaluados, row.clausulasAplicables, row.clausulasEvaluadas].every(count) || row.controlesEvaluados > row.controlesAplicables || row.clausulasEvaluadas > row.clausulasAplicables || (query.estadoEvaluacion && row.estado !== query.estadoEvaluacion) || (query.desde && row.fecha < query.desde) || (query.hasta && row.fecha > query.hasta)) throw invalid();
  } else if (data.evaluaciones !== null) throw invalid();
  if (requested.includes('RIESGOS')) {
    if (!data.riesgos) throw invalid(); const value = data.riesgos; aggregate(value.datos, filters[1].values); methods(value.metodologias);
    const n = value.datos; counts(n.porSituacion, filters[2].values, n.total); counts(n.porNivel, filters[3].values, n.porSituacion.VIGENTE ?? 0);
    if (n.elementos.length || !Array.isArray(n.matriz) || n.matriz.some(cell => !cell || !filters[4].values.includes(cell.probabilidad) || !filters[5].values.includes(cell.impacto) || !filters[3].values.includes(cell.nivel) || !count(cell.total)) || new Set(n.matriz.map(cell => [cell.probabilidad, cell.impacto, cell.nivel].join(':'))).size !== n.matriz.length || n.matriz.reduce((total, cell) => total + cell.total, 0) !== (n.porSituacion.VIGENTE ?? 0)) throw invalid();
  } else if (data.riesgos !== null) throw invalid();
  if (requested.includes('ACCIONES')) {
    if (!data.acciones) throw invalid(); aggregate(data.acciones, filters[6].values);
    if (data.acciones.elementos.length || !count(data.acciones.vencidas) || data.acciones.vencidas > data.acciones.total) throw invalid();
  } else if (data.acciones !== null) throw invalid();
  return data;
}
