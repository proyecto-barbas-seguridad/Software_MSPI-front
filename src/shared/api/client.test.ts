import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from './client';

const id = 'e01b03ee-a2d7-4b42-a76e-e307737a3300';
const json = (data: unknown, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', ...headers },
});
const csrf = (token = 'fixture-csrf') => json({ headerName: 'X-CSRF-TOKEN', token });
afterEach(() => vi.useRealTimers());

describe('Typed API transport', () => {
  it('serializes local company paths and repeated array queries, with cookie and no-store', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({}));
    const client = createApiClient({ fetch: fetcher });
    await client.request('get', '/api/v1/empresas/{empresaId}/reportes/basico', {
      path: { empresaId: id }, query: { secciones: ['RIESGOS', 'ACCIONES'], vencida: false },
    });
    expect(fetcher.mock.calls[0][0]).toBe(`/api/v1/empresas/${id}/reportes/basico?secciones=RIESGOS&secciones=ACCIONES&vencida=false`);
    expect(fetcher.mock.calls[0][1]).toMatchObject({ credentials: 'same-origin', cache: 'no-store', redirect: 'error' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('gets a fresh CSRF token after login rotation and handles a 204 logout', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(csrf('before-login'))
      .mockResolvedValueOnce(json({ usuarioId: id, nombreVisible: 'Persona de prueba', expiraEn: '2026-11-17T00:00:00Z' }))
      .mockResolvedValueOnce(csrf('after-login')).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createApiClient({ fetch: fetcher });
    await client.request('post', '/api/v1/identidad/sesion', { body: { correo: 'person@example.test', contrasena: 'fixture' } });
    const result = await client.request('delete', '/api/v1/identidad/sesion', {});
    expect(result.data).toBeUndefined();
    expect(new Headers(fetcher.mock.calls[1][1]?.headers).get('X-CSRF-TOKEN')).toBe('before-login');
    expect(new Headers(fetcher.mock.calls[3][1]?.headers).get('X-CSRF-TOKEN')).toBe('after-login');
    expect(fetcher.mock.calls[2][0]).toBe('/api/v1/identidad/csrf');
  });

  it.each([401, 403, 409, 429, 503])('preserves Problem, fields, correlation and retry guidance for %s', async status => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json({ code: 'CODIGO_PRUEBA', detail: 'Mensaje para revisar',
      fields: [{ field: 'nombre', code: 'REQUERIDO', message: 'Introduce un nombre' }], correlationId: 'body-id' }, status,
    { 'X-Correlation-Id': 'header-id', 'Retry-After': '3' }));
    await expect(createApiClient({ fetch: fetcher }).request('get', '/api/v1/identidad/sesion', {})).rejects.toMatchObject({
      status, code: 'CODIGO_PRUEBA', message: 'Mensaje para revisar', correlationId: 'header-id', retryAfter: 3,
      fields: [{ field: 'nombre', code: 'REQUERIDO', message: 'Introduce un nombre' }],
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('does not repeat a conflicting mutation or retry an invalid CSRF token', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(csrf()).mockResolvedValueOnce(json({ code: 'REVISION_DESACTUALIZADA' }, 409));
    await expect(createApiClient({ fetch: fetcher }).request('put', '/api/v1/empresas/{empresaId}/configuracion', {
      path: { empresaId: id }, body: { revisionEsperada: 1, nombre: 'Empresa', descripcion: null, zonaHoraria: 'America/Bogota' },
    })).rejects.toMatchObject({ status: 409, code: 'REVISION_DESACTUALIZADA' });
    expect(fetcher).toHaveBeenCalledTimes(2);
    const invalid = vi.fn<typeof fetch>().mockResolvedValue(json({ headerName: 'Authorization', token: 'fixture' }));
    await expect(createApiClient({ fetch: invalid }).request('delete', '/api/v1/identidad/sesion', {})).rejects.toMatchObject({ code: 'RESPUESTA_INVALIDA' });
    expect(invalid).toHaveBeenCalledTimes(1);
  });

  it('builds multipart with the typed revision and lets the browser choose its boundary', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(csrf()).mockResolvedValueOnce(json({}, 201));
    await createApiClient({ fetch: fetcher }).request('post', '/api/v1/empresas/{empresaId}/evaluaciones/{evaluacionId}/respuestas/{respuestaId}/evidencias', {
      path: { empresaId: id, evaluacionId: id, respuestaId: id },
      body: { archivo: new Blob(['fixture'], { type: 'application/pdf' }), revisionEsperada: 0, descripcion: 'Comprobación' },
    });
    const init = fetcher.mock.calls[1][1];
    expect(init?.body).toBeInstanceOf(FormData);
    expect((init?.body as FormData).get('revisionEsperada')).toBe('0');
    expect(new Headers(init?.headers).has('Content-Type')).toBe(false);
    expect(new Headers(init?.headers).get('X-CSRF-TOKEN')).toBe('fixture-csrf');
  });

  it('returns a private attachment as a blob and rejects unexpected HTML or malformed JSON', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('fixture', { headers: {
      'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="fixture.pdf"',
    } })).mockResolvedValueOnce(new Response('<html>unexpected</html>', { headers: { 'Content-Type': 'text/html' } }))
      .mockResolvedValueOnce(new Response('broken', { headers: { 'Content-Type': 'application/json' } }));
    const client = createApiClient({ fetch: fetcher });
    const result = await client.request('get', '/api/v1/empresas/{empresaId}/acciones/{accionId}/evidencias/{evidenciaId}/archivo', {
      path: { empresaId: id, accionId: id, evidenciaId: id },
    });
    expect(result.data.size).toBe(7);
    expect(result.contentDisposition).toContain('attachment');
    await expect(client.request('get', '/api/v1', {})).rejects.toMatchObject({ code: 'RESPUESTA_INVALIDA' });
    await expect(client.request('get', '/api/v1', {})).rejects.toMatchObject({ code: 'RESPUESTA_INVALIDA' });
  });

  it('rejects foreign or unknown paths and invalid UUIDs before requesting a CSRF token', async () => {
    const fetcher = vi.fn<typeof fetch>();
    const client = createApiClient({ fetch: fetcher });
    // @ts-expect-error Exercise the runtime guard against callers outside TypeScript.
    await expect(client.request('get', 'https://outside.example', {})).rejects.toBeInstanceOf(ApiError);
    await expect(client.request('get', '/api/v1/empresas/{empresaId}/contexto', { path: { empresaId: '../other' } })).rejects.toMatchObject({ code: 'SOLICITUD_INVALIDA' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('distinguishes cancellation, timeout and connection failure without retries', async () => {
    const waiting = vi.fn<typeof fetch>().mockImplementation((_, init) => new Promise((_, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('Fixture', 'AbortError')));
    }));
    const controller = new AbortController();
    const pending = createApiClient({ fetch: waiting }).request('get', '/api/v1', { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ code: 'SOLICITUD_CANCELADA' });
    vi.useFakeTimers();
    const timeout = createApiClient({ fetch: waiting, timeoutMs: 10 }).request('get', '/api/v1', {});
    const assertion = expect(timeout).rejects.toMatchObject({ code: 'TIEMPO_AGOTADO' });
    await vi.advanceTimersByTimeAsync(10);
    await assertion;
    const broken = vi.fn<typeof fetch>().mockRejectedValue(new TypeError('private fixture details'));
    await expect(createApiClient({ fetch: broken }).request('get', '/api/v1', {})).rejects.toMatchObject({ code: 'SIN_CONEXION', message: 'No se pudo conectar con el servicio.' });
    expect(broken).toHaveBeenCalledTimes(1);
  });
});
