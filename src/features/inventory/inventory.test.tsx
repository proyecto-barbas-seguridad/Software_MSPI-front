import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { createStyleCache, Providers } from '../../app/Providers';
import { createApiClient, ApiError } from '../../shared/api/client';
import { WorkspaceStore } from '../access/workspace';
import { b, deferred, service } from '../access/fixtures.test-support';
import { InventoryWorkspace } from './InventoryWorkspace';
import { createInventoryService, InventoryStore } from './inventory';
import type { Asset, AssetPage } from './inventory';
import { asset, company, inventoryService, pending, valuation } from './fixtures.test-support';

afterEach(() => { window.history.replaceState(null, '', '/interfaz/'); });
function mount(api = inventoryService(), assetId?: string) {
  const onQuery = vi.fn(); const onAuthorization = vi.fn();
  return { ...render(<Providers mode="light" cache={createStyleCache('inventory-nonce')}><InventoryWorkspace company={company} service={api} assetId={assetId}
    onQuery={onQuery} onAuthorization={onAuthorization} /></Providers>), onQuery, onAuthorization };
}
describe('Inventory and asset pages', () => {
  it('filters on the server, resets pagination and uses five records without invented totals', async () => {
    const api = inventoryService(); const { onQuery } = mount(api); const user = userEvent.setup();
    await screen.findByRole('link', { name: 'ACT-033 · Servidor de nómina' });
    await user.type(screen.getByLabelText('Buscar por nombre o código'), ' nómina ');
    await user.selectOptions(screen.getByLabelText('Tipo'), 'SOFTWARE'); await user.selectOptions(screen.getByLabelText('Estado del activo'), 'ARCHIVADO');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await vi.waitFor(() => expect(api.list).toHaveBeenLastCalledWith(company.empresaId, { texto: 'nómina', tipo: 'SOFTWARE', estado: 'ARCHIVADO', pagina: 0, tamano: 5 }, expect.any(AbortSignal)));
    expect(onQuery).toHaveBeenCalledWith(expect.objectContaining({ texto: 'nómina', pagina: 0 }));
    expect(screen.queryByText(/total de activos/i)).not.toBeInTheDocument();
  });
  it('clears unapplied filters and follows hayMas rather than a page count', async () => {
    const api = inventoryService({ list: vi.fn().mockImplementation(async (_, query) => ({ elementos: [asset], pagina: query.pagina || 0, tamano: 5, hayMas: query.pagina === 0 })) });
    mount(api); const user = userEvent.setup(); await screen.findByRole('link', { name: /ACT-033/ });
    expect(screen.getByRole('button', { name: 'Anterior en activos' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Siguiente en activos' }));
    await screen.findByText('Página 2'); expect(screen.getByRole('button', { name: 'Siguiente en activos' })).toBeDisabled();
    await user.type(screen.getByLabelText('Buscar por nombre o código'), 'sin aplicar');
    await user.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    await screen.findByText('Página 1'); expect(screen.getByLabelText('Buscar por nombre o código')).toHaveValue('');
  });
  it('renders ACT-033 as 1/1/1 and a separate pending version without default dimensions', async () => {
    const { container } = mount(inventoryService(), asset.activoId);
    const current = await screen.findByRole('article', { name: 'Clasificación versión 1' });
    for (const label of ['Confidencialidad', 'Integridad', 'Disponibilidad']) expect(within(current).getByText(label, { selector: 'dt' }).nextElementSibling).toHaveTextContent('1 · Baja');
    expect(within(current).queryByText('5 · Alta')).not.toBeInTheDocument();
    const draft = screen.getByRole('article', { name: 'Clasificación versión 2' });
    expect(within(draft).getByText('3 · Media')).toBeInTheDocument();
    expect(within(draft).getByText('5 · Alta')).toBeInTheDocument();
    expect(within(draft).getAllByText(/Pendiente/).length).toBeGreaterThan(0);
    expect(screen.getByText('Gestión de personas · Archivado')).toBeInTheDocument();
    expect(screen.getByText('Custodio', { selector: 'dt' }).nextElementSibling).toHaveTextContent('No registrado');
    expect(container.querySelector('[style]')).toBeNull();
    expect(Array.from(document.querySelectorAll<HTMLStyleElement>('style[data-emotion^="mspi"]')).every(style => style.nonce === 'inventory-nonce')).toBe(true);
  });
  it('distinguishes conditional no aplica from missing declarations and shows business timestamps', async () => {
    mount(inventoryService(), asset.activoId); const user = userEvent.setup();
    await screen.findByRole('article', { name: 'Clasificación versión 1' });
    await user.click(screen.getByText('Ver datos personales y trazabilidad de la versión 1'));
    const current = screen.getByRole('article', { name: 'Clasificación versión 1' });
    expect(within(current).getAllByText('No aplica', { selector: 'dd' })).toHaveLength(5);
    expect(within(current).getAllByText(/10:00/)).toHaveLength(2);
    await user.click(screen.getByText('Ver datos personales y trazabilidad de la versión 2'));
    expect(screen.getByText('Justificación declarada')).toBeInTheDocument();
  });
  it('paginates classifications and history independently with fresh asset references', async () => {
    const api = inventoryService({ valuations: vi.fn().mockImplementation(async (_, __, pagina) => ({ elementos: [valuation], pagina, tamano: 5, hayMas: pagina === 0 })) });
    mount(api, asset.activoId); const user = userEvent.setup(); await screen.findByRole('article', { name: 'Clasificación versión 1' });
    await user.click(screen.getByRole('button', { name: 'Siguiente en clasificaciones' }));
    await screen.findByText('Página 2');
    expect(api.valuations).toHaveBeenLastCalledWith(company.empresaId, asset.activoId, 1, expect.any(AbortSignal));
    expect(api.history).toHaveBeenLastCalledWith(company.empresaId, asset.activoId, 0, expect.any(AbortSignal));
    await user.click(screen.getByText('Ver historial del activo'));
    expect(screen.getByRole('heading', { name: 'Creación' })).toBeInTheDocument();
    expect(screen.getByText(/Campos: nombre/)).toBeInTheDocument();
  });
  it('shows empty classification pages and archived assets without editing controls', async () => {
    const api = inventoryService({ asset: vi.fn().mockResolvedValue({ ...asset, estado: 'ARCHIVADO' }), valuations: vi.fn().mockResolvedValue({ elementos: [], pagina: 0, tamano: 5, hayMas: false }) });
    mount(api, asset.activoId); await screen.findByText(/Este activo está archivado/);
    expect(screen.getByText(/No hay clasificaciones en esta página/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Editar|Clasificar|Archivar|Restaurar/ })).not.toBeInTheDocument();
  });
  it('reports partial reference failures without hiding the asset or inventing an owner', async () => {
    const api = inventoryService({ responsible: vi.fn().mockRejectedValue(new ApiError(503, 'ERROR', 'Error.', [], 'ref-soporte')) });
    mount(api, asset.activoId); await screen.findByRole('article', { name: 'Clasificación versión 1' });
    expect(screen.getByText(/No pudimos consultar el propietario/)).toHaveTextContent('ref-soporte');
    expect(screen.getByText('No disponible', { selector: 'dd' })).toBeInTheDocument();
  });
  it('clears a late asset/list response after switching the request or disposing', async () => {
    const late = deferred<AssetPage>(); const api = inventoryService({ list: vi.fn().mockReturnValueOnce(late.promise).mockResolvedValue({ elementos: [], pagina: 1, tamano: 5, hayMas: false }) });
    const store = new InventoryStore(company.empresaId, api, vi.fn());
    const first = store.loadList({ pagina: 0 }); await store.loadList({ pagina: 1 }); late.resolve({ elementos: [asset], pagina: 0, tamano: 5, hayMas: false }); await first;
    expect(store.getSnapshot().list?.elementos).toEqual([]);
    const assetLate = deferred<Asset>(); vi.mocked(api.asset).mockReturnValueOnce(assetLate.promise);
    const pending = store.loadAsset(asset.activoId); store.dispose(); assetLate.resolve(asset); await pending;
    expect(store.getSnapshot().asset).toBeUndefined(); expect(api.valuations).not.toHaveBeenCalled();
  });
  it.each([401, 403])('propagates %s from any auxiliary query and withdraws all data', async status => {
    const authorization = vi.fn(); const store = new InventoryStore(company.empresaId, inventoryService({ history: vi.fn().mockRejectedValue(new ApiError(status, 'DENEGADO', 'Error.')) }), authorization);
    await store.loadAsset(asset.activoId); expect(authorization).toHaveBeenCalledWith(expect.objectContaining({ status }));
    expect(store.getSnapshot().asset).toBeUndefined(); expect(store.getSnapshot().valuations).toBeUndefined();
  });
  it('rejects unrelated asset/valuation/reference IDs and invalid dimensions without crashing', async () => {
    const api = inventoryService({ asset: vi.fn().mockResolvedValue({ ...asset, activoId: company.empresaId }) });
    const store = new InventoryStore(company.empresaId, api, vi.fn()); await store.loadAsset(asset.activoId);
    expect(store.getSnapshot().error?.code).toBe('RESPUESTA_INVALIDA'); expect(api.valuations).not.toHaveBeenCalled();
    vi.mocked(api.asset).mockResolvedValue(asset);
    vi.mocked(api.valuations).mockResolvedValue({ elementos: [{ ...pending, activoId: company.empresaId }], pagina: 0, tamano: 5, hayMas: false });
    await store.loadAsset(asset.activoId); expect(store.getSnapshot().warnings?.valuations?.code).toBe('RESPUESTA_INVALIDA');
    vi.mocked(api.valuations).mockResolvedValue({ elementos: [{ ...pending, entradas: { confidencialidad: 2 } } as unknown as typeof pending], pagina: 0, tamano: 5, hayMas: false });
    await store.loadAsset(asset.activoId); expect(store.getSnapshot().valuations).toBeUndefined();
  });
  it('uses only typed read endpoints with same-origin transport', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      expect(init?.method).toBe('GET'); expect(init?.credentials).toBe('same-origin');
      if (String(url).includes('?')) return Response.json({ elementos: [asset], pagina: 0, tamano: 5, hayMas: false });
      return Response.json(asset);
    });
    const api = createInventoryService(createApiClient({ fetch: fetcher }));
    await api.list(company.empresaId, { pagina: 0, tamano: 5, texto: 'nómina', estado: 'ACTIVO', tipo: 'SOFTWARE' }, new AbortController().signal);
    expect(String(fetcher.mock.calls[0][0])).toContain('texto=n%C3%B3mina');
    await api.asset(company.empresaId, asset.activoId, new AbortController().signal);
    expect(String(fetcher.mock.calls[1][0])).toBe(`/api/v1/empresas/${company.empresaId}/activos/${asset.activoId}`);
  });
  it('supports deep links, back navigation, focus revalidation and company-scoped filters', async () => {
    window.history.replaceState(null, '', `#/empresas/${company.empresaId}/activos`);
    const inventory = inventoryService(); const access = service(); const store = new WorkspaceStore(access, inventory);
    render(<App cache={createStyleCache('route-nonce')} store={store} />); const user = userEvent.setup();
    await screen.findByRole('link', { name: /ACT-033/ }); expect(access.panel).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Buscar por nombre o código'), 'nómina'); await user.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await screen.findByRole('link', { name: /ACT-033/ });
    await user.click(screen.getByRole('link', { name: /ACT-033/ })); await screen.findByRole('heading', { name: 'Ficha del activo' });
    await screen.findByRole('article', { name: 'Clasificación versión 1' });
    await user.click(screen.getByRole('link', { name: 'Volver al inventario' })); await screen.findByLabelText('Buscar por nombre o código');
    expect(screen.getByLabelText('Buscar por nombre o código')).toHaveValue('nómina');
    fireEvent(window, new Event('focus')); await screen.findByLabelText('Buscar por nombre o código');
    expect(screen.getByLabelText('Buscar por nombre o código')).toHaveValue('nómina');
    await act(async () => { await store.open(b.empresaId); });
    expect(screen.queryByLabelText('Buscar por nombre o código')).not.toBeInTheDocument();
  });
  it('denies RA deep links before requesting any inventory record', async () => {
    window.history.replaceState(null, '', `#/empresas/${b.empresaId}/activos/${asset.activoId}`);
    const inventory = inventoryService(); render(<App cache={createStyleCache()} store={new WorkspaceStore(service(), inventory)} />);
    await screen.findByRole('heading', { name: 'No pudimos abrir esta vista' });
    expect(inventory.asset).not.toHaveBeenCalled(); expect(inventory.list).not.toHaveBeenCalled();
  });
});
