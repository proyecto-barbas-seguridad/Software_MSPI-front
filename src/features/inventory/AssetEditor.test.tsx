import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { createStyleCache, Providers } from '../../app/Providers';
import { ApiError, createApiClient } from '../../shared/api/client';
import { WorkspaceStore } from '../access/workspace';
import { deferred, identity, service } from '../access/fixtures.test-support';
import AssetEditor from './AssetEditor';
import type { EditMode } from './AssetEditor';
import { createInventoryService } from './inventory';
import type { Asset, InventoryState } from './inventory';
import { InventoryWorkspace } from './InventoryWorkspace';
import { asset, company, inventoryService } from './fixtures.test-support';

afterEach(() => { window.history.replaceState(null, '', '/interfaz/'); });
function mount(mode: EditMode = 'edit', api = inventoryService()) {
  const onSaved = vi.fn(); const onDirty = vi.fn(); const onAuthorization = vi.fn(); const onPending = vi.fn();
  const initial: InventoryState = { status: 'detail', query: {}, valuationPage: 0, historyPage: 0,
    ...(mode === 'create' ? {} : { asset: mode === 'restore' ? { ...asset, estado: 'ARCHIVADO' } as Asset : asset }) };
  return { ...render(<Providers mode="light" cache={createStyleCache('editor-nonce')}><AssetEditor companyId={company.empresaId} mode={mode} initial={initial} service={api}
    onSaved={onSaved} onDirty={onDirty} onPending={onPending} onCancel={vi.fn()} onAuthorization={onAuthorization} /></Providers>), onSaved, onDirty, onPending, onAuthorization };
}
async function fillCreate() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Código (obligatorio)'), 'ACT-NUEVO');
  await user.type(screen.getByLabelText('Nombre (obligatorio)'), 'Nuevo servidor');
  await user.type(screen.getByLabelText('Descripción (obligatoria)'), 'Descripción de prueba');
  await user.selectOptions(screen.getByLabelText('Tipo (obligatorio)'), 'SOFTWARE');
  await screen.findByRole('option', { name: 'Gestión de personas' });
  await user.selectOptions(screen.getByLabelText('Proceso (obligatorio)'), asset.procesoId);
  await user.selectOptions(screen.getByLabelText('Propietario (obligatorio)'), asset.propietarioId);
  return user;
}
describe('Asset mutations', () => {
  it('creates using selected local references without invented IDs or C/I/D', async () => {
    const api = inventoryService(); const { onSaved, onDirty } = mount('create', api); const user = await fillCreate();
    await user.click(screen.getByRole('button', { name: 'Crear activo' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ activoId: asset.activoId })));
    expect(api.create).toHaveBeenCalledWith(company.empresaId, { codigo: 'ACT-NUEVO', nombre: 'Nuevo servidor', descripcion: 'Descripción de prueba', tipo: 'SOFTWARE', procesoId: asset.procesoId,
      propietarioId: asset.propietarioId, custodioId: null, ubicacion: null }, expect.any(AbortSignal));
    expect(onDirty).toHaveBeenCalledWith(true); expect(onDirty).toHaveBeenLastCalledWith(false);
  });
  it('edits with the captured revision, preserves references, and keeps code readonly', async () => {
    const api = inventoryService(); const { container, onSaved } = mount('edit', api); const user = userEvent.setup();
    expect(screen.getByLabelText('Código (no modificable)')).toHaveAttribute('readonly');
    await user.clear(screen.getByLabelText('Nombre (obligatorio)')); await user.type(screen.getByLabelText('Nombre (obligatorio)'), 'Nombre nuevo');
    await user.click(screen.getByRole('button', { name: 'Editar activo' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const body = vi.mocked(api.edit).mock.calls[0][2];
    expect(body).toMatchObject({ revisionEsperada: 4, nombre: 'Nombre nuevo', procesoId: asset.procesoId });
    expect(body).not.toHaveProperty('codigo');
    expect(container.querySelector('[style]')).toBeNull();
  });
  it('preserves the buffer on field errors and duplicate code without automatic retries', async () => {
    const api = inventoryService({ create: vi.fn().mockRejectedValue(new ApiError(400, 'VALIDACION', 'Revisa los datos.', [{ field: 'nombre', code: 'INVALIDO', message: 'Nombre no válido.' }], 'soporte-1')) });
    mount('create', api); const user = await fillCreate(); await user.click(screen.getByRole('button', { name: 'Crear activo' }));
    await screen.findByText('Nombre no válido.'); expect(screen.getByLabelText('Nombre (obligatorio)')).toHaveValue('Nuevo servidor');
    expect(screen.getByLabelText('Nombre (obligatorio)')).toHaveAttribute('aria-invalid', 'true'); expect(api.create).toHaveBeenCalledOnce();
    vi.mocked(api.create).mockRejectedValueOnce(new ApiError(409, 'CODIGO_ACTIVO_DUPLICADO', 'Duplicado.'));
    await user.click(screen.getByRole('button', { name: 'Crear activo' })); await screen.findByText(/El código ya pertenece/);
    expect(screen.getByRole('button', { name: 'Crear activo' })).toBeEnabled(); expect(api.create).toHaveBeenCalledTimes(2);
  });
  it('blocks overwriting on conflict and reconciles only by an explicit read', async () => {
    const api = inventoryService({ edit: vi.fn().mockRejectedValue(new ApiError(409, 'REVISION_DESACTUALIZADA', 'Conflicto.')) });
    const { onSaved } = mount('edit', api); const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Editar activo' })); await screen.findByText(/Otra persona modificó el activo/);
    expect(screen.getByRole('button', { name: 'Editar activo' })).toBeDisabled(); expect(api.edit).toHaveBeenCalledOnce();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Descartar borrador y consultar ficha actual' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(asset)); expect(api.asset).toHaveBeenCalledOnce(); expect(api.edit).toHaveBeenCalledOnce();
  });
  it.each([0, 503])('treats status %s as an uncertain write and searches before another create', async status => {
    const api = inventoryService({ create: vi.fn().mockRejectedValue(new ApiError(status, 'ERROR', 'Error de servicio.')) });
    const { onSaved } = mount('create', api); const user = await fillCreate(); await user.click(screen.getByRole('button', { name: 'Crear activo' }));
    await screen.findByText(/Puede haberse aplicado en el servidor/); expect(screen.getByRole('button', { name: 'Crear activo' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Volver al inventario y buscar el código' }));
    expect(onSaved).toHaveBeenCalledWith(undefined, 'ACT-NUEVO'); expect(api.create).toHaveBeenCalledOnce();
  });
  it('requires a reason and explicit confirmation for archive, preserving the revision', async () => {
    const api = inventoryService(); mount('archive', api); const user = userEvent.setup(); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: 'Archivar activo' })); expect(api.archive).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Motivo (obligatorio)'), 'Fin de uso'); await user.click(screen.getByRole('button', { name: 'Archivar activo' }));
    expect(api.archive).not.toHaveBeenCalled(); confirm.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Archivar activo' }));
    await waitFor(() => expect(api.archive).toHaveBeenCalledWith(company.empresaId, asset.activoId, { revisionEsperada: 4, motivo: 'Fin de uso' }, expect.any(AbortSignal)));
  });
  it('restores with original references omitted, or explicit active replacements', async () => {
    const api = inventoryService(); const first = mount('restore', api); const user = userEvent.setup(); vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.type(screen.getByLabelText('Motivo (obligatorio)'), 'Reactivación'); await user.click(screen.getByRole('button', { name: 'Restaurar activo' }));
    await waitFor(() => expect(api.restore).toHaveBeenCalled()); expect(vi.mocked(api.restore).mock.calls[0][2]).not.toHaveProperty('referencias'); first.unmount();
    mount('restore', api); await user.click(screen.getByLabelText('Seleccionar referencias de reemplazo'));
    await screen.findByRole('option', { name: 'Gestión de personas' });
    await user.type(screen.getByLabelText('Motivo (obligatorio)'), 'Referencias comprobadas'); await user.click(screen.getByRole('button', { name: 'Restaurar activo' }));
    await waitFor(() => expect(api.restore).toHaveBeenCalledTimes(2)); expect(vi.mocked(api.restore).mock.calls[1][2]).toHaveProperty('referencias', { procesoId: asset.procesoId, propietarioId: asset.propietarioId, custodioId: null });
  });
  it('does not double-submit and ignores completion after unmount', async () => {
    const pending = deferred<Asset>(); const api = inventoryService({ edit: vi.fn().mockReturnValue(pending.promise) });
    const { onSaved, unmount } = mount('edit', api);
    fireEvent.submit(screen.getByRole('form', { name: 'Editar activo' })); fireEvent.submit(screen.getByRole('form', { name: 'Editar activo' }));
    expect(api.edit).toHaveBeenCalledOnce(); const signal = vi.mocked(api.edit).mock.calls[0][3];
    unmount(); pending.resolve(asset); await act(async () => { await pending.promise; });
    expect(signal.aborted).toBe(true); expect(onSaved).not.toHaveBeenCalled();
  });
  it.each([401, 403])('withdraws draft authorization on write %s', async status => {
    const api = inventoryService({ edit: vi.fn().mockRejectedValue(new ApiError(status, 'DENEGADO', 'Error.')) }); const { onAuthorization, onDirty } = mount('edit', api);
    fireEvent.submit(screen.getByRole('form', { name: 'Editar activo' }));
    await waitFor(() => expect(onAuthorization).toHaveBeenCalledWith(expect.objectContaining({ status })));
    expect(onDirty).toHaveBeenLastCalledWith(false);
  });
  it('keeps the buffer on invalid CSRF and waits for an explicit retry', async () => {
    const api = inventoryService({ edit: vi.fn().mockRejectedValue(new ApiError(403, 'CSRF_INVALIDO', 'No se pudo validar la solicitud.')) });
    const { onAuthorization } = mount('edit', api); fireEvent.submit(screen.getByRole('form', { name: 'Editar activo' }));
    await screen.findByText('No se pudo validar la solicitud.'); expect(onAuthorization).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Editar activo' })).toBeEnabled(); expect(api.edit).toHaveBeenCalledOnce();
  });
  it.each(['GS', 'AU'] as const)('does not request AE history for %s; writes remain GS-only', async role => {
    const api = inventoryService(); render(<Providers mode="light" cache={createStyleCache()}><InventoryWorkspace company={{ ...company, roles: [role] }} assetId={asset.activoId} service={api} onQuery={vi.fn()} onAuthorization={vi.fn()} /></Providers>);
    await screen.findByRole('article', { name: 'Clasificación versión 1' }); expect(api.history).not.toHaveBeenCalled();
    expect(screen.queryByText('Ver historial del activo')).not.toBeInTheDocument();
    expect(Boolean(screen.queryByRole('button', { name: 'Editar activo' }))).toBe(role === 'GS');
    expect(Boolean(screen.queryByRole('button', { name: 'Clasificar activo' }))).toBe(role === 'GS');
  });
  it('paginates reference options without losing the selected label', async () => {
    const second = '00000000-0000-0000-0000-000000000055';
    const api = inventoryService({ processes: vi.fn().mockImplementation(async (_, pagina) => ({ pagina, tamano: 5, hayMas: pagina < 1, elementos: [{ procesoId: pagina ? second : asset.procesoId, nombre: pagina ? 'Proceso dos' : 'Proceso uno', descripcion: null, responsableId: null, estado: 'ACTIVO', revision: 1 }] })) });
    mount('edit', api); const user = userEvent.setup(); await screen.findByRole('option', { name: 'Proceso uno' });
    await user.click(screen.getByRole('button', { name: 'Siguiente en proceso' })); await screen.findByRole('option', { name: 'Proceso dos' });
    await user.selectOptions(screen.getByLabelText('Proceso (obligatorio)'), second); await user.click(screen.getByRole('button', { name: 'Anterior en proceso' }));
    await screen.findByRole('option', { name: 'Proceso dos · Selección conservada' }); expect(screen.getByLabelText('Proceso (obligatorio)')).toHaveValue(second);
  });
  it('preserves an unsaved buffer on focus, guards navigation/close and removes it on revocation', async () => {
    window.history.replaceState(null, '', `#/empresas/${company.empresaId}/activos/${asset.activoId}`);
    const api = service(); const store = new WorkspaceStore(api, inventoryService());
    render(<App cache={createStyleCache('guard-nonce')} store={store} />); const user = userEvent.setup();
    await screen.findByRole('button', { name: 'Editar activo' }); await user.click(screen.getByRole('button', { name: 'Editar activo' }));
    await screen.findByLabelText('Nombre (obligatorio)'); await user.type(screen.getByLabelText('Nombre (obligatorio)'), ' cambiado');
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: 'Cambiar empresa' })); expect(screen.getByLabelText('Nombre (obligatorio)')).toHaveValue(asset.nombre + ' cambiado');
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' })); expect(api.logout).not.toHaveBeenCalled();
    window.history.pushState(null, '', '#/empresas'); fireEvent(window, new Event('hashchange'));
    expect(window.location.hash).toBe(`#/empresas/${company.empresaId}/activos/${asset.activoId}`);
    const unload = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(unload); expect(unload.defaultPrevented).toBe(true);
    fireEvent(window, new Event('focus')); await waitFor(() => expect(api.session).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText('Nombre (obligatorio)')).toHaveValue(asset.nombre + ' cambiado');
    vi.mocked(api.company).mockRejectedValueOnce(new ApiError(403, 'REVOCADO', 'Revocado.'));
    fireEvent(window, new Event('focus')); await screen.findByRole('heading', { name: 'No pudimos abrir esta vista' });
    expect(screen.queryByLabelText('Nombre (obligatorio)')).not.toBeInTheDocument(); expect(store.draftDirty).toBe(false);
  });
  it('uses fresh CSRF for all four contracted writes and scoped active reference lists', async () => {
    let csrf = 0; const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).endsWith('/csrf')) return Response.json({ headerName: 'X-CSRF-TOKEN', token: 'write-' + (++csrf) });
      expect(init?.credentials).toBe('same-origin');
      if (init?.method !== 'GET') expect(new Headers(init?.headers).get('X-CSRF-TOKEN')).toBe('write-' + csrf);
      return Response.json(asset);
    });
    const api = createInventoryService(createApiClient({ fetch: fetcher })); const signal = new AbortController().signal;
    const body = { codigo: 'ACT-X', nombre: 'X', descripcion: 'X', tipo: asset.tipo, procesoId: asset.procesoId, propietarioId: asset.propietarioId };
    await api.create(company.empresaId, body, signal);
    const { codigo: _, ...edit } = body;
    await api.edit(company.empresaId, asset.activoId, { ...edit, revisionEsperada: 4 }, signal);
    await api.archive(company.empresaId, asset.activoId, { motivo: 'Prueba', revisionEsperada: 5 }, signal);
    await api.restore(company.empresaId, asset.activoId, { motivo: 'Prueba', revisionEsperada: 6 }, signal);
    await api.processes(company.empresaId, 1, signal); await api.responsibles(company.empresaId, 0, signal);
    expect(csrf).toBe(4); expect(String(fetcher.mock.calls.at(-1)![0])).toContain('estado=ACTIVO');
  });
  it('does not prompt before expiry and never reuses a draft from another identity', async () => {
    const api = service(); const store = new WorkspaceStore(api, inventoryService()); await store.open(company.empresaId);
    store.setDraftDirty(true); vi.mocked(api.session).mockResolvedValueOnce({ ...identity, usuarioId: company.empresaId });
    await store.revalidate(); expect(store.getSnapshot().company).toBeUndefined(); expect(store.draftDirty).toBe(false);
    await store.open(company.empresaId); store.setDraftDirty(true); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    store.expire(); expect(confirm).not.toHaveBeenCalled(); expect(store.getSnapshot().status).toBe('login');
  });
  it('keeps unsaved changes with an explicit notice when focus validation has a transport failure', async () => {
    const api = service(); const store = new WorkspaceStore(api, inventoryService()); await store.open(company.empresaId);
    store.setDraftDirty(true); vi.mocked(api.session).mockRejectedValueOnce(new ApiError(503, 'ERROR', 'Servicio no disponible.'));
    await store.revalidate(); expect(store.draftDirty).toBe(true); expect(store.getSnapshot().company).toBeDefined();
    expect(store.getSnapshot().notice).toContain('No pudimos comprobar de nuevo el acceso');
  });
});
