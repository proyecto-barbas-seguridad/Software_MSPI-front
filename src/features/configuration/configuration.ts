import { api, ApiError } from '../../shared/api/client';
import type { components } from '../../shared/api/generated/schema';
export type Configuration = components['schemas']['CompanyConfiguration'];
export type Update = components['schemas']['UpdateCompanyConfiguration'];
export interface ConfigurationService {
  read(company: string, signal: AbortSignal): Promise<Configuration>;
  save(company: string, body: Update, signal: AbortSignal): Promise<void>;
}
export const createConfigurationService = (client = api): ConfigurationService => ({
  read: async (empresaId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/configuracion', { path: { empresaId }, signal })).data,
  save: async (empresaId, body, signal) => {
    const result = await client.request('put', '/api/v1/empresas/{empresaId}/configuracion', { path: { empresaId }, body, signal });
    if (result.status !== 204) throw new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo confirmar el resultado del guardado. Consulta el estado antes de reenviar.');
  },
});
export function validateConfiguration(value: Configuration): Configuration {
  const invalid = () => new ApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos validar la configuración empresarial.');
  if (!value || typeof value.nombre !== 'string' || !value.nombre.trim() || value.nombre.length > 200 || (value.descripcion !== null && typeof value.descripcion !== 'string') || typeof value.zonaHoraria !== 'string' || !value.zonaHoraria.trim() || !Number.isSafeInteger(value.revision) || value.revision < 1) throw invalid();
  // The server decides which IANA zones it accepts. Reading also requires browser support to display company times.
  try { new Intl.DateTimeFormat('es-CO', { timeZone: value.zonaHoraria }).format(); } catch { throw invalid(); }
  return value;
}
export function validateUpdate(value: Update): Update {
  if (typeof value.nombre !== 'string' || !value.nombre.trim() || value.nombre.trim().length > 200 || typeof value.zonaHoraria !== 'string' || !value.zonaHoraria.trim() || !Number.isSafeInteger(value.revisionEsperada) || value.revisionEsperada < 1 || (value.descripcion !== null && typeof value.descripcion !== 'string')) throw new ApiError(400, 'DATOS_INVALIDOS', 'Completa nombre y zona horaria; el nombre admite hasta 200 caracteres.');
  return { nombre: value.nombre.trim(), descripcion: value.descripcion, zonaHoraria: value.zonaHoraria.trim(), revisionEsperada: value.revisionEsperada };
}
