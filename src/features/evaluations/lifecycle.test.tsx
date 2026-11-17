import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Providers, createStyleCache } from '../../app/Providers';
import { ApiError, createApiClient } from '../../shared/api/client';
import { a, deferred } from '../access/fixtures.test-support';
import Lifecycle, { ClosureView } from './EvaluationLifecycle';
import type { LifecycleMode } from './EvaluationLifecycle';
import EvaluationWorkspace from './EvaluationWorkspace';
import { createEvaluationService, validateClosure } from './evaluations';
import type { Answer, Closure, Evaluation } from './evaluations';
import { answer, answers, evaluation, evaluationService, evidence, results } from './fixtures.test-support';
const closed: Evaluation = { ...evaluation, estado: 'CERRADA', cerradaPor: evaluation.creadaPor, cerradaEn: evaluation.actualizadaEn };
const closure: Closure = { evaluacionId: closed.evaluacionId, versionCatalogoId: closed.versionCatalogoId, versionMetodologiaId: closed.versionMetodologiaId, cerradaPor: closed.cerradaPor!, cerradaEn: closed.cerradaEn!,
  instantanea: { politica: 'F1-1_EVIDENCIA_V1', resultados: { ...results, controlesGlobal: { total: 3, aplicables: 2, evaluados: 2, pendientes: 0, sinDecidir: 0, noAplican: 1, puntaje: 0, avance: 100, estado: 'CALCULADO' }, clausulas: [{ grupo: 'CLAUSULA_4', resultado: { total: 1, aplicables: 1, evaluados: 1, pendientes: 0, sinDecidir: 0, noAplican: 0, puntaje: 0, avance: 100, estado: 'CALCULADO' } }] }, evidencias: { [answer.respuestaId]: { evidenciaId: evidence.evidenciaId, evaluacionOrigenId: evaluation.evaluacionId, respuestaOrigenId: answer.respuestaId, sha256: 'a'.repeat(64) } } } };
