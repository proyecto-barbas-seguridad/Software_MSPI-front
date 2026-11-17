import { api, ApiError } from '../../shared/api/client';
import type { components, operations } from '../../shared/api/generated/schema';
export type Event = components['schemas']['CompanyActivityEvent'];
export type Page = components['schemas']['CompanyActivityPage'];
type Query = NonNullable<operations['consultarActividadEmpresarial']['parameters']['query']>;
export type Filters = Omit<Query, 'cursor' | 'tamano'>;
export interface ActivityService { list(company: string, filters: Filters, cursor: string | undefined, signal: AbortSignal): Promise<Page> }
export const createActivityService = (client = api): ActivityService => ({
  list: async (empresaId, filters, cursor, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/actividad', { path: { empresaId }, query: { ...filters, tamano: 5, cursor }, signal })).data,
});
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const code = /^[A-Z][A-Z0-9_]{0,79}$/;
// Require an explicit offset: never reinterpret browser-local time as company-local time.
function instant(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  const year = Number(value.slice(0, 4)), month = Number(value.slice(5, 7)), day = Number(value.slice(8, 10));
  const days = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1] && Number.isFinite(Date.parse(value)) && Number(value.slice(11, 13)) < 24 && Date.parse(value) >= Date.parse('0001-01-01T00:00:00Z') && Date.parse(value) < Date.parse('9999-12-31T23:59:59.999Z') + 1;
}
export const filterFields = [
  { key: 'desde', label: 'Desde (instante inclusivo)', hint: '2026-11-17T00:00:00-05:00', max: 40 },
  { key: 'hasta', label: 'Hasta (instante exclusivo)', hint: '2026-11-18T00:00:00-05:00', max: 40 },
  { key: 'actorId', label: 'Identificador de actor', hint: 'UUID del usuario', max: 36 },
  { key: 'accion', label: 'Código de acción', hint: 'Código exacto en mayúsculas', max: 80 },
  { key: 'tipoObjeto', label: 'Tipo de objeto', hint: 'Código exacto en mayúsculas', max: 80 },
  { key: 'objetoId', label: 'Identificador de objeto', hint: 'UUID del objeto', max: 36 },
] as const;
export function effectiveFilters(input: Filters): Filters {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !filterFields.some(field => field.key === key))) throw new ApiError(400, 'FILTROS_INVALIDOS', 'Revisa los filtros de actividad.');
  const result: Filters = {};
  for (const field of filterFields) {
    const raw = input[field.key]; if (raw === undefined || raw === '') continue;
    if (typeof raw !== 'string') throw new ApiError(400, 'FILTROS_INVALIDOS', 'Revisa los filtros de actividad.');
    const value = raw.trim(); if (!value) continue;
    const valid = field.key === 'desde' || field.key === 'hasta' ? instant(value) : field.key === 'actorId' || field.key === 'objetoId' ? uuid.test(value) : code.test(value);
    if (!valid) throw new ApiError(400, 'FILTROS_INVALIDOS', 'Revisa los instantes con zona, los UUID y los códigos en mayúsculas.');
    result[field.key] = value;
  }
  const nanos = (value: string) => BigInt(Date.parse(value)) * 1000000n + BigInt((value.match(/\.(\d+)/)?.[1] || '').padEnd(9, '0').slice(3));
  if (result.desde && result.hasta && nanos(result.desde) >= nanos(result.hasta)) throw new ApiError(400, 'PERIODO_INVALIDO', 'Desde debe ser anterior a Hasta; Hasta es exclusivo.');
  return result;
}
export function validatePage(data: Page, usedCursors: (string | undefined)[]): Page {
  const invalid = () => new ApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos validar el registro de actividad. Vuelve a consultar.');
  if (!data || !Array.isArray(data.elementos) || data.elementos.length > 5 || (data.siguienteCursor !== null && (typeof data.siguienteCursor !== 'string' || !data.siguienteCursor.length || data.siguienteCursor.length > 160 || usedCursors.includes(data.siguienteCursor) || !data.elementos.length))) throw invalid();
  const seen = new Set<string>();
  for (const event of data.elementos) {
    if (!event || !['ADMINISTRATIVA', 'OPERATIVA'].includes(event.origen) || typeof event.eventoId !== 'string' || !event.eventoId || ![event.actorId, event.objetoId, event.correlacionId].every(value => typeof value === 'string' && uuid.test(value)) || ![event.accion, event.tipoObjeto, event.resultado].every(value => typeof value === 'string' && value.trim()) || (event.motivo !== null && (typeof event.motivo !== 'string' || event.motivo.length > 2000)) || !instant(event.registradoEn)) throw invalid();
    const key = event.origen + ':' + event.eventoId; if (seen.has(key)) throw invalid(); seen.add(key);
  }
  return data;
}
