import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { createStyleCache, Providers } from '../../app/Providers';
import { ApiError, createApiClient } from '../../shared/api/client';
import { WorkspaceStore } from '../access/workspace';
import { deferred, service } from '../access/fixtures.test-support';
import ClassificationEditor from './ClassificationEditor';
import { ClassificationStore, normalizeEntries } from './classification';
import { createInventoryService } from './inventory';
import type { Valuation } from './inventory';
import { asset, company, inventoryService, pending, valuation } from './fixtures.test-support';

afterEach(() => { window.history.replaceState(null, '', '/interfaz/'); });
const page = (values: Valuation[]) => ({ elementos: values, pagina: 0, tamano: 5, hayMas: false });
function setup(api = inventoryService()) {
  const authorization = vi.fn(); const dirty = vi.fn(); const processing = vi.fn();
  return { api, authorization, dirty, processing, store: new ClassificationStore(company.empresaId, asset.activoId, api, authorization, dirty, processing) };
}
function firstService() {
  return inventoryService({ asset: vi.fn().mockResolvedValue({ ...asset, estadoClasificacion: 'PENDIENTE' }), valuations: vi.fn().mockResolvedValue(page([])) });
}
function confirmedService() { return inventoryService({ valuations: vi.fn().mockResolvedValue(page([valuation])) }); }
function mount(api = inventoryService()) {
  const authorization = vi.fn(); const dirty = vi.fn();
  return { ...render(<Providers mode="light" cache={createStyleCache('classification-nonce')}><ClassificationEditor companyId={company.empresaId} assetId={asset.activoId} service={api}
    onAuthorization={authorization} onDirty={dirty} onPending={vi.fn()} onCancel={vi.fn()} onDone={vi.fn()} /></Providers>), authorization, dirty };
}
describe('Asset classification lifecycle', () => {
  it('preloads ACT-033 as 1/1/1 from a fresh confirmed version without creating a draft', async () => {
    const api = confirmedService(); const { container } = mount(api);
    await screen.findByLabelText('Confidencialidad');
    for (const label of ['Confidencialidad', 'Integridad', 'Disponibilidad']) expect(screen.getByLabelText(label)).toHaveValue('1');
    expect(api.valuation).toHaveBeenCalledWith(company.empresaId, asset.activoId, valuation.valoracionId, expect.any(AbortSignal));
    expect(api.startValuation).not.toHaveBeenCalled(); expect(screen.getByText(/Se copiaron sus entradas reales/)).toBeInTheDocument();
    expect(container.querySelector('[style]')).toBeNull();
    expect(Array.from(document.querySelectorAll<HTMLStyleElement>('style[data-emotion^="mspi"]')).every(style => style.nonce === 'classification-nonce')).toBe(true);
  });
  it('shows missing values as pending and starts only on explicit save, with null rather than zero', async () => {
    const api = firstService(); mount(api); const user = userEvent.setup(); await screen.findByLabelText('Integridad');
    expect(screen.getByLabelText('Integridad')).toHaveValue(''); expect(api.startValuation).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' })); await waitFor(() => expect(api.startValuation).toHaveBeenCalledOnce());
    expect(vi.mocked(api.startValuation).mock.calls[0][2]).toEqual({ entradas: normalizeEntries({}), motivoRevision: null });
    expect(api.confirmValuation).not.toHaveBeenCalled();
  });
  it('requires a reason for revision and copies only inputs, never calculated metadata', async () => {
    const { store, api } = setup(confirmedService()); await store.load(); await store.save();
    expect(api.startValuation).not.toHaveBeenCalled(); expect(store.getSnapshot().error?.fields[0].field).toBe('motivoRevision');
    store.reason('Cambio de contexto'); await store.save();
    const body = vi.mocked(api.startValuation).mock.calls[0][2]; expect(body.motivoRevision).toBe('Cambio de contexto');
    expect(body.entradas).toMatchObject({ confidencialidad: 1, integridad: 1, disponibilidad: 1 });
    expect(body.entradas).not.toHaveProperty('criticidad'); expect(body.entradas).not.toHaveProperty('nivel');
    expect(api.confirmValuation).not.toHaveBeenCalled();
  });
  it('continues the pending version rather than copying another version or creating a duplicate', async () => {
    const { store, api } = setup(); await store.load();
    expect(store.getSnapshot().draft?.valoracionId).toBe(pending.valoracionId);
    expect(store.getSnapshot().entries).toMatchObject({ confidencialidad: 3, integridad: null, disponibilidad: 5 });
    store.change({ ...store.getSnapshot().entries, integridad: 1 }); await store.save();
    expect(api.editValuation).toHaveBeenCalledWith(company.empresaId, asset.activoId, pending.valoracionId, expect.objectContaining({ revisionEsperada: pending.revision }), expect.any(AbortSignal));
    expect(api.startValuation).not.toHaveBeenCalled();
  });
  it('requires saving local changes before confirmation and sends the saved revision only', async () => {
    const api = inventoryService({ editValuation: vi.fn().mockImplementation(async (_, __, ___, body) => ({ ...pending, revision: 9, entradas: body.entradas })) });
    const { store } = setup(api); await store.load(); store.change({ ...pending.entradas, integridad: 1 }); await store.confirm();
    expect(api.confirmValuation).not.toHaveBeenCalled(); await store.save(); await store.confirm();
    expect(api.confirmValuation).toHaveBeenCalledWith(company.empresaId, asset.activoId, pending.valoracionId, { revisionEsperada: 9 }, expect.any(AbortSignal));
    expect(store.getSnapshot().status).toBe('confirmed'); expect(store.getSnapshot().draft?.criticidad).toBe(1);
  });
  it('publishes only through explicit confirm and displays the server result', async () => {
    mount(); const user = userEvent.setup(); await screen.findByRole('button', { name: 'Confirmar versión guardada' });
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: 'Confirmar versión guardada' })); expect(screen.queryByText('Clasificación confirmada por el servidor.')).not.toBeInTheDocument();
    confirmation.mockReturnValue(true); await user.click(screen.getByRole('button', { name: 'Confirmar versión guardada' }));
    await screen.findByText('Clasificación confirmada por el servidor.'); expect(screen.getByText('Criticidad confirmada: 1 · Baja')).toBeInTheDocument();
  });
  it('retains incomplete confirmed-attempt errors for correction without fabricating a score', async () => {
    const api = inventoryService({ confirmValuation: vi.fn().mockRejectedValue(new ApiError(409, 'CLASIFICACION_INCOMPLETA', 'Completa los campos requeridos.', [{ field: 'entradas.integridad', code: 'REQUERIDO', message: 'Completa la integridad.' }])) });
    mount(api); const user = userEvent.setup(); await screen.findByLabelText('Integridad'); vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Confirmar versión guardada' })); await screen.findByText('Completa la integridad.');
    expect(screen.getByLabelText('Integridad')).toHaveValue(''); expect(screen.getByLabelText('Integridad')).toHaveAttribute('aria-invalid', 'true');
    await user.selectOptions(screen.getByLabelText('Integridad'), '1'); expect(screen.getByRole('button', { name: 'Confirmar versión guardada' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeEnabled();
    vi.mocked(api.editValuation).mockImplementation(async (_, __, ___, body) => ({ ...pending, revision: pending.revision + 1, entradas: body.entradas }));
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' })); await screen.findByText(/Borrador guardado/);
    expect(screen.queryByText('Completa la integridad.')).not.toBeInTheDocument(); expect(screen.getByLabelText('Integridad')).toHaveValue('1');
  });
  it('handles personal-data conditions, no aplica justification and explicit clearing', async () => {
    mount(); const user = userEvent.setup(); await screen.findByLabelText('Justificación de no aplica');
    expect(screen.getByLabelText('¿Incluye datos de menores?')).toHaveValue('NO');
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.selectOptions(screen.getByLabelText('¿Contiene datos personales?'), 'NO'); expect(screen.getByLabelText('Justificación de no aplica')).toHaveValue(pending.entradas.justificacionNoAplica);
    confirmation.mockReturnValue(true); await user.selectOptions(screen.getByLabelText('¿Contiene datos personales?'), 'NO');
    expect(screen.queryByLabelText('Finalidad del tratamiento')).not.toBeInTheDocument(); expect(screen.getByText('Campos personales dependientes: No aplica.')).toBeInTheDocument();
  });
  it('submits coherent dependent fields and removes values that no longer apply', () => {
    const entries = normalizeEntries({ ...pending.entradas, contieneDatosPersonales: false });
    expect(entries).toMatchObject({ contieneDatosPersonales: false, contieneDatosMenores: null, tiposDatosPersonales: [], finalidadTratamiento: null, autorizacionTratamiento: null, justificacionNoAplica: null });
    expect(normalizeEntries({ ...pending.entradas, autorizacionTratamiento: 'SI' }).justificacionNoAplica).toBeNull();
    expect(normalizeEntries(pending.entradas)).toMatchObject({ autorizacionTratamiento: 'NO_APLICA', justificacionNoAplica: 'Justificación declarada' });
    expect(normalizeEntries(Object.assign({}, pending.entradas, { criticidad: 5, nivel: 'ALTA' }))).not.toHaveProperty('criticidad');
  });
  it.each(['REVISION_DESACTUALIZADA', 'VALORACION_CONFIRMADA'])('blocks overwrites on %s and reloads only after an explicit decision', async code => {
    const { store, api } = setup(inventoryService({ editValuation: vi.fn().mockRejectedValue(new ApiError(409, code, 'Conflicto.')) }));
    await store.load(); store.change({ ...pending.entradas, integridad: 1 }); await store.save(); await store.save();
    expect(api.editValuation).toHaveBeenCalledOnce(); expect(store.getSnapshot().blocked).toBe(true); expect(store.getSnapshot().entries.integridad).toBe(1);
    await store.load(); expect(store.getSnapshot().entries.integridad).toBeNull(); expect(store.getSnapshot().blocked).toBe(false);
  });
  it.each([0, 503])('treats write %s as uncertain without re-sending', async status => {
    const { store, api } = setup(inventoryService({ editValuation: vi.fn().mockRejectedValue(new ApiError(status, 'ERROR', 'Error.')) }));
    await store.load(); store.change({ ...pending.entradas, integridad: 1 }); await store.save(); await store.save();
    expect(store.getSnapshot().blocked).toBe(true); expect(store.getSnapshot().dirty).toBe(true); expect(api.editValuation).toHaveBeenCalledOnce();
  });
  it('detects a new pending or changed source before creating another version', async () => {
    for (const values of [[pending, valuation], [{ ...valuation, valoracionId: pending.valoracionId }]]) {
      const api = confirmedService(); const { store } = setup(api); await store.load(); store.reason('Revisión');
      vi.mocked(api.valuations).mockResolvedValueOnce(page(values)); await store.save();
      expect(api.startValuation).not.toHaveBeenCalled(); expect(store.getSnapshot().blocked).toBe(true);
    }
  });
  it('does not report an uncertain write when the preflight read failed before POST', async () => {
    const api = confirmedService(); const { store } = setup(api); await store.load(); store.reason('Revisión');
    vi.mocked(api.valuations).mockRejectedValueOnce(new ApiError(503, 'ERROR', 'Error al consultar.')); await store.save();
    expect(api.startValuation).not.toHaveBeenCalled(); expect(store.getSnapshot().blocked).toBe(false); expect(store.getSnapshot().dirty).toBe(true);
  });
  it('keeps editable inputs on CSRF failure and clears them on actual authorization loss', async () => {
    for (const [code, lost] of [['CSRF_INVALIDO', false], ['DENEGADO', true]] as const) {
      const { store, authorization } = setup(inventoryService({ editValuation: vi.fn().mockRejectedValue(new ApiError(403, code, 'Solicitud rechazada.')) }));
      await store.load(); store.change({ ...pending.entradas, integridad: 1 }); await store.save();
      expect(Boolean(authorization.mock.calls.length)).toBe(lost);
      expect(store.getSnapshot().entries.integridad).toBe(lost ? null : 1);
    }
  });
  it('does not submit twice and ignores late responses after leaving the company scope', async () => {
    const response = deferred<Valuation>(); const api = inventoryService({ editValuation: vi.fn().mockReturnValue(response.promise) });
    const { store } = setup(api); await store.load(); store.change({ ...pending.entradas, integridad: 1 });
    const first = store.save(); await store.save(); expect(api.editValuation).toHaveBeenCalledOnce();
    const signal = vi.mocked(api.editValuation).mock.calls[0][4]; store.dispose(); response.resolve({ ...pending, revision: 9 }); await first;
    expect(signal.aborted).toBe(true); expect(store.getSnapshot().draft?.revision).not.toBe(9);
  });
  it('rejects archived assets and classifications belonging to a different asset', async () => {
    const archived = setup(inventoryService({ asset: vi.fn().mockResolvedValue({ ...asset, estado: 'ARCHIVADO' }) })); await archived.store.load();
    expect(archived.api.valuations).not.toHaveBeenCalled(); expect(archived.store.getSnapshot().status).toBe('error');
    const unrelated = setup(inventoryService({ valuation: vi.fn().mockResolvedValue({ ...pending, activoId: company.empresaId }) })); await unrelated.store.load();
    expect(unrelated.store.getSnapshot().error?.code).toBe('RESPUESTA_INVALIDA');
  });
  it('uses scoped typed endpoints and a new CSRF for start, edit and confirm', async () => {
    let tokens = 0; const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).endsWith('/csrf')) return Response.json({ headerName: 'X-CSRF-TOKEN', token: 'classification-' + (++tokens) });
      expect(init?.credentials).toBe('same-origin');
      if (init?.method !== 'GET') expect(new Headers(init?.headers).get('X-CSRF-TOKEN')).toBe('classification-' + tokens);
      return Response.json(pending);
    });
    const api = createInventoryService(createApiClient({ fetch: fetcher })); const signal = new AbortController().signal;
    await api.valuation(company.empresaId, asset.activoId, pending.valoracionId, signal);
    await api.startValuation(company.empresaId, asset.activoId, { entradas: normalizeEntries({}) }, signal);
    await api.editValuation(company.empresaId, asset.activoId, pending.valoracionId, { revisionEsperada: 2, entradas: normalizeEntries(pending.entradas) }, signal);
    await api.confirmValuation(company.empresaId, asset.activoId, pending.valoracionId, { revisionEsperada: 3 }, signal);
    expect(tokens).toBe(3); expect(String(fetcher.mock.calls.at(-1)![0])).toBe(`/api/v1/empresas/${company.empresaId}/activos/${asset.activoId}/clasificaciones/${pending.valoracionId}/confirmar`);
    expect(JSON.parse(String(fetcher.mock.calls.at(-1)![1]?.body))).toEqual({ revisionEsperada: 3 });
  });
  it('protects classification changes on navigation and retires the form on session loss', async () => {
    window.history.replaceState(null, '', `#/empresas/${company.empresaId}/activos/${asset.activoId}`);
    const access = service(); const root = new WorkspaceStore(access, inventoryService());
    render(<App cache={createStyleCache()} store={root} />); const user = userEvent.setup(); await screen.findByRole('button', { name: 'Clasificar activo' });
    await user.click(screen.getByRole('button', { name: 'Clasificar activo' })); await screen.findByLabelText('Integridad'); await user.selectOptions(screen.getByLabelText('Integridad'), '1');
    vi.spyOn(window, 'confirm').mockReturnValue(false); await user.click(screen.getByRole('button', { name: 'Cambiar empresa' }));
    expect(screen.getByLabelText('Integridad')).toHaveValue('1');
    await act(async () => { root.expire(); }); expect(screen.queryByLabelText('Integridad')).not.toBeInTheDocument(); expect(root.draftDirty).toBe(false);
  });
});
