import { describe, expect, it, vi } from 'vitest';
import { ApiError, createApiClient } from '../../shared/api/client';
import { capabilities, createAccessService, WorkspaceStore } from './workspace';
import type { Company, Identity } from './workspace';
import { a, b, deferred, emptyPanel, identity, service } from './fixtures.test-support';
describe('Session and company scope', () => {
  it('integrates the typed transport, CSRF rotation, login, context and server logout', async () => {
    let signedIn = false; let csrf = 0;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input); const method = init?.method || 'GET';
      expect(init?.credentials).toBe('same-origin');
      if (url.endsWith('/csrf')) return Response.json({ headerName: 'X-CSRF-TOKEN', token: 'token-' + (++csrf) });
      if (url.endsWith('/sesion')) {
        if (method === 'POST') {
          expect(new Headers(init?.headers).get('X-CSRF-TOKEN')).toBe('token-1');
          expect(JSON.parse(String(init?.body))).toEqual({ correo: 'persona@example.test', contrasena: 'prueba' });
          signedIn = true;
        }
        if (method === 'DELETE') {
          expect(new Headers(init?.headers).get('X-CSRF-TOKEN')).toBe('token-2');
          signedIn = false; return new Response(null, { status: 204 });
        }
        return signedIn ? Response.json(identity) : Response.json({ code: 'NO_AUTENTICADO' }, { status: 401 });
      }
      if (url === '/api/v1/mis-empresas?pagina=0&tamano=10') return Response.json({ empresas: [a], pagina: 0, tamano: 10, hayMas: false });
      if (url === '/api/v1/empresas/' + a.empresaId + '/contexto') return Response.json(a);
      if (url.startsWith('/api/v1/empresas/' + a.empresaId + '/panel?')) return Response.json(emptyPanel());
      throw new Error('Undeclared request: ' + url);
    });
    const store = new WorkspaceStore(createAccessService(createApiClient({ fetch: fetcher })));
    await store.open(); expect(store.getSnapshot().status).toBe('login');
    await store.login('persona@example.test', 'prueba'); expect(store.getSnapshot().status).toBe('companies');
    await store.open(a.empresaId); expect(store.getSnapshot().company).toEqual(a);
    await store.logout(); expect(signedIn).toBe(false); expect(store.getSnapshot().identity).toBeUndefined();
    expect(csrf).toBe(2);
  });
  it('cancels A and rejects its late response after B', async () => {
    const slow = deferred<Company>();
    const api = service({ company: vi.fn().mockImplementation(id => id === a.empresaId ? slow.promise : Promise.resolve(b)) });
    const store = new WorkspaceStore(api);
    const first = store.open(a.empresaId);
    await vi.waitFor(() => expect(api.company).toHaveBeenCalled());
    const signalA = vi.mocked(api.company).mock.calls[0][1];
    const second = store.open(b.empresaId);
    expect(store.getSnapshot().company).toBeUndefined();
    expect(signalA.aborted).toBe(true);
    await second; slow.resolve(a); await first;
    expect(store.getSnapshot().company).toEqual(b);
    expect(capabilities(store.getSnapshot().company!).read).toBe(false);
  });
  it('clears company on revocation and rechecks membership on retry', async () => {
    const api = service(); const store = new WorkspaceStore(api);
    await store.open(a.empresaId);
    vi.mocked(api.company).mockRejectedValueOnce(new ApiError(403, 'MEMBRESIA_REVOCADA', 'Denegado.'));
    await store.retry();
    expect(store.getSnapshot().status).toBe('error');
    expect(store.getSnapshot().company).toBeUndefined();
    await store.open();
    expect(store.getSnapshot().status).toBe('companies');
    expect(api.session).toHaveBeenCalledTimes(3);
  });
  it('cleans private state on 401, expiry and logout including in-flight requests', async () => {
    const api = service(); const store = new WorkspaceStore(api);
    await store.open(a.empresaId);
    vi.mocked(api.company).mockRejectedValueOnce(new ApiError(401, 'NO_AUTENTICADO', 'Accede.'));
    await store.retry();
    expect(store.getSnapshot()).toEqual({ status: 'login', notice: expect.stringContaining('sesión') });
    await store.open(a.empresaId);
    const late = deferred<Company>();
    vi.mocked(api.company).mockReturnValueOnce(late.promise);
    const pending = store.retry();
    await vi.waitFor(() => expect(api.company).toHaveBeenCalledTimes(4));
    await store.logout(); late.resolve(a); await pending;
    expect(store.getSnapshot()).toEqual({ status: 'login', notice: 'Sesión cerrada.' });
    await store.open(a.empresaId); store.expire();
    expect(store.getSnapshot().identity).toBeUndefined();
    expect(store.getSnapshot().company).toBeUndefined();
  });
  it('withdraws data when logout fails without claiming server invalidation', async () => {
    const store = new WorkspaceStore(service({ logout: vi.fn().mockRejectedValue(new ApiError(0, 'SIN_CONEXION', 'Error.')) }));
    await store.open(a.empresaId); await store.logout();
    expect(store.getSnapshot().status).toBe('error');
    expect(store.getSnapshot().identity).toBeUndefined();
    expect(store.getSnapshot().company).toBeUndefined();
    expect(store.getSnapshot().notice).toContain('No se confirmó el cierre');
  });
  it('combines roles within one company only', () => {
    expect(capabilities({ ...a, roles: ['AU', 'GS'] })).toEqual({ read: true, write: true, admin: false });
    expect(capabilities({ ...a, roles: ['AU'] })).toEqual({ read: true, write: false, admin: false });
    expect(capabilities(b)).toEqual({ read: false, write: false, admin: false });
  });
  it('rejects cross-company context, empty roles, AP role and expired identity', async () => {
    for (const invalid of [b, { ...a, roles: [] }, { ...a, roles: ['AP'] }]) {
      const store = new WorkspaceStore(service({ company: vi.fn().mockResolvedValue(invalid) }));
      await store.open(a.empresaId);
      expect(store.getSnapshot().error?.code).toBe('RESPUESTA_INVALIDA');
      expect(store.getSnapshot().company).toBeUndefined();
    }
    const api = service({ session: vi.fn().mockResolvedValue({ ...identity, expiraEn: '2000-01-01T00:00:00Z' }) });
    const store = new WorkspaceStore(api); await store.open();
    expect(store.getSnapshot().status).toBe('login');
    expect(api.companies).not.toHaveBeenCalled();
  });
  it('paginates and ignores completion after disposal', async () => {
    const api = service(); const store = new WorkspaceStore(api);
    await store.open(undefined, 1);
    expect(api.companies).toHaveBeenCalledWith(1, expect.any(AbortSignal));
    const late = deferred<Identity>(); vi.mocked(api.session).mockReturnValueOnce(late.promise);
    const pending = store.open(); store.dispose(); late.resolve(identity); await pending;
    expect(store.getSnapshot()).toEqual({ status: 'loading' });
  });
});
