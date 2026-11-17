import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Providers, createStyleCache } from '../../app/Providers';
import { ApiError, createApiClient } from '../../shared/api/client';
import { a, deferred } from '../access/fixtures.test-support';
import EvidenceUpload, { fileProblem, MAX_EVIDENCE_BYTES } from './EvidenceUpload';
import EvaluationWorkspace from './EvaluationWorkspace';
import { createEvaluationService } from './evaluations';
import type { EvidenceUpload as UploadResult } from './evaluations';
import { answer, evaluation, evaluationService, evidence, results } from './fixtures.test-support';
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); window.history.replaceState(null, '', '/interfaz/'); });
const file = () => new File(['%PDF-1.7\n%%EOF'], 'acta-prueba.pdf', { type: 'application/pdf' });
function wrap(children: React.ReactNode) { return <Providers mode="light" cache={createStyleCache('upload-nonce')}>{children}</Providers>; }
function mount(service = evaluationService(), scope?: AbortSignal) {
  const saved = vi.fn(), dirty = vi.fn(), pending = vi.fn(), authorization = vi.fn();
  return { ...render(wrap(<EvidenceUpload companyId={a.empresaId} evaluation={evaluation} answer={answer} service={service} scope={scope} onSaved={saved} onCancel={vi.fn()} onAuthorization={authorization} onDirty={dirty} onPending={pending} />)), saved, dirty, pending, authorization };
}
async function choose(selected = file()) { await userEvent.upload(screen.getByLabelText('Archivo *'), selected); return selected; }
const save = () => userEvent.click(screen.getByRole('button', { name: 'Cargar evidencia' }));
describe('Private evidence upload', () => {
  it('sends the selected File, optional description and captured evaluation revision', async () => {
    const service = evaluationService(); const { saved, dirty } = mount(service); const selected = await choose(); fireEvent.change(screen.getByLabelText('Descripción (opcional)'), { target: { value: '  Acta de revisión  ' } }); await save();
    await waitFor(() => expect(saved).toHaveBeenCalledWith(expect.objectContaining({ nombreOriginal: selected.name, descripcion: 'Acta de revisión' })));
    expect(service.upload).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, answer.respuestaId, { archivo: selected, revisionEsperada: 4, descripcion: 'Acta de revisión' }, expect.any(AbortSignal)); expect(dirty).toHaveBeenCalledWith(true);
  });
  it('omits a blank description rather than converting it to text null', async () => {
    const service = evaluationService(); mount(service); await choose(); await save(); expect(service.upload).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, answer.respuestaId, { archivo: expect.any(File), revisionEsperada: 4 }, expect.any(AbortSignal));
  });
  it('requires a file without sending an upload', async () => {
    const service = evaluationService(); mount(service); await save(); await screen.findByText('Selecciona un archivo.'); expect(service.upload).not.toHaveBeenCalled();
  });
  it.each(['programa.exe', 'ruta/acta.pdf', 'ruta\\acta.pdf', 'oculto\u202e.pdf', 'control\u0001.pdf', 'a'.repeat(252) + '.pdf'])('rejects unsupported or unsafe name %s', name => {
    expect(fileProblem(new File(['fixture'], name))).toMatch(/nombre válido/);
  });
  it('bounds exact file bytes and rejects empty content without pretending to inspect content', async () => {
    expect(fileProblem(new File([], 'vacio.pdf'))).toMatch(/vacío/); const large = new File(['fixture'], 'grande.pdf'); Object.defineProperty(large, 'size', { value: MAX_EVIDENCE_BYTES + 1 }); expect(fileProblem(large)).toMatch(/supera 10 MB/);
    const limit = new File(['fixture'], 'limite.pdf'); Object.defineProperty(limit, 'size', { value: MAX_EVIDENCE_BYTES }); expect(fileProblem(limit)).toBeUndefined();
    const service = evaluationService(); mount(service); fireEvent.change(screen.getByLabelText('Archivo *'), { target: { files: [large] } }); expect(screen.getByRole('button', { name: 'Cargar evidencia' })).toBeDisabled(); fireEvent.submit(screen.getByRole('form', { name: 'Adjuntar evidencia' })); expect(service.upload).not.toHaveBeenCalled();
  });
  it('allows a valid extension even if browser MIME is empty and leaves real detection to the server', async () => {
    const selected = new File(['%PDF-1.7\n%%EOF'], 'prueba.PDF'); expect(fileProblem(selected)).toBeUndefined(); const service = evaluationService(); mount(service); await choose(selected); await save(); expect(service.upload).toHaveBeenCalled();
  });
  it('preserves selection and description for backend validation errors', async () => {
    const service = evaluationService({ upload: vi.fn().mockRejectedValue(new ApiError(400, 'VALIDACION', 'Corrige el formulario', [{ field: 'descripcion', code: 'INVALIDA', message: 'Explica el adjunto' }])) }); mount(service); const selected = await choose(); fireEvent.change(screen.getByLabelText('Descripción (opcional)'), { target: { value: 'Descripción conservada' } }); await save(); await screen.findByText('Explica el adjunto');
    expect(screen.getByLabelText('Descripción (opcional)')).toHaveValue('Descripción conservada'); expect((screen.getByLabelText('Archivo *') as HTMLInputElement).files?.[0]).toBe(selected); expect(screen.getByRole('button', { name: 'Cargar evidencia' })).toBeEnabled();
  });
  it.each([new ApiError(422, 'EVIDENCIA_BLOQUEADA', 'Bloqueado'), new ApiError(413, 'CARGA_DEMASIADO_GRANDE', 'Carga demasiado grande')])('requires replacing a rejected file ($status)', async problem => {
    const service = evaluationService({ upload: vi.fn().mockRejectedValue(problem) }); const { authorization } = mount(service); await choose(); await save(); await screen.findByText('Selecciona otro archivo antes de volver a cargar.');
    expect(screen.getByRole('button', { name: 'Cargar evidencia' })).toBeDisabled(); expect(authorization).not.toHaveBeenCalled(); await choose(new File(['%PDF-1.7\n%%EOF'], 'otra-acta.pdf')); expect(screen.getByRole('button', { name: 'Cargar evidencia' })).toBeEnabled();
  });
  it.each([new ApiError(409, 'CUOTA_EVIDENCIAS_AGOTADA', 'Cuota'), new ApiError(503, 'CUOTA_EVIDENCIAS_NO_CONFIGURADA', 'Configura cuota'), new ApiError(503, 'INSPECCION_EVIDENCIAS_NO_DISPONIBLE', 'Inspección', [], 'ref-inspeccion', 3)])('keeps a confirmed rejection recoverable without an automatic upload ($code)', async problem => {
    const service = evaluationService({ upload: vi.fn().mockRejectedValue(problem) }); mount(service); await choose(); await save(); await waitFor(() => expect(service.upload).toHaveBeenCalledTimes(1)); await waitFor(() => expect(screen.getByRole('button', { name: 'Cargar evidencia' })).toBeEnabled());
    expect(screen.queryByRole('button', { name: /Descartar formulario/ })).not.toBeInTheDocument(); if (problem.retryAfter) expect(screen.getByText(/esperar 3 segundos/)).toBeInTheDocument();
  });
  it.each([new ApiError(409, 'REVISION_DESACTUALIZADA', 'Conflicto'), new ApiError(409, 'EVALUACION_NO_EDITABLE', 'Cerrada'), new ApiError(0, 'TIEMPO_AGOTADO', 'Tiempo'), new ApiError(503, 'ALMACENAMIENTO_EVIDENCIAS_NO_DISPONIBLE', 'Almacenamiento')])('blocks another upload after conflict or uncertain outcome ($code)', async problem => {
    const service = evaluationService({ upload: vi.fn().mockRejectedValue(problem) }); const { saved } = mount(service); await choose(); await save(); await waitFor(() => expect(screen.getByRole('button', { name: 'Cargar evidencia' })).toBeDisabled()); fireEvent.submit(screen.getByRole('form', { name: 'Adjuntar evidencia' })); expect(service.upload).toHaveBeenCalledTimes(1);
    vi.spyOn(window, 'confirm').mockReturnValue(false); await userEvent.click(screen.getByRole('button', { name: /Descartar formulario/ })); expect(saved).not.toHaveBeenCalled(); vi.mocked(window.confirm).mockReturnValue(true); await userEvent.click(screen.getByRole('button', { name: /Descartar formulario/ })); expect(saved).toHaveBeenCalledWith();
  });
  it.each([401, 403])('withdraws authorization after %s', async status => {
    const { authorization } = mount(evaluationService({ upload: vi.fn().mockRejectedValue(new ApiError(status, 'DENEGADO', 'Denegado')) })); await choose(); await save(); await waitFor(() => expect(authorization).toHaveBeenCalledWith(expect.objectContaining({ status })));
  });
  it('keeps a CSRF rejection recoverable', async () => {
    const { authorization } = mount(evaluationService({ upload: vi.fn().mockRejectedValue(new ApiError(403, 'CSRF_INVALIDO', 'Reintenta explícitamente')) })); await choose(); await save(); await screen.findByText('Reintenta explícitamente'); expect(authorization).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Cargar evidencia' })).toBeEnabled();
  });
  it('blocks concurrent submissions and ignores a result after scope revocation', async () => {
    const late = deferred<UploadResult>(); const scope = new AbortController(); const service = evaluationService({ upload: vi.fn().mockReturnValue(late.promise) }); const { saved } = mount(service, scope.signal); await choose(); await save(); fireEvent.submit(screen.getByRole('form', { name: 'Adjuntar evidencia' })); expect(service.upload).toHaveBeenCalledTimes(1); scope.abort(); await act(async () => late.resolve({ evidencia: { ...evidence, descripcion: null }, revisionEvaluacion: 5 })); expect(saved).not.toHaveBeenCalled();
  });
  it('treats mismatched uploaded metadata as an uncertain result', async () => {
    const service = evaluationService({ upload: vi.fn().mockResolvedValue({ evidencia: { ...evidence, descripcion: null }, revisionEvaluacion: 9 }) }); const { saved } = mount(service); await choose(); await save(); await screen.findByText(/El resultado no se confirmó/); expect(saved).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Cargar evidencia' })).toBeDisabled();
  });
  it('hides upload for AU and non-draft evaluations', async () => {
    const view = render(wrap(<EvaluationWorkspace company={{ ...a, roles: ['AU'] }} evaluationId={evaluation.evaluacionId} service={evaluationService()} onAuthorization={vi.fn()} onPage={vi.fn()} />)); await screen.findByRole('article', { name: 'Respuesta A.1' }); expect(screen.queryByRole('button', { name: 'Adjuntar evidencia en A.1' })).not.toBeInTheDocument(); view.unmount();
    render(wrap(<EvaluationWorkspace company={a} evaluationId={evaluation.evaluacionId} service={evaluationService({ detail: vi.fn().mockResolvedValue({ ...evaluation, estado: 'EN_REVISION' }) })} onAuthorization={vi.fn()} onPage={vi.fn()} />)); await screen.findByRole('article', { name: 'Respuesta A.1' }); expect(screen.queryByRole('button', { name: 'Adjuntar evidencia en A.1' })).not.toBeInTheDocument();
  });
  it('protects cancellation and refetches the authoritative evaluation and evidence after success', async () => {
    const leave = vi.fn().mockReturnValue(false); const dirty = vi.fn(); const service = evaluationService({ detail: vi.fn().mockResolvedValueOnce(evaluation).mockResolvedValue({ ...evaluation, revision: 5 }), answers: vi.fn().mockResolvedValueOnce({ elementos: [answer], pagina: 0, tamano: 5, hayMas: false }).mockResolvedValue({ elementos: [{ ...answer, revisionEvaluacion: 5 }], pagina: 0, tamano: 5, hayMas: false }), results: vi.fn().mockResolvedValue({ ...results, revision: 4 }) });
    render(wrap(<EvaluationWorkspace company={a} evaluationId={evaluation.evaluacionId} service={service} onAuthorization={vi.fn()} onPage={vi.fn()} onDirty={dirty} onLeave={leave} />)); await userEvent.click(await screen.findByRole('button', { name: 'Adjuntar evidencia en A.1' })); await screen.findByRole('form', { name: 'Adjuntar evidencia' }); await choose(); expect(dirty).toHaveBeenCalledWith(true); await userEvent.click(screen.getByRole('button', { name: 'Cancelar y volver' })); expect(leave).toHaveBeenCalled(); expect(screen.getByRole('form', { name: 'Adjuntar evidencia' })).toBeInTheDocument();
    await save(); await screen.findByText(/Carga confirmada: acta-prueba.pdf/); await screen.findByRole('button', { name: 'Descargar acta-prueba.pdf' }); expect(service.detail).toHaveBeenCalledTimes(2); expect(service.answers).toHaveBeenCalledTimes(2); expect(service.results).toHaveBeenCalledTimes(2); expect(service.evidence).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, answer.respuestaId, 0, expect.any(AbortSignal));
  });
  it('preserves the actual multipart filename, Unicode description and revision without a manual Content-Type', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ headerName: 'X-CSRF-TOKEN', token: 'fixture-csrf' })).mockResolvedValueOnce(Response.json({ evidencia: evidence, revisionEvaluacion: 5 }, { status: 201 }));
    const service = createEvaluationService(createApiClient({ fetch: fetcher })); const selected = file(); await service.upload(a.empresaId, evaluation.evaluacionId, answer.respuestaId, { archivo: selected, revisionEsperada: 4, descripcion: 'Acta de revisión' }, new AbortController().signal);
    expect(fetcher.mock.calls[1][0]).toBe(`/api/v1/empresas/${a.empresaId}/evaluaciones/${evaluation.evaluacionId}/respuestas/${answer.respuestaId}/evidencias`); const init = fetcher.mock.calls[1][1]; const body = init?.body as FormData;
    expect((body.get('archivo') as File).name).toBe(selected.name); expect(body.get('revisionEsperada')).toBe('4'); expect(body.get('descripcion')).toBe('Acta de revisión'); expect(new Headers(init?.headers).has('Content-Type')).toBe(false); expect(new Headers(init?.headers).get('X-CSRF-TOKEN')).toBe('fixture-csrf'); expect(init?.credentials).toBe('same-origin'); expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it('allows a multipart response after 20 seconds without the former 15-second client cutoff', async () => {
    vi.useFakeTimers(); const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url, init) => {
      if (String(url).endsWith('/csrf')) return Response.json({ headerName: 'X-CSRF-TOKEN', token: 'fixture-csrf' });
      return new Promise((resolve, reject) => { init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))); setTimeout(() => resolve(Response.json({ evidencia: evidence, revisionEvaluacion: 5 }, { status: 201 })), 20000); });
    }); const service = createEvaluationService(createApiClient({ fetch: fetcher })); const pending = service.upload(a.empresaId, evaluation.evaluacionId, answer.respuestaId, { archivo: file(), revisionEsperada: 4 }, new AbortController().signal);
    await vi.advanceTimersByTimeAsync(20001); await expect(pending).resolves.toMatchObject({ revisionEvaluacion: 5 });
  });
});
