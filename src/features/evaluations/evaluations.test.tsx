import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { createStyleCache, Providers } from '../../app/Providers';
import { ApiError, createApiClient } from '../../shared/api/client';
import { a, b, deferred, service } from '../access/fixtures.test-support';
import { WorkspaceStore } from '../access/workspace';
import { inventoryService } from '../inventory/fixtures.test-support';
import EvaluationWorkspace from './EvaluationWorkspace';
import { createEvaluationService, EvaluationStore } from './evaluations';
import type { EvaluationPage, EvaluationService } from './evaluations';
import { answer, evaluation, evaluationService, evidence, results } from './fixtures.test-support';

const originalCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL');
const originalRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL');
afterEach(() => {
  cleanup(); window.history.replaceState(null, '', '/interfaz/');
  for (const [key, descriptor] of [['createObjectURL', originalCreate], ['revokeObjectURL', originalRevoke]] as const)
    if (descriptor) Object.defineProperty(URL, key, descriptor); else Reflect.deleteProperty(URL, key);
});
function mount(api = evaluationService(), id: string | null = evaluation.evaluacionId, scope?: AbortSignal) {
  const authorization = vi.fn(); const onPage = vi.fn();
  return { ...render(<Providers mode="light" cache={createStyleCache('evaluations-nonce')}><EvaluationWorkspace company={a} evaluationId={id || undefined} service={api} scope={scope} onAuthorization={authorization} onPage={onPage} /></Providers>), authorization, onPage };
}
async function openEvidence() {
  await screen.findByRole('article', { name: 'Respuesta A.1' });
  await userEvent.click(screen.getByText('Ver evidencias de A.1')); await screen.findByRole('button', { name: 'Descargar acta-prueba.pdf' });
}
describe('Evaluation queries and private evidence', () => {
  it('paginates lists using hayMas and links to the React evaluation scope', async () => {
    const api = evaluationService({ list: vi.fn().mockImplementation(async (_, pagina) => ({ elementos: [{ ...evaluation, nombre: `Evaluación ${pagina + 1}` }], pagina, tamano: 5, hayMas: pagina === 0 })) });
    const { onPage } = mount(api, null); const user = userEvent.setup(); await screen.findByRole('link', { name: 'Evaluación 1' });
    expect(screen.getByRole('link', { name: 'Evaluación 1' })).toHaveAttribute('href', `#/empresas/${a.empresaId}/evaluaciones/${evaluation.evaluacionId}`);
    await user.click(screen.getByRole('button', { name: 'Siguiente en evaluaciones' })); await screen.findByText('Página 2');
    expect(onPage).toHaveBeenLastCalledWith(1); expect(screen.getByRole('button', { name: 'Siguiente en evaluaciones' })).toBeDisabled();
  });
  it('distinguishes zero, pending, no aplica and provisional without mixing controls and clauses', async () => {
    const { container } = mount();
    const zero = await screen.findByRole('article', { name: 'Respuesta A.1' }); expect(within(zero).getByText('0 / 100')).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'Respuesta A.2' })).getAllByText('No aplica').length).toBeGreaterThan(0);
    expect(within(screen.getByRole('article', { name: 'Respuesta A.3' })).getByText('Calificación', { selector: 'dt' }).nextElementSibling).toHaveTextContent('Pendiente');
    expect(screen.getByText('Provisional')).toBeInTheDocument(); expect(screen.getByText(/heredada pendiente de confirmación/)).toBeInTheDocument();
    await userEvent.click(screen.getByText('Ver resultados por cláusula')); expect(screen.getByRole('region', { name: 'Resultados por cláusula' })).toHaveTextContent('Pendiente');
    expect(container.querySelector('[style]')).toBeNull();
    expect(Array.from(document.querySelectorAll<HTMLStyleElement>('style[data-emotion^="mspi"]')).every(style => style.nonce === 'evaluations-nonce')).toBe(true);
  });
  it('filters responses in the backend, resets page and preserves evaluation-wide results', async () => {
    const api = evaluationService(); mount(api); const user = userEvent.setup(); await screen.findByLabelText('Tipo de elemento');
    await user.selectOptions(screen.getByLabelText('Tipo de elemento'), 'CLAUSULA'); await user.type(screen.getByLabelText('Grupo del catálogo'), 'CLAUSULA_4');
    await user.click(screen.getByRole('button', { name: 'Aplicar filtros' })); await screen.findByRole('article', { name: 'Respuesta 4.1' });
    expect(api.answers).toHaveBeenLastCalledWith(a.empresaId, evaluation.evaluacionId, { pagina: 0, tamano: 5, tipo: 'CLAUSULA', grupo: 'CLAUSULA_4' }, expect.any(AbortSignal));
    expect(screen.queryByRole('article', { name: 'Respuesta A.1' })).not.toBeInTheDocument(); expect(screen.getByRole('region', { name: 'Resultados de evaluación' })).toHaveTextContent('0 / 100');
  });
  it('paginates filtered responses independently from the full result', async () => {
    const rows = Array.from({ length: 6 }, (_, index) => ({ ...answer, respuestaId: '00000000-0000-0000-0000-' + String(100 + index).padStart(12, '0'), codigo: 'A.' + (index + 1),
      respuesta: { ...answer.respuesta, calificacion: index === 0 ? 0 as const : null } }));
    const api = evaluationService({ answers: vi.fn().mockImplementation(async (_, __, query) => ({ elementos: rows.slice(query.pagina * 5, query.pagina * 5 + 5), pagina: query.pagina, tamano: 5, hayMas: query.pagina === 0 })),
      results: vi.fn().mockResolvedValue({ ...results, controlesGlobal: { total: 6, aplicables: 6, evaluados: 1, pendientes: 5, sinDecidir: 0, noAplican: 0, puntaje: 0, avance: 16.67, estado: 'PROVISIONAL' }, clausulas: [] }) });
    mount(api); await screen.findByRole('article', { name: 'Respuesta A.1' });
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente en respuestas' })); await screen.findByRole('article', { name: 'Respuesta A.6' });
    expect(api.answers).toHaveBeenLastCalledWith(a.empresaId, evaluation.evaluacionId, { pagina: 1, tamano: 5 }, expect.any(AbortSignal));
    expect(screen.getByRole('region', { name: 'Resultados de evaluación' })).toHaveTextContent('1 de 6 controles');
  });
  it('warns about independently observed revisions and keeps their actual numbers visible', async () => {
    mount(evaluationService({ results: vi.fn().mockResolvedValue({ ...results, revision: 5 }) }));
    await screen.findByText(/corresponden a revisiones distintas/); expect(screen.getByText('Revisión de resultados: 5')).toBeInTheDocument();
  });
  it('keeps the detail on a partial read failure without inventing results', async () => {
    mount(evaluationService({ results: vi.fn().mockRejectedValue(new ApiError(503, 'ERROR', 'Error.', [], 'ref-resultados')) }));
    await screen.findByRole('article', { name: 'Respuesta A.1' }); expect(screen.getByText(/ref-resultados/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Resultados de evaluación' })).not.toBeInTheDocument();
  });
  it.each([401, 403])('withdraws the entire detail after an auxiliary %s', async status => {
    const authorization = vi.fn(); const store = new EvaluationStore(a.empresaId, evaluationService({ results: vi.fn().mockRejectedValue(new ApiError(status, 'DENEGADO', 'Error.')) }), authorization);
    await store.detail(evaluation.evaluacionId); expect(authorization).toHaveBeenCalledWith(expect.objectContaining({ status }));
    expect(store.getSnapshot().evaluation).toBeUndefined(); expect(store.getSnapshot().answers).toBeUndefined();
  });
  it('rejects crossed IDs, mismatched catalog responses and malformed dates before rendering them', async () => {
    const api = evaluationService({ detail: vi.fn().mockResolvedValue({ ...evaluation, evaluacionId: a.empresaId }) }); const store = new EvaluationStore(a.empresaId, api, vi.fn());
    await store.detail(evaluation.evaluacionId); expect(store.getSnapshot().error?.code).toBe('RESPUESTA_INVALIDA'); expect(api.answers).not.toHaveBeenCalled();
    vi.mocked(api.detail).mockResolvedValue(evaluation); vi.mocked(api.answers).mockResolvedValue({ elementos: [{ ...answer, versionCatalogoId: a.empresaId }], pagina: 0, tamano: 5, hayMas: false });
    await store.detail(evaluation.evaluacionId); expect(store.getSnapshot().answersError?.code).toBe('RESPUESTA_INVALIDA');
    vi.mocked(api.detail).mockResolvedValue({ ...evaluation, fechaEvaluacion: '2026-02-30' }); await store.detail(evaluation.evaluacionId);
    expect(store.getSnapshot().evaluation).toBeUndefined();
  });
  it('cancels stale reads and ignores completion after disposal', async () => {
    const late = deferred<EvaluationPage>(); const api = evaluationService({ list: vi.fn().mockReturnValueOnce(late.promise).mockResolvedValue({ elementos: [], pagina: 1, tamano: 5, hayMas: false }) });
    const store = new EvaluationStore(a.empresaId, api, vi.fn()); const first = store.list(0); const signal = vi.mocked(api.list).mock.calls[0][2];
    await store.list(1); late.resolve({ elementos: [evaluation], pagina: 0, tamano: 5, hayMas: false }); await first;
    expect(signal.aborted).toBe(true); expect(store.getSnapshot().list?.elementos).toEqual([]);
    const pending = deferred<EvaluationPage>(); vi.mocked(api.list).mockReturnValueOnce(pending.promise); const call = store.list(0); store.dispose(); pending.resolve({ elementos: [], pagina: 0, tamano: 5, hayMas: false }); await call;
    expect(store.getSnapshot().list).toBeUndefined();
  });
  it('loads evidence only on expansion and checks the backend again for each download', async () => {
    const api = evaluationService(); mount(api); await screen.findByRole('article', { name: 'Respuesta A.1' }); expect(api.evidence).not.toHaveBeenCalled();
    const create = vi.fn().mockReturnValue('blob:test-evidence'); const revoke = vi.fn(); Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: create }); Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await openEvidence(); expect(api.file).not.toHaveBeenCalled(); await userEvent.click(screen.getByRole('button', { name: 'Descargar acta-prueba.pdf' }));
    await waitFor(() => expect(click).toHaveBeenCalledOnce()); expect(api.file).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, answer.respuestaId, evidence.evidenciaId, expect.any(AbortSignal));
    expect(create).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByText('Ver evidencias de A.1')); await waitFor(() => expect(revoke).toHaveBeenCalledWith('blob:test-evidence'));
  });
  it('aborts an expanded evidence query when it is collapsed', async () => {
    const late = deferred<ReturnType<EvaluationService['evidence']> extends Promise<infer T> ? T : never>(); const api = evaluationService({ evidence: vi.fn().mockReturnValue(late.promise) });
    mount(api); await screen.findByRole('article', { name: 'Respuesta A.1' }); const user = userEvent.setup(); await user.click(screen.getByText('Ver evidencias de A.1'));
    await vi.waitFor(() => expect(api.evidence).toHaveBeenCalled()); const signal = vi.mocked(api.evidence).mock.calls[0][4];
    await user.click(screen.getByText('Ver evidencias de A.1')); await waitFor(() => expect(signal.aborted).toBe(true));
    await act(async () => { late.resolve({ elementos: [evidence], pagina: 0, tamano: 5, hayMas: false }); }); expect(screen.queryByText('acta-prueba.pdf')).not.toBeInTheDocument();
  });
  it('does not download a file after the company scope is invalidated, even before panel cleanup', async () => {
    const late = deferred<Blob>(); const scope = new AbortController(); const api = evaluationService({ file: vi.fn().mockReturnValue(late.promise) }); mount(api, evaluation.evaluacionId, scope.signal); await openEvidence();
    const create = vi.fn(); Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: create });
    await userEvent.click(screen.getByRole('button', { name: 'Descargar acta-prueba.pdf' })); const signal = vi.mocked(api.file).mock.calls[0][4];
    scope.abort();
    await act(async () => { late.resolve(new Blob(['pdf'], { type: 'application/pdf' })); }); expect(create).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText('Ver evidencias de A.1')); await waitFor(() => expect(signal.aborted).toBe(true));
  });
  it('handles evidence pagination and empty pages without assuming there are no other files', async () => {
    const api = evaluationService({ evidence: vi.fn().mockImplementation(async (_, __, ___, pagina) => ({ elementos: pagina ? [] : [evidence], pagina, tamano: 5, hayMas: pagina === 0 })) });
    mount(api); await openEvidence(); await userEvent.click(screen.getByRole('button', { name: 'Siguiente en evidencias' }));
    await screen.findByText('No hay evidencias disponibles en esta página.'); expect(api.evidence).toHaveBeenLastCalledWith(a.empresaId, evaluation.evaluacionId, answer.respuestaId, 1, expect.any(AbortSignal));
  });
  it('withdraws authorization on a rejected private download without creating a blob URL', async () => {
    const api = evaluationService({ file: vi.fn().mockRejectedValue(new ApiError(403, 'DENEGADO', 'Denegado.')) }); const { authorization } = mount(api); await openEvidence();
    await userEvent.click(screen.getByRole('button', { name: 'Descargar acta-prueba.pdf' })); await waitFor(() => expect(authorization).toHaveBeenCalledWith(expect.objectContaining({ status: 403 })));
    expect(screen.queryByRole('button', { name: 'Descargar acta-prueba.pdf' })).not.toBeInTheDocument();
  });
  it('retains an evidence listing on inspection/service failure instead of pretending a successful download', async () => {
    const api = evaluationService({ file: vi.fn().mockRejectedValue(new ApiError(503, 'INSPECCION_EVIDENCIAS_NO_DISPONIBLE', 'Servicio no disponible.', [], 'inspeccion-1', 3)) }); mount(api); await openEvidence();
    await userEvent.click(screen.getByRole('button', { name: 'Descargar acta-prueba.pdf' })); await screen.findByText(/inspeccion-1/);
    expect(screen.getByRole('button', { name: 'Descargar acta-prueba.pdf' })).toBeEnabled(); expect(api.file).toHaveBeenCalledOnce();
  });
  it('reports a security inspection block without confusing it with lost membership', async () => {
    const api = evaluationService({ file: vi.fn().mockRejectedValue(new ApiError(422, 'EVIDENCIA_BLOQUEADA', 'Archivo bloqueado.')) }); const { authorization } = mount(api); await openEvidence();
    await userEvent.click(screen.getByRole('button', { name: 'Descargar acta-prueba.pdf' })); await screen.findByText(/no superó la inspección de seguridad/);
    expect(authorization).not.toHaveBeenCalled(); expect(screen.getByRole('article', { name: 'Respuesta A.1' })).toBeInTheDocument();
  });
  it('provides scoped typed GET requests with encoded filters and guarded binary attachments', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      expect(init?.method).toBe('GET'); expect(init?.credentials).toBe('same-origin');
      return String(url).endsWith('/archivo') ? new Response('%PDF-1.7\n%%EOF', { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="acta.pdf"' } }) : Response.json({ elementos: [], pagina: 0, tamano: 5, hayMas: false });
    });
    const api = createEvaluationService(createApiClient({ fetch: fetcher })); const signal = new AbortController().signal;
    await api.answers(a.empresaId, evaluation.evaluacionId, { pagina: 0, tamano: 5, tipo: 'CONTROL', grupo: 'grupo & prueba' }, signal);
    expect(String(fetcher.mock.calls[0][0])).toContain('grupo=grupo+%26+prueba');
    expect((await api.file(a.empresaId, evaluation.evaluacionId, answer.respuestaId, evidence.evidenciaId, signal)).type).toBe('application/pdf');
  });
  it('integrates deep links, remembers list page in one company and blocks RA before module requests', async () => {
    window.history.replaceState(null, '', `#/empresas/${a.empresaId}/evaluaciones/${evaluation.evaluacionId}`);
    const access = service(); const api = evaluationService(); const root = new WorkspaceStore(access, inventoryService(), api);
    render(<App cache={createStyleCache()} store={root} />); await screen.findByRole('article', { name: 'Respuesta A.1' });
    expect(access.panel).not.toHaveBeenCalled(); expect(screen.getByRole('link', { name: 'Consultar evaluaciones' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Panel' })).not.toHaveAttribute('aria-current');
    await userEvent.selectOptions(screen.getByLabelText('Tipo de elemento'), 'CLAUSULA'); await userEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));
    await screen.findByRole('article', { name: 'Respuesta 4.1' }); fireEvent(window, new Event('focus'));
    await screen.findByLabelText('Tipo de elemento'); expect(screen.getByLabelText('Tipo de elemento')).toHaveValue('CLAUSULA');
    await act(async () => { root.rememberEvaluationPage(a.empresaId, 2); await root.retry(); });
    await userEvent.click(screen.getByRole('link', { name: 'Volver a evaluaciones' })); await screen.findByText('Página 3');
    await act(async () => { await root.open(b.empresaId, 0, undefined, { section: 'evaluations' }); });
    expect(root.getSnapshot().status).toBe('error'); expect(api.list).toHaveBeenCalledTimes(1);
  });
  it('allows AU to consult without presenting any write or lifecycle controls', async () => {
    window.history.replaceState(null, '', `#/empresas/${a.empresaId}/evaluaciones/${evaluation.evaluacionId}`);
    const access = service({ company: vi.fn().mockResolvedValue({ ...a, roles: ['AU'] }) });
    render(<App cache={createStyleCache()} store={new WorkspaceStore(access, inventoryService(), evaluationService())} />);
    await screen.findByRole('article', { name: 'Respuesta A.1' }); expect(screen.queryByRole('button', { name: /Crear|Editar|Enviar|Cerrar evaluación|Aprobar/ })).not.toBeInTheDocument();
  });
  it('shows an actual empty list distinctly from a service failure', async () => {
    const api = evaluationService({ list: vi.fn().mockResolvedValue({ elementos: [], pagina: 0, tamano: 5, hayMas: false }) }); const first = mount(api, null);
    await screen.findByText('No hay evaluaciones en esta página.'); first.unmount();
    mount(evaluationService({ list: vi.fn().mockRejectedValue(new ApiError(503, 'ERROR', 'Error.')) }), null); await screen.findByRole('alert');
    expect(screen.queryByText('No hay evaluaciones en esta página.')).not.toBeInTheDocument();
  });
});
