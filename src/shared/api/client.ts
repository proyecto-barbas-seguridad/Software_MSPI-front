import contract from './generated/operations.json';
import type { paths } from './generated/schema';

export type Method = 'get' | 'head' | 'post' | 'put' | 'delete';
type PathFor<M extends Method> = { [P in keyof paths]: paths[P][M] extends undefined ? never : P }[keyof paths];
type Operation<P extends keyof paths, M extends Method> = NonNullable<paths[P][M]>;
type Params<O> = O extends { parameters: infer P } ? P : never;
type Param<O, K extends PropertyKey> = K extends keyof Params<O> ? NonNullable<Params<O>[K]> : never;
type PathOptions<O> = [Param<O, 'path'>] extends [never] ? { path?: never } : { path: Param<O, 'path'> };
type QueryOptions<O> = [Param<O, 'query'>] extends [never] ? { query?: never }
  : {} extends Param<O, 'query'> ? { query?: Param<O, 'query'> } : { query: Param<O, 'query'> };
type BodyOptions<O> = O extends { requestBody: { content: infer C } }
  ? 'application/json' extends keyof C ? { body: C['application/json'] }
    : 'multipart/form-data' extends keyof C ? { body: C['multipart/form-data'] } : { body?: never }
  : { body?: never };
export type RequestOptions<O> = PathOptions<O> & QueryOptions<O> & BodyOptions<O> & { signal?: AbortSignal };
type ResponseData<R> = R extends { content: infer C }
  ? 'application/json' extends keyof C ? C['application/json'] : Blob : undefined;
type Success<O> = O extends { responses: infer R } ? ResponseData<R[Extract<keyof R, 200 | 201 | 202 | 204>]> : never;

export interface FieldProblem { field: string; code: string; message: string }
export interface ApiResult<T> {
  data: T;
  status: number;
  correlationId?: string;
  retryAfter?: number;
  contentDisposition?: string;
}
export class ApiError extends Error {
  readonly name = 'ApiError';
  constructor(readonly status: number, readonly code: string, detail: string,
    readonly fields: FieldProblem[] = [], readonly correlationId?: string, readonly retryAfter?: number) {
    super(detail);
  }
}
type RuntimeRule = { template: string; method: string; path: Record<string, unknown>;
  query: Record<string, unknown>; body: string[]; download: boolean; csrf: boolean };
const rules: RuntimeRule[] = contract.routes;
const uuid = /^[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$/;
const invalid = () => new ApiError(0, 'SOLICITUD_INVALIDA', 'La solicitud no corresponde al contrato de la API.');

function urlFor(rule: RuntimeRule, options: { path?: unknown; query?: unknown }) {
  const values = (options.path || {}) as Record<string, string>;
  const keys = Object.keys(rule.path);
  if (Object.keys(values).length !== keys.length || keys.some(key => !Object.hasOwn(values, key) || !uuid.test(values[key]))) throw invalid();
  const path = rule.template.replace(/\{([^}]+)\}/g, (_, key: string) => encodeURIComponent(values[key]));
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query || {})) {
    if (!Object.hasOwn(rule.query, key)) throw invalid();
    if (value === undefined || value === null) continue;
    for (const item of Array.isArray(value) ? value : [value]) query.append(key, String(item));
  }
  return path + (query.size ? '?' + query.toString() : '');
}
function retryAfter(value: string | null) {
  if (value === null) return undefined;
  if (/^\d+$/.test(value)) return Number(value);
  const instant = Date.parse(value);
  return Number.isFinite(instant) ? Math.max(0, Math.ceil((instant - Date.now()) / 1000)) : undefined;
}
function metadata(response: Response) {
  return { status: response.status,
    correlationId: response.headers.get('X-Correlation-Id') || undefined,
    retryAfter: retryAfter(response.headers.get('Retry-After')),
    contentDisposition: response.headers.get('Content-Disposition') || undefined };
}
function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
async function responseError(response: Response) {
  const problem = object(await response.json().catch(() => null));
  const fields = Array.isArray(problem.fields) ? problem.fields.filter((field): field is FieldProblem => {
    const item = object(field);
    return ['field', 'code', 'message'].every(key => typeof item[key] === 'string');
  }) : [];
  const meta = metadata(response);
  return new ApiError(response.status, typeof problem.code === 'string' ? problem.code : 'SOLICITUD_RECHAZADA',
    typeof problem.detail === 'string' ? problem.detail : 'No se pudo completar la solicitud.', fields,
    meta.correlationId || (typeof problem.correlationId === 'string' ? problem.correlationId : undefined), meta.retryAfter);
}