const correction: Evaluation = { ...evaluation, evaluacionId: '00000000-0000-0000-0000-000000000092', evaluacionAnteriorId: evaluation.evaluacionId, revision: 0 };
beforeEach(() => { vi.spyOn(window, 'confirm').mockReturnValue(true); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.history.replaceState(null, '', '/interfaz/'); });
function wrap(children: React.ReactNode) { return <Providers mode="light" cache={createStyleCache('lifecycle-nonce')}>{children}</Providers>; }
function mount(mode: LifecycleMode = { kind: 'submit' }, service = evaluationService(), initial: Evaluation = evaluation, scope?: AbortSignal) {
  const saved = vi.fn(), dirty = vi.fn(), pending = vi.fn(), authorization = vi.fn();
  return { ...render(wrap(<Lifecycle companyId={a.empresaId} evaluation={initial} mode={mode} service={service} scope={scope} onSaved={saved} onCancel={vi.fn()} onDirty={dirty} onPending={pending} onAuthorization={authorization} />)), saved, dirty, pending, authorization };
}
async function selectProof(code = 'A.1') {
  await userEvent.click(await screen.findByRole('button', { name: 'Elegir adjunto de ' + code }));
  await screen.findByRole('option', { name: /acta-prueba.pdf/ }); await userEvent.selectOptions(screen.getByLabelText('Adjunto para ' + code), evidence.evidenciaId);
}
const submit = (name = 'Enviar a revisión') => userEvent.click(screen.getByRole('button', { name }));
describe('Evaluation lifecycle', () => {
  it('submits explicit evidence selections and the captured revision with no implicit attachment', async () => {
    const service = evaluationService(); const { saved, dirty } = mount(undefined, service);
    await screen.findByRole('button', { name: 'Elegir adjunto de A.1' }); expect(service.evidence).not.toHaveBeenCalled(); expect(screen.getAllByText('Adjunto seleccionado: Ninguno').length).toBeGreaterThan(0);
    await selectProof(); await submit(); await waitFor(() => expect(saved).toHaveBeenCalledWith(undefined));
    expect(dirty).toHaveBeenCalledWith(true); expect(service.submit).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, { revisionEsperada: 4, evidencias: { [answer.respuestaId]: evidence.evidenciaId } }, expect.any(AbortSignal));
  });
  it('allows a zero without selecting evidence and lets the backend validate the entire evaluation', async () => {
    const service = evaluationService(); mount(undefined, service); await screen.findByRole('button', { name: 'Elegir adjunto de A.1' }); await submit();
    expect(service.submit).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, { revisionEsperada: 4, evidencias: {} }, expect.any(AbortSignal));
  });
  it('keeps selected evidence across response pages', async () => {
    const service = evaluationService({ answers: vi.fn().mockImplementation(async (_, __, query) => ({ elementos: query.pagina ? [] : [answer], pagina: query.pagina, tamano: 5, hayMas: query.pagina === 0 })) }); mount(undefined, service);
    await selectProof(); await userEvent.click(screen.getByRole('button', { name: 'Página siguiente de respuestas' })); await screen.findByText('No hay respuestas en esta página.'); await submit();
    expect(service.submit).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, expect.objectContaining({ evidencias: { [answer.respuestaId]: evidence.evidenciaId } }), expect.any(AbortSignal));
  });
  it('paginates attachments and retains the selected label when its page changes', async () => {
    const service = evaluationService({ evidence: vi.fn().mockImplementation(async (_, __, ___, pagina) => ({ elementos: pagina ? [] : [evidence], pagina, tamano: 5, hayMas: pagina === 0 })) }); mount(undefined, service);
    await selectProof(); await userEvent.click(screen.getByRole('button', { name: 'Adjuntos siguientes de A.1' })); await screen.findByText('No hay adjuntos en esta página.'); expect(screen.getByLabelText('Adjunto para A.1')).toHaveValue(evidence.evidenciaId);
    await userEvent.selectOptions(screen.getByLabelText('Adjunto para A.1'), ''); await submit(); expect(service.submit).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, expect.objectContaining({ evidencias: {} }), expect.any(AbortSignal));
  });
  it('does not allow choosing pending or failed inspection attachments', async () => {
    mount(undefined, evaluationService({ evidence: vi.fn().mockResolvedValue({ elementos: [{ ...evidence, estadoInspeccion: 'PENDIENTE' }], pagina: 0, tamano: 5, hayMas: false }) }));
    await userEvent.click(await screen.findByRole('button', { name: 'Elegir adjunto de A.1' })); expect(await screen.findByRole('option', { name: /Inspección pendiente/ })).toBeDisabled();
  });
  it('shows backend incompleteness fields even from other pages and preserves selections for explicit retry', async () => {
    const service = evaluationService({ submit: vi.fn().mockRejectedValue(new ApiError(409, 'EVALUACION_INCOMPLETA', 'Faltan requisitos', [
      { field: `respuestas.${answer.respuestaId}.evidenciaId`, code: 'EVIDENCIA_NO_VALIDA', message: 'Elige otro adjunto' }, { field: `respuestas.${answers[2].respuestaId}.aplicabilidad`, code: 'PENDIENTE', message: 'Resuelve aplicabilidad' }])) }); mount(undefined, service);
    await selectProof(); await submit(); expect(await screen.findByText(/Respuesta A.1 · evidenciaId: Elige otro adjunto/)).toBeInTheDocument(); expect(screen.getByText(/Respuesta A.3 · aplicabilidad: Resuelve aplicabilidad/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar a revisión' })).toBeEnabled(); expect(screen.getByLabelText('Adjunto para A.1')).toHaveValue(evidence.evidenciaId);
  });
  it('returns to draft only with a nonblank reason and its original revision', async () => {
    const service = evaluationService(); const { saved } = mount({ kind: 'return' }, service, { ...evaluation, estado: 'EN_REVISION' });
    fireEvent.change(screen.getByLabelText('Motivo *'), { target: { value: '   ' } }); await submit('Devolver a borrador'); expect(service.returnDraft).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Motivo *'), { target: { value: 'Completar los fundamentos' } }); await submit('Devolver a borrador'); await waitFor(() => expect(saved).toHaveBeenCalled());
    expect(service.returnDraft).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, { revisionEsperada: 4, motivo: 'Completar los fundamentos' }, expect.any(AbortSignal));
  });
  it('closes after explicit confirmation and reselecting evidence in review', async () => {
    const service = evaluationService({ close: vi.fn().mockResolvedValue({ ...closed, revision: 5 }) }); const { saved } = mount({ kind: 'close' }, service, { ...evaluation, estado: 'EN_REVISION' });
    await selectProof(); vi.mocked(window.confirm).mockReturnValue(false); await submit('Cerrar evaluación'); expect(service.close).not.toHaveBeenCalled();
    vi.mocked(window.confirm).mockReturnValue(true); await submit('Cerrar evaluación'); await waitFor(() => expect(saved).toHaveBeenCalled()); expect(window.confirm).toHaveBeenLastCalledWith(expect.stringContaining('inmutable'));
    expect(service.close).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, expect.objectContaining({ revisionEsperada: 4, evidencias: { [answer.respuestaId]: evidence.evidenciaId } }), expect.any(AbortSignal));
  });
  it('creates a linked correction with a selected local responsible while keeping the original closed', async () => {
    const service = evaluationService({ correct: vi.fn().mockResolvedValue(correction), responsibles: vi.fn().mockResolvedValue({ elementos: [{ membresiaId: evaluation.responsableId, nombreVisible: 'Responsable local' }], pagina: 0, tamano: 5, hayMas: false }) }); const { saved } = mount({ kind: 'correct' }, service, closed);
    await screen.findByRole('option', { name: 'Responsable local' }); expect(screen.getByLabelText('Responsable *')).toHaveValue('');
    fireEvent.change(screen.getByLabelText('Motivo *'), { target: { value: 'Corregir el diagnóstico' } }); await userEvent.selectOptions(screen.getByLabelText('Responsable *'), evaluation.responsableId); await submit('Crear corrección vinculada');
    await waitFor(() => expect(saved).toHaveBeenCalledWith(correction)); expect(service.correct).toHaveBeenCalledWith(a.empresaId, closed.evaluacionId, { revisionEsperada: 4, motivo: 'Corregir el diagnóstico', responsableId: evaluation.responsableId }, expect.any(AbortSignal)); expect(closed.estado).toBe('CERRADA');
  });
  it('confirms inherited values with their captured revision and no answer overwrite', async () => {
    const service = evaluationService(); const { saved } = mount({ kind: 'confirm', answer: answers[2] }, service);
    await submit('Confirmar respuesta heredada'); await waitFor(() => expect(saved).toHaveBeenCalled()); expect(service.confirmInherited).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, answers[2].respuestaId, 4, expect.any(AbortSignal)); expect(service.editAnswer).not.toHaveBeenCalled();
  });
  it('offers inherited evidence only from the validated previous closure, without preselecting it', async () => {
    const inherited = { ...answer, respuestaAnteriorId: answer.respuestaId }; const initial = { ...correction, revision: 4 }; const service = evaluationService({ answers: vi.fn().mockResolvedValue({ elementos: [inherited], pagina: 0, tamano: 5, hayMas: false }), closure: vi.fn().mockResolvedValue(closure), evidence: vi.fn().mockResolvedValue({ elementos: [], pagina: 0, tamano: 5, hayMas: false }) }); mount(undefined, service, initial);
    await userEvent.click(await screen.findByRole('button', { name: 'Elegir adjunto de A.1' })); await screen.findByRole('option', { name: /Adjunto del cierre anterior/ }); expect(screen.getByLabelText('Adjunto para A.1')).toHaveValue(''); await userEvent.selectOptions(screen.getByLabelText('Adjunto para A.1'), evidence.evidenciaId); await submit();
    expect(service.submit).toHaveBeenCalledWith(a.empresaId, correction.evaluacionId, expect.objectContaining({ evidencias: { [answer.respuestaId]: evidence.evidenciaId } }), expect.any(AbortSignal));
  });
  it.each(['REVISION_DESACTUALIZADA', 'POLITICA_EVALUACION_NO_DISPONIBLE', 'CORRECCION_EXISTENTE', 'ESTADO_EVALUACION_INCOMPATIBLE'])('blocks conflict %s without automatic retry', async code => {
    const service = evaluationService({ returnDraft: vi.fn().mockRejectedValue(new ApiError(409, code, 'Consulta su estado')) }); const { saved } = mount({ kind: 'return' }, service, { ...evaluation, estado: 'EN_REVISION' }); fireEvent.change(screen.getByLabelText('Motivo *'), { target: { value: 'Motivo' } }); await submit('Devolver a borrador');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Devolver a borrador' })).toBeDisabled()); fireEvent.submit(screen.getByRole('form', { name: 'Devolver a borrador' })); expect(service.returnDraft).toHaveBeenCalledTimes(1); expect(saved).not.toHaveBeenCalled();
    vi.mocked(window.confirm).mockReturnValue(false); await userEvent.click(screen.getByRole('button', { name: /Descartar formulario/ })); expect(saved).not.toHaveBeenCalled(); vi.mocked(window.confirm).mockReturnValue(true); await userEvent.click(screen.getByRole('button', { name: /Descartar formulario/ })); expect(saved).toHaveBeenCalledWith();
  });
  it.each([0, 503])('blocks an uncertain result (%s) with no blind retry', async status => {
    const service = evaluationService({ confirmInherited: vi.fn().mockRejectedValue(new ApiError(status, 'ERROR', 'Sin confirmación')) }); mount({ kind: 'confirm', answer: answers[2] }, service); await submit('Confirmar respuesta heredada'); await screen.findByText(/El resultado no se confirmó/);
    expect(screen.getByRole('button', { name: 'Confirmar respuesta heredada' })).toBeDisabled(); expect(service.confirmInherited).toHaveBeenCalledTimes(1);
  });
  it.each([401, 403])('withdraws the context after mutation authorization loss %s', async status => {
    const { authorization } = mount({ kind: 'confirm', answer: answers[2] }, evaluationService({ confirmInherited: vi.fn().mockRejectedValue(new ApiError(status, 'DENEGADO', 'Denegado')) })); await submit('Confirmar respuesta heredada'); await waitFor(() => expect(authorization).toHaveBeenCalledWith(expect.objectContaining({ status })));
  });
  it('keeps CSRF failures recoverable and retains the local reason', async () => {
    const { authorization } = mount({ kind: 'return' }, evaluationService({ returnDraft: vi.fn().mockRejectedValue(new ApiError(403, 'CSRF_INVALIDO', 'Reintenta explícitamente')) }), { ...evaluation, estado: 'EN_REVISION' }); fireEvent.change(screen.getByLabelText('Motivo *'), { target: { value: 'Motivo conservado' } }); await submit('Devolver a borrador'); await screen.findByText('Reintenta explícitamente');
    expect(screen.getByLabelText('Motivo *')).toHaveValue('Motivo conservado'); expect(screen.getByRole('button', { name: 'Devolver a borrador' })).toBeEnabled(); expect(authorization).not.toHaveBeenCalled();
  });
  it('disables transition on a different answer revision rather than rebasing selections', async () => {
    const service = evaluationService({ answers: vi.fn().mockResolvedValue({ elementos: [{ ...answer, revisionEvaluacion: 5 }], pagina: 0, tamano: 5, hayMas: false }) }); mount(undefined, service); await screen.findByText(/La evaluación cambió/); expect(screen.getByRole('button', { name: 'Enviar a revisión' })).toBeDisabled(); expect(service.submit).not.toHaveBeenCalled();
  });
  it('ignores late results when route scope is revoked and prevents duplicate submission', async () => {
    const late = deferred<Answer>(); const scope = new AbortController(); const service = evaluationService({ confirmInherited: vi.fn().mockReturnValue(late.promise) }); const { saved } = mount({ kind: 'confirm', answer: answers[2] }, service, evaluation, scope.signal);
    await submit('Confirmar respuesta heredada'); fireEvent.submit(screen.getByRole('form', { name: 'Confirmar respuesta heredada' })); expect(service.confirmInherited).toHaveBeenCalledTimes(1); scope.abort(); await act(async () => late.resolve({ ...answers[2], revisionEvaluacion: 5, heredadaConfirmada: true })); expect(saved).not.toHaveBeenCalled();
  });
  it('rejects an unexpected transition response as an uncertain write', async () => {
    mount(undefined, evaluationService({ submit: vi.fn().mockResolvedValue({ ...evaluation, revision: 5 }) })); await screen.findByRole('button', { name: 'Elegir adjunto de A.1' }); await submit(); await screen.findByText(/El resultado no se confirmó/); expect(screen.getByRole('button', { name: 'Enviar a revisión' })).toBeDisabled();
  });
  it('renders immutable closure results and allows AU to read them without lifecycle controls', async () => {
    const service = evaluationService({ detail: vi.fn().mockResolvedValue(closed), closure: vi.fn().mockResolvedValue(closure) }); render(wrap(<EvaluationWorkspace company={{ ...a, roles: ['AU'] }} evaluationId={closed.evaluacionId} service={service} onAuthorization={vi.fn()} onPage={vi.fn()} />));
    await screen.findByText('Cierre conservado'); await screen.findByText(/Instantánea inmutable/); expect(screen.queryByRole('button', { name: 'Crear corrección vinculada' })).not.toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Cerrar evaluación' })).not.toBeInTheDocument(); expect(service.closure).toHaveBeenCalledWith(a.empresaId, closed.evaluacionId, expect.any(AbortSignal));
  });
  it('withdraws authorization on closure read failure and rejects malformed closure metadata', async () => {
    const authorization = vi.fn(); render(wrap(<ClosureView company={a.empresaId} evaluation={closed} service={evaluationService({ closure: vi.fn().mockRejectedValue(new ApiError(403, 'DENEGADO', 'Denegado')) })} onAuthorization={authorization} zone={a.zonaHoraria} />)); await waitFor(() => expect(authorization).toHaveBeenCalled());
    expect(() => validateClosure({ ...closure, versionCatalogoId: a.empresaId }, closed.evaluacionId, closed)).toThrow(ApiError); expect(() => validateClosure({ ...closure, instantanea: { ...closure.instantanea, resultados: { ...results, revision: 5 } } }, closed.evaluacionId, closed)).toThrow(ApiError);
    expect(() => validateClosure({ ...closure, instantanea: { ...closure.instantanea, evidencias: { [answer.respuestaId]: { ...closure.instantanea.evidencias[answer.respuestaId], sha256: 'invalid' } } } }, closed.evaluacionId)).toThrow(ApiError);
  });
  it('shows only valid state transitions to GS, including the evaluation author', async () => {
    const service = evaluationService(); const view = render(wrap(<EvaluationWorkspace company={a} evaluationId={evaluation.evaluacionId} service={service} onAuthorization={vi.fn()} onPage={vi.fn()} />)); await screen.findByRole('button', { name: 'Enviar a revisión' }); expect(screen.queryByRole('button', { name: 'Cerrar evaluación' })).not.toBeInTheDocument(); await screen.findByRole('button', { name: 'Confirmar heredada A.3' }); view.unmount();
    render(wrap(<EvaluationWorkspace company={a} evaluationId={evaluation.evaluacionId} service={evaluationService({ detail: vi.fn().mockResolvedValue({ ...evaluation, estado: 'EN_REVISION' }) })} onAuthorization={vi.fn()} onPage={vi.fn()} />)); await screen.findByRole('button', { name: 'Cerrar evaluación' }); expect(screen.getByRole('button', { name: 'Devolver a borrador' })).toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Enviar a revisión' })).not.toBeInTheDocument(); expect(screen.queryByRole('button', { name: 'Confirmar heredada A.3' })).not.toBeInTheDocument();
  });
  it('respects unsaved cancellation and refetches authoritative state after a transition', async () => {
    const leave = vi.fn().mockReturnValue(false); const dirty = vi.fn(); const service = evaluationService({ detail: vi.fn().mockResolvedValueOnce({ ...evaluation, estado: 'EN_REVISION' }).mockResolvedValue({ ...evaluation, revision: 5 }) }); render(wrap(<EvaluationWorkspace company={a} evaluationId={evaluation.evaluacionId} service={service} onAuthorization={vi.fn()} onPage={vi.fn()} onDirty={dirty} onLeave={leave} />));
    await userEvent.click(await screen.findByRole('button', { name: 'Devolver a borrador' })); await screen.findByLabelText('Motivo *'); fireEvent.change(screen.getByLabelText('Motivo *'), { target: { value: 'Completar respuestas' } }); expect(dirty).toHaveBeenCalledWith(true); await userEvent.click(screen.getByRole('button', { name: 'Cancelar y volver' })); expect(leave).toHaveBeenCalled(); expect(screen.getByLabelText('Motivo *')).toHaveValue('Completar respuestas');
    await submit('Devolver a borrador'); await screen.findByText(/Estado de evaluación consultado de nuevo/); expect(service.detail).toHaveBeenCalledTimes(2); expect(service.results).toHaveBeenCalledTimes(2);
  });
  it('uses only contracted lifecycle endpoints, same-origin session and fresh CSRF on each mutation', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async url => String(url).endsWith('/csrf') ? Response.json({ headerName: 'X-CSRF-TOKEN', token: 'fixture-csrf' }) : Response.json(evaluation));
    const service = createEvaluationService(createApiClient({ fetch: fetcher })); const signal = new AbortController().signal;
    await service.submit(a.empresaId, evaluation.evaluacionId, { revisionEsperada: 4, evidencias: {} }, signal); await service.returnDraft(a.empresaId, evaluation.evaluacionId, { revisionEsperada: 4, motivo: 'Motivo' }, signal); await service.close(a.empresaId, evaluation.evaluacionId, { revisionEsperada: 4, evidencias: {} }, signal); await service.correct(a.empresaId, evaluation.evaluacionId, { revisionEsperada: 4, motivo: 'Motivo', responsableId: evaluation.responsableId }, signal); await service.confirmInherited(a.empresaId, evaluation.evaluacionId, answer.respuestaId, 4, signal); await service.closure(a.empresaId, evaluation.evaluacionId, signal);
    expect(fetcher.mock.calls.filter(call => String(call[0]).endsWith('/csrf'))).toHaveLength(5); const writes = fetcher.mock.calls.filter(call => call[1]?.method === 'POST'); expect(writes.map(call => String(call[0]).split('/').at(-1))).toEqual(['enviar-revision', 'devolver', 'cerrar', 'correcciones', 'confirmar-heredada']);
    for (const call of writes) { expect(call[1]?.credentials).toBe('same-origin'); expect(new Headers(call[1]?.headers).get('X-CSRF-TOKEN')).toBe('fixture-csrf'); expect(JSON.parse(String(call[1]?.body)).revisionEsperada).toBe(4); }
    expect(fetcher.mock.calls.at(-1)?.[0]).toBe(`/api/v1/empresas/${a.empresaId}/evaluaciones/${evaluation.evaluacionId}/cierre`);
  });
});
