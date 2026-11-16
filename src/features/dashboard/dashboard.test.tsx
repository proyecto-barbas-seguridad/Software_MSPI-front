import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Providers, createStyleCache } from '../../app/Providers';
import { ApiError } from '../../shared/api/client';
import { WorkspaceStore } from '../access/workspace';
import type { AccessState } from '../access/workspace';
import { a, b, deferred, emptyPanel, emptyResults, identity, service } from '../access/fixtures.test-support';
import { CompanyDashboard } from './CompanyDashboard';
import { validatePanel, validateResults } from './panel';
import type { Panel, Results } from './panel';

const evaluationId = '00000000-0000-0000-0000-000000000010';
function populated(): Panel {
  const panel = emptyPanel();
  panel.evaluaciones = { total: 6, porEstado: { BORRADOR: 6 }, elementos: [{ evaluacionId: evaluationId, nombre: 'Diagnóstico de prueba', fecha: '2026-11-16', estado: 'BORRADOR',
    versionCatalogoId: evaluationId, versionMetodologiaId: evaluationId, sinDecidir: 1, sinCalificacion: 1, heredadasPendientes: 0, controlesAplicables: 3, controlesEvaluados: 1, clausulasAplicables: 1, clausulasEvaluadas: 0 }] };
  panel.riesgos = { total: 2, porEstado: { EN_ANALISIS: 2 }, porSituacion: { VIGENTE: 1, PENDIENTE: 1 }, porNivel: { ALTO: 1 }, matriz: [{ probabilidad: 'ALTA', impacto: 'MAYOR', nivel: 'ALTO', total: 1 }], elementos: [] };
  panel.acciones = { total: 3, porEstado: { PENDIENTE: 2, EN_REVISION: 1 }, vencidas: 1, elementos: [] };
  return panel;
}
function results(): Results {
  const data = emptyResults(evaluationId);
  data.revision = 7;
  data.controlesGlobal = { total: 4, aplicables: 3, evaluados: 1, pendientes: 1, sinDecidir: 1, noAplican: 1, puntaje: 0, avance: 33.33, estado: 'PROVISIONAL' };
  data.dominios = [{ grupo: 'ORGANIZACIONAL', resultado: data.controlesGlobal }];
  data.clausulas = [{ grupo: 'CLAUSULA_4', resultado: { ...data.controlesGlobal, puntaje: null, avance: null, estado: 'PENDIENTE' } }];
  return data;
}
function mount(overrides: Partial<AccessState> = {}) {
  const onLoad = vi.fn();
  const state: AccessState = { status: 'company', identity, company: a, panel: populated(), results: results(), panelQuery: { detalle: 'EVALUACIONES', pagina: 0, baseRiesgo: 'RESIDUAL' }, ...overrides };
  return { ...render(<Providers mode="light" cache={createStyleCache('panel-nonce')}><CompanyDashboard state={state} onLoad={onLoad} /></Providers>), onLoad };
}
describe('Company dashboard', () => {
  it('keeps zero, provisional, pending and no aplica distinct, without mixing clause scores', async () => {
    const { container } = mount();
    const result = screen.getByRole('region', { name: 'Resultados de evaluación' });
    expect(within(result).getByText('0 / 100')).toBeInTheDocument();
    expect(within(result).getAllByText('Provisional').length).toBeGreaterThan(0);
    expect(within(result).getByText(/No aplica: 1/)).toBeInTheDocument();
    expect(within(result).getByText(/Avance: 33,33 %/)).toBeInTheDocument();
    await userEvent.click(screen.getByText('Ver resultados por cláusula'));
    const clauses = screen.getByRole('region', { name: 'Resultados por cláusula' });
    expect(within(clauses).getAllByText('Pendiente').length).toBe(2);
    expect(container.querySelector('[style]')).toBeNull();
    expect(Array.from(document.querySelectorAll<HTMLStyleElement>('style[data-emotion^="mspi"]')).every(style => style.nonce === 'panel-nonce')).toBe(true);
  });
  it.each(['SIN_ELEMENTOS', 'NO_APLICA', 'PENDIENTE'] as const)('presents a null score as %s rather than zero', state => {
    const data = emptyResults(evaluationId); data.controlesGlobal.estado = state;
    mount({ results: data });
    const result = screen.getByRole('region', { name: 'Resultados de evaluación' });
    expect(within(result).queryByText('0 / 100')).not.toBeInTheDocument();
    expect(within(result).getByText(/No calculable/)).toBeInTheDocument();
  });
  it('uses backend totals, keeps overdue separate, and explains sparse matrix zeros', async () => {
    mount();
    expect(within(screen.getByRole('region', { name: 'Resumen de acciones' })).getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/Vencidas: 1/)).toBeInTheDocument();
    await userEvent.click(screen.getByText('Ver matriz de riesgos vigentes'));
    expect(screen.getByText('1 · Alto')).toBeInTheDocument();
    expect(screen.getAllByText('0 · Sin registros')).toHaveLength(24);
    expect(screen.getByText(/Pendiente y revisión requerida no se convierten/)).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
  });
  it('submits inclusive dates and basis, resets the page, and clears unapplied values', async () => {
    const { onLoad } = mount(); const user = userEvent.setup();
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-16' } });
    await user.selectOptions(screen.getByLabelText('Base de riesgo'), 'INHERENTE');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(onLoad).toHaveBeenLastCalledWith({ detalle: 'EVALUACIONES', pagina: 0, desde: '2026-11-01', hasta: '2026-11-16', baseRiesgo: 'INHERENTE' });
    await user.click(screen.getByRole('button', { name: 'Limpiar' }));
    expect(screen.getByLabelText('Desde')).toHaveValue('');
    expect(onLoad).toHaveBeenLastCalledWith({ detalle: 'EVALUACIONES' });
  });
  it('preserves different backend levels in the same probability/impact cell', async () => {
    const panel = populated(); panel.riesgos.matriz.push({ probabilidad: 'ALTA', impacto: 'MAYOR', nivel: 'MODERADO', total: 2 });
    mount({ panel });
    await userEvent.click(screen.getByText('Ver matriz de riesgos vigentes'));
    expect(screen.getByText('1 · Alto; 2 · Moderado')).toBeInTheDocument();
  });
  it('rejects reversed date ranges and allows correcting the initial date', async () => {
    const { onLoad } = mount(); const user = userEvent.setup();
    fireEvent.input(screen.getByLabelText('Desde'), { target: { value: '2026-11-16' } });
    fireEvent.input(screen.getByLabelText('Hasta'), { target: { value: '2026-11-01' } });
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(onLoad).not.toHaveBeenCalled(); expect(screen.getByLabelText('Hasta')).toBeInvalid();
    fireEvent.input(screen.getByLabelText('Desde'), { target: { value: '2026-10-01' } });
    await user.click(screen.getByRole('button', { name: 'Aplicar' })); expect(onLoad).toHaveBeenCalledOnce();
  });
  it('paginates using the section total and changes detail without creating unsupported links', async () => {
    const { onLoad } = mount(); const user = userEvent.setup();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Siguiente' })); expect(onLoad).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 1, detalle: 'EVALUACIONES' }));
    await user.click(screen.getByRole('button', { name: 'Riesgos' })); expect(onLoad).toHaveBeenLastCalledWith(expect.objectContaining({ pagina: 0, detalle: 'RIESGOS' }));
    expect(screen.getByRole('link', { name: 'Diagnóstico de prueba' })).toHaveAttribute('href', `/empresas/${a.empresaId}/evaluaciones/${evaluationId}`);
  });
  it('shows empty, loading and unavailable states without inventing aggregate zeros on errors', () => {
    const { unmount } = mount({ panel: undefined, results: undefined, panelLoading: true });
    expect(screen.getByRole('status')).toHaveTextContent('Consultando');
    expect(screen.queryByRole('region', { name: 'Resumen de riesgos' })).not.toBeInTheDocument(); unmount();
    mount({ panel: undefined, results: undefined, panelError: new ApiError(503, 'NO_DISPONIBLE', 'Error.', [], 'soporte-9') });
    expect(screen.getByRole('alert')).toHaveTextContent('soporte-9');
    expect(screen.queryByRole('region', { name: 'Resumen de acciones' })).not.toBeInTheDocument();
  });
  it('shows a real empty panel as zero records without inventing a score', () => {
    mount({ panel: emptyPanel(), results: undefined });
    expect(screen.getByText('No hay registros en esta página con los filtros aplicados.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Resultados de evaluación' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Resumen de evaluaciones' })).getByText('0', { selector: 'p' })).toBeInTheDocument();
  });
  it('renders risk review required as no current assessment, keeping it separate from pending', () => {
    const panel = emptyPanel(a.empresaId, { detalle: 'RIESGOS' });
    panel.riesgos = { ...panel.riesgos, total: 1, elementos: [{ riesgoId: evaluationId, codigo: 'R-001', estado: 'EN_ANALISIS', situacion: 'REVISION_REQUERIDA', valoracionId: null, versionMetodologiaId: null, nivel: null, probabilidad: null, impacto: null }] };
    mount({ panel, results: undefined });
    expect(screen.getByText(/Nivel residual: Sin valoración vigente/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'R-001' })).not.toBeInTheDocument();
  });
  it('renders action execution state and overdue status independently', () => {
    const panel = emptyPanel(a.empresaId, { detalle: 'ACCIONES' });
    panel.acciones = { total: 1, porEstado: { EN_REVISION: 1 }, vencidas: 1, elementos: [{ accionId: evaluationId, codigo: 'AC-001', estado: 'EN_REVISION', fechaLimite: '2026-11-01', vencida: true }] };
    mount({ panel, results: undefined });
    expect(screen.getByText(/En revisión · Fecha límite: .* · Vencida/)).toBeInTheDocument();
  });
  it('preserves the effective filters on focus revalidation, then clears them on a company switch', async () => {
    const api = service(); const store = new WorkspaceStore(api);
    await store.open(a.empresaId); await store.loadPanel({ desde: '2026-11-01', baseRiesgo: 'INHERENTE', detalle: 'RIESGOS' });
    await store.retry(); expect(api.panel).toHaveBeenLastCalledWith(a.empresaId, expect.objectContaining({ desde: '2026-11-01', baseRiesgo: 'INHERENTE' }), expect.any(AbortSignal));
    await store.open(b.empresaId); expect(store.getSnapshot().panel).toBeUndefined();
    expect(api.panel).toHaveBeenCalledTimes(3);
  });
  it('never fetches the panel for RA alone', async () => {
    const api = service(); const store = new WorkspaceStore(api); await store.open(b.empresaId);
    expect(api.panel).not.toHaveBeenCalled(); expect(api.results).not.toHaveBeenCalled();
    await store.loadPanel(); expect(api.panel).not.toHaveBeenCalled();
  });
  it('cancels a late panel/results response on company switch or logout', async () => {
    const api = service(); const store = new WorkspaceStore(api); const slow = deferred<Results>();
    vi.mocked(api.panel).mockResolvedValueOnce(populated()); vi.mocked(api.results).mockReturnValueOnce(slow.promise);
    const pending = store.open(a.empresaId);
    await vi.waitFor(() => expect(api.results).toHaveBeenCalled());
    const signal = vi.mocked(api.results).mock.calls[0][2];
    await store.open(b.empresaId); expect(signal.aborted).toBe(true);
    slow.resolve(results()); await pending;
    expect(store.getSnapshot().company).toEqual(b); expect(store.getSnapshot().results).toBeUndefined();
    await store.logout(); expect(store.getSnapshot().panel).toBeUndefined();
  });
  it.each([401, 403])('withdraws all company data on a panel %s', async status => {
    const api = service({ panel: vi.fn().mockRejectedValue(new ApiError(status, 'DENEGADO', 'Denegado.')) });
    const store = new WorkspaceStore(api); await store.open(a.empresaId);
    expect(store.getSnapshot().status).toBe(status === 401 ? 'login' : 'error');
    expect(store.getSnapshot().company).toBeUndefined(); expect(store.getSnapshot().panel).toBeUndefined();
  });
  it('handles a partial results failure without labeling missing scores as zero', async () => {
    const api = service({ panel: vi.fn().mockResolvedValue(populated()), results: vi.fn().mockRejectedValue(new ApiError(503, 'ERROR', 'Error.')) });
    const store = new WorkspaceStore(api); await store.open(a.empresaId);
    expect(store.getSnapshot().panel).toEqual(populated()); expect(store.getSnapshot().results).toBeUndefined();
    expect(store.getSnapshot().resultsError?.status).toBe(503);
    await act(async () => { mount(store.getSnapshot()); });
    expect(screen.getByText(/no pudimos consultar los resultados/)).toBeInTheDocument();
  });
  it('rejects cross-company payloads, invalid dates/counts and mismatched result identities', () => {
    expect(() => validatePanel({ ...populated(), empresaId: b.empresaId }, a.empresaId, {})).toThrow(ApiError);
    const invalid = populated(); invalid.evaluaciones.elementos[0].fecha = '2026-02-30';
    expect(() => validatePanel(invalid, a.empresaId, {})).toThrow(ApiError);
    const invalidCount = populated(); invalidCount.acciones.total = -1;
    expect(() => validatePanel(invalidCount, a.empresaId, {})).toThrow(ApiError);
    expect(() => validateResults(results(), a.empresaId)).toThrow(ApiError);
  });
});