/** No storage, retries or cross-origin requests. Business rules remain on the backend. */
export function createApiClient(config: { fetch?: typeof fetch; timeoutMs?: number } = {}) {
  const transport = config.fetch || globalThis.fetch;
  const timeout = config.timeoutMs ?? 15000;
  if (!Number.isFinite(timeout) || timeout < 1 || timeout > 120000) throw invalid();
  return {
    async request<M extends Method, P extends PathFor<M>>(method: M, template: P,
      options: RequestOptions<Operation<P, M>>): Promise<ApiResult<Success<Operation<P, M>>>> {
      const rule = rules.find(rule => rule.template === template && rule.method === method.toUpperCase());
      if (!rule) throw invalid();
      const params = options as { path?: unknown; query?: unknown; body?: unknown; signal?: AbortSignal };
      const url = urlFor(rule, params);
      if (rule.body.length && params.body === undefined) throw invalid();
      const controller = new AbortController();
      let timedOut = false;
      const abort = () => controller.abort();
      params.signal?.addEventListener('abort', abort, { once: true });
      if (params.signal?.aborted) abort();
      const timer = setTimeout(() => { timedOut = true; controller.abort(); }, rule.body.includes('multipart/form-data') ? (config.timeoutMs ?? 45000) : timeout);
      const send = (path: string, init: RequestInit = {}) => transport(path, { ...init,
        credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal: controller.signal });
      try {
        if (controller.signal.aborted) throw new DOMException('Cancelada', 'AbortError');
        const headers = new Headers({ Accept: rule.download
          ? 'application/pdf, image/png, image/jpeg, application/problem+json' : 'application/json, application/problem+json' });
        if (rule.csrf || !['get', 'head'].includes(method)) {
          const response = await send('/api/v1/identidad/csrf', { headers: { Accept: 'application/json' } });
          if (!response.ok) throw await responseError(response);
          let csrf: Record<string, unknown>;
          try { csrf = object(await response.json()); }
          catch { throw new ApiError(502, 'RESPUESTA_INVALIDA', 'La respuesta CSRF no tiene el formato esperado.'); }
          if (typeof csrf.headerName !== 'string' || csrf.headerName.toLowerCase() !== 'x-csrf-token'
            || typeof csrf.token !== 'string' || !/^[\x21-\x7e]{1,4096}$/.test(csrf.token)) throw new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo obtener un token CSRF válido.');
          headers.set('X-CSRF-TOKEN', csrf.token);
        }
        let body: BodyInit | undefined;
        if (rule.body.includes('multipart/form-data')) {
          const form = new FormData();
          for (const [key, value] of Object.entries(object(params.body))) {
            if (value !== undefined && value !== null) form.append(key, value instanceof Blob ? value : String(value));
          }
          body = form; // The browser creates the multipart boundary.
        } else if (rule.body.includes('application/json')) {
          headers.set('Content-Type', 'application/json');
          body = JSON.stringify(params.body);
        }
        const response = await send(url, { method: method.toUpperCase(), headers, body });
        if (!response.ok) throw await responseError(response);
        let data: unknown;
        if (response.status === 204 || method === 'head') data = undefined;
        else if (rule.download) {
          if (!['application/pdf', 'image/png', 'image/jpeg'].includes(response.headers.get('Content-Type') || '')
            || !/^attachment(?:;|$)/i.test(response.headers.get('Content-Disposition') || '')) {
            throw new ApiError(502, 'RESPUESTA_INVALIDA', 'El archivo recibido no es un adjunto admitido.');
          }
          data = await response.blob();
        } else {
          if (response.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
            throw new ApiError(502, 'RESPUESTA_INVALIDA', 'La respuesta recibida no tiene el formato esperado.');
          }
          try { data = await response.json(); }
          catch { throw new ApiError(502, 'RESPUESTA_INVALIDA', 'La respuesta recibida no es JSON válido.'); }
        }
        return { data: data as Success<Operation<P, M>>, ...metadata(response) };
      } catch (error) {
        if (error instanceof ApiError) throw error;
        if (controller.signal.aborted) throw new ApiError(0, timedOut ? 'TIEMPO_AGOTADO' : 'SOLICITUD_CANCELADA',
          timedOut ? 'Se agotó el tiempo de espera.' : 'La solicitud fue cancelada.');
        throw new ApiError(0, 'SIN_CONEXION', 'No se pudo conectar con el servicio.');
      } finally {
        clearTimeout(timer);
        params.signal?.removeEventListener('abort', abort);
      }
    },
  };
}

export const api = createApiClient();
