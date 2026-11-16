import type { ApiResult, createApiClient } from './client';
import type { components } from './generated/schema';

/** Compiled contract assertions; never invoked or bundled by the application. */
export function assertContract(client: ReturnType<typeof createApiClient>) {
  const session: Promise<ApiResult<components['schemas']['SessionView']>> = client.request('get', '/api/v1/identidad/sesion', {});
  // @ts-expect-error The contract has no PUT session operation.
  client.request('put', '/api/v1/identidad/sesion', {});
  // @ts-expect-error The path company is mandatory, never inferred from another request.
  client.request('get', '/api/v1/empresas/{empresaId}/contexto', {});
  // @ts-expect-error Credentials must match the backend DTO.
  client.request('post', '/api/v1/identidad/sesion', { body: { email: 'fixture', password: 'fixture' } });
  // @ts-expect-error The query uses the documented enum, not an arbitrary string.
  client.request('get', '/api/v1/empresas/{empresaId}/activos', { path: { empresaId: 'fixture' }, query: { tipo: 'OTRO' } });
  return session;
}
