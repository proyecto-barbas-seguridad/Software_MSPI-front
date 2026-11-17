import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStyleCache, Providers } from '../../app/Providers';
import { ApiError, createApiClient } from '../../shared/api/client';
import { a, deferred } from '../access/fixtures.test-support';
import EvaluationEditor from './EvaluationEditor';
import type { Editor } from './EvaluationEditor';
import EvaluationWorkspace from './EvaluationWorkspace';
import { createEvaluationService } from './evaluations';
import type { Answer, Finding } from './evaluations';
import { answer, answers, evaluation, evaluationService, results } from './fixtures.test-support';
afterEach(() => { cleanup(); vi.restoreAllMocks(); window.history.replaceState(null, '', '/interfaz/'); });
const finding: Finding = { hallazgoId: '00000000-0000-0000-0000-000000000091', respuestaId: answer.respuestaId, hallazgo: { descripcionBrecha: 'Brecha documentada', recomendacion: 'Revisar el procedimiento' }, revisionEvaluacion: 4, creadaPor: evaluation.creadaPor, creadaEn: evaluation.creadaEn, actualizadaPor: evaluation.creadaPor, actualizadaEn: evaluation.actualizadaEn };
function wrap(children: React.ReactNode) { return <Providers mode="light" cache={createStyleCache('editor-nonce')}>{children}</Providers>; }
function mount(mode: Editor = { kind: 'answer', answer }, service = evaluationService(), scope?: AbortSignal) {
  const saved = vi.fn(), dirty = vi.fn(), pending = vi.fn(), authorization = vi.fn();
  return { ...render(wrap(<EvaluationEditor companyId={a.empresaId} mode={mode} evaluation={evaluation} service={service} scope={scope} onSaved={saved} onCancel={vi.fn()} onDirty={dirty} onPending={pending} onAuthorization={authorization} />)), saved, dirty, pending, authorization };
}
const save = () => userEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
function createService() {
  return evaluationService({ catalogs: vi.fn().mockImplementation(async (_, pagina) => ({ elementos: pagina ? [] : [{ versionId: evaluation.versionCatalogoId, nombre: 'Catálogo publicado', codigo: 'MSPI', version: '1', disponibleNuevos: true }], pagina, tamano: 5, hayMas: pagina === 0 })),
    methods: vi.fn().mockResolvedValue({ elementos: [{ versionId: evaluation.versionMetodologiaId, nombre: 'Método aprobado', codigo: 'CODIGO_DISTINTO', version: '1', identificador: 'EVALUACION_CONTROLES_V1', disponibleNuevos: true }, { versionId: a.empresaId, nombre: 'Método incompatible', identificador: 'OTRO', disponibleNuevos: true }], pagina: 0, tamano: 5, hayMas: false }),
    responsibles: vi.fn().mockResolvedValue({ elementos: [{ membresiaId: evaluation.responsableId, nombreVisible: 'Responsable local' }], pagina: 0, tamano: 5, hayMas: false }) });
}
async function fillCreate() {
  await screen.findByRole('option', { name: 'Responsable local' }); await screen.findByRole('option', { name: /Método aprobado/ });
  fireEvent.change(screen.getByLabelText('Nombre *'), { target: { value: 'Nueva evaluación' } });
  fireEvent.change(screen.getByLabelText('Fecha de evaluación *'), { target: { value: '2026-11-16' } });
  fireEvent.change(screen.getByLabelText('Alcance *'), { target: { value: 'Procesos definidos' } });
  await userEvent.selectOptions(screen.getByLabelText('Responsable *'), evaluation.responsableId);
  await userEvent.selectOptions(screen.getByLabelText('Versión de catálogo *'), evaluation.versionCatalogoId);
  await userEvent.selectOptions(screen.getByLabelText('Versión de metodología *'), evaluation.versionMetodologiaId);
}
describe('Evaluation draft writes', () => {
  it('preloads the actual zero and sends its captured evaluation revision', async () => {
    const service = evaluationService(); const { saved } = mount(undefined, service);
    expect(screen.getByLabelText('Calificación')).toHaveValue('0'); expect(screen.getByLabelText(/Fundamento/)).toHaveValue(answer.respuesta.fundamento);
    await save(); await waitFor(() => expect(saved).toHaveBeenCalled());
    expect(service.editAnswer).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, answer.respuestaId, { revisionEsperada: 4, aplicabilidad: 'APLICA', calificacion: 0, fundamento: answer.respuesta.fundamento, justificacionAplicabilidad: null }, expect.any(AbortSignal));
  });
  it('preserves pending as null and never offers no aplica for a clause', async () => {
    const service = evaluationService({ editAnswer: vi.fn().mockResolvedValue({ ...answers[3], revisionEvaluacion: 5 }) }); mount({ kind: 'answer', answer: answers[3] }, service);
    expect(screen.queryByRole('option', { name: 'No aplica' })).not.toBeInTheDocument(); expect(screen.getByLabelText('Calificación')).toHaveValue('');
    await save(); expect(service.editAnswer).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, answers[3].respuestaId, expect.objectContaining({ calificacion: null, fundamento: null }), expect.any(AbortSignal));
  });
  it('requires rationale even for zero without sending a write', async () => {
    const service = evaluationService(); mount(undefined, service); fireEvent.change(screen.getByLabelText(/Fundamento/), { target: { value: '  ' } }); await save();
    expect(await screen.findByText(/Completa los campos obligatorios/)).toBeInTheDocument(); expect(service.editAnswer).not.toHaveBeenCalled();
  });
  it('requires a control exclusion explanation and clears score when excluded', async () => {
    const service = evaluationService(); mount(undefined, service); await userEvent.selectOptions(screen.getByLabelText('Aplicabilidad'), 'NO_APLICA');
    await save(); expect(service.editAnswer).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Justificación de no aplica *'), { target: { value: 'Fuera del alcance justificado' } }); await save();
    expect(service.editAnswer).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, answer.respuestaId, expect.objectContaining({ calificacion: null, justificacionAplicabilidad: 'Fuera del alcance justificado' }), expect.any(AbortSignal));
  });
  it('saves undecided with null score, not a zero', async () => {
    const service = evaluationService(); mount(undefined, service); await userEvent.selectOptions(screen.getByLabelText('Aplicabilidad'), 'SIN_DECIDIR'); await save();
    expect(service.editAnswer).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, answer.respuestaId, expect.objectContaining({ aplicabilidad: 'SIN_DECIDIR', calificacion: null }), expect.any(AbortSignal));
  });
  it.each([new ApiError(409, 'REVISION_DESACTUALIZADA', 'Conflicto'), new ApiError(0, 'TIEMPO_AGOTADO', 'Tiempo agotado'), new ApiError(503, 'ERROR', 'No disponible')])('blocks repeat writes after conflict or uncertain result: $code', async problem => {
    const service = evaluationService({ editAnswer: vi.fn().mockRejectedValue(problem) }); const { saved } = mount(undefined, service);
    await save(); await waitFor(() => expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeDisabled()); expect(screen.getByLabelText(/Fundamento/)).toHaveValue(answer.respuesta.fundamento);
    fireEvent.submit(screen.getByRole('form', { name: 'Diligenciar respuesta' })); expect(service.editAnswer).toHaveBeenCalledTimes(1); expect(saved).not.toHaveBeenCalled();
    vi.spyOn(window, 'confirm').mockReturnValue(false); await userEvent.click(screen.getByRole('button', { name: /Descartar formulario/ })); expect(saved).not.toHaveBeenCalled();
    vi.mocked(window.confirm).mockReturnValue(true); await userEvent.click(screen.getByRole('button', { name: /Descartar formulario/ })); expect(saved).toHaveBeenCalledWith();
  });
  it('preserves buffer and identifies backend field errors for explicit retry', async () => {
    const service = evaluationService({ editAnswer: vi.fn().mockRejectedValue(new ApiError(400, 'VALIDACION', 'Corrige el formulario', [{ field: 'fundamento', code: 'INVALIDO', message: 'Explica el resultado' }])) }); mount(undefined, service);
    await save(); expect(await screen.findByText('Explica el resultado')).toBeInTheDocument(); expect(screen.getByLabelText(/Fundamento/)).toHaveAttribute('aria-invalid', 'true'); expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeEnabled();
  });
  it.each([401, 403])('withdraws on authorization loss %s', async status => {
    const { authorization } = mount(undefined, evaluationService({ editAnswer: vi.fn().mockRejectedValue(new ApiError(status, 'DENEGADO', 'Denegado')) })); await save(); await waitFor(() => expect(authorization).toHaveBeenCalled());
  });
  it('keeps CSRF rejection recoverable without withdrawing the authorized context', async () => {
    const { authorization } = mount(undefined, evaluationService({ editAnswer: vi.fn().mockRejectedValue(new ApiError(403, 'CSRF_INVALIDO', 'Actualiza la protección')) })); await save(); expect(await screen.findByText('Actualiza la protección')).toBeInTheDocument(); expect(authorization).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeEnabled();
  });
  it('ignores a late save after scope loss and prevents duplicate in-flight submission', async () => {
    const late = deferred<Answer>(); const scope = new AbortController(); const service = evaluationService({ editAnswer: vi.fn().mockReturnValue(late.promise) }); const { saved } = mount(undefined, service, scope.signal);
    await save(); fireEvent.submit(screen.getByRole('form', { name: 'Diligenciar respuesta' })); expect(service.editAnswer).toHaveBeenCalledTimes(1);
    scope.abort(); await act(async () => late.resolve({ ...answer, revisionEvaluacion: 5 })); expect(saved).not.toHaveBeenCalled();
  });
  it('creates using local membership and selected immutable version IDs, preserving choice across pages', async () => {
    const service = createService(); const { saved } = mount({ kind: 'create' }, service); await fillCreate();
    expect(screen.queryByRole('option', { name: /Método incompatible/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente en Versión de catálogo' })); await screen.findByText('No hay opciones compatibles en esta página.'); expect(screen.getByLabelText('Versión de catálogo *')).toHaveValue(evaluation.versionCatalogoId);
    await save(); await waitFor(() => expect(saved).toHaveBeenCalledWith(evaluation));
    expect(service.create).toHaveBeenCalledWith(a.empresaId, { nombre: 'Nueva evaluación', fechaEvaluacion: '2026-11-16', alcance: 'Procesos definidos', responsableId: evaluation.responsableId, versionCatalogoId: evaluation.versionCatalogoId, versionMetodologiaId: evaluation.versionMetodologiaId }, expect.any(AbortSignal));
  });
  it('does not offer blind creation retry after an uncertain result', async () => {
    const service = createService(); vi.mocked(service.create).mockRejectedValue(new ApiError(0, 'TIEMPO_AGOTADO', 'Sin confirmación')); mount({ kind: 'create' }, service); await fillCreate(); await save();
    expect(await screen.findByText(/El nombre no es único/)).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'Guardar borrador' })).toBeDisabled(); expect(service.create).toHaveBeenCalledTimes(1);
  });
  it.each([false, true])('creates/edits findings with captured evaluation revision (edit=%s)', async edit => {
    const updated = { ...finding, revisionEvaluacion: 5 }; const service = evaluationService({ createFinding: vi.fn().mockResolvedValue(updated), editFinding: vi.fn().mockResolvedValue(updated) }); const { saved } = mount({ kind: 'finding', answer, finding: edit ? finding : undefined }, service);
    if (!edit) fireEvent.change(screen.getByLabelText('Descripción de la brecha *'), { target: { value: finding.hallazgo.descripcionBrecha } });
    await save(); await waitFor(() => expect(saved).toHaveBeenCalled()); const method = edit ? service.editFinding : service.createFinding;
    expect(method).toHaveBeenCalledWith(a.empresaId, evaluation.evaluacionId, answer.respuestaId, ...(edit ? [finding.hallazgoId] : []), expect.objectContaining({ revisionEsperada: 4, descripcionBrecha: finding.hallazgo.descripcionBrecha }), expect.any(AbortSignal));
  });
  it('keeps AU read-only and reads findings only when expanded', async () => {
    const service = evaluationService({ findings: vi.fn().mockResolvedValue({ elementos: [finding], pagina: 0, tamano: 5, hayMas: false }) }); render(wrap(<EvaluationWorkspace company={{ ...a, roles: ['AU'] }} evaluationId={evaluation.evaluacionId} service={service} onAuthorization={vi.fn()} onPage={vi.fn()} />));
    await screen.findByText('Ver hallazgos de A.1'); expect(service.findings).not.toHaveBeenCalled(); expect(screen.queryByRole('button', { name: 'Diligenciar A.1' })).not.toBeInTheDocument(); await userEvent.click(screen.getByText('Ver hallazgos de A.1')); await screen.findByText(finding.hallazgo.descripcionBrecha); expect(screen.queryByRole('button', { name: 'Editar hallazgo' })).not.toBeInTheDocument();
  });
  it('blocks editing mixed revisions and non-draft states', async () => {
    const service = evaluationService({ results: vi.fn().mockResolvedValue({ ...results, revision: 5 }) }); const view = render(wrap(<EvaluationWorkspace company={a} evaluationId={evaluation.evaluacionId} service={service} onAuthorization={vi.fn()} onPage={vi.fn()} />));
    await screen.findByRole('article', { name: 'Respuesta A.1' }); expect(screen.queryByRole('button', { name: 'Diligenciar A.1' })).not.toBeInTheDocument(); view.unmount();
    render(wrap(<EvaluationWorkspace company={a} evaluationId={evaluation.evaluacionId} service={evaluationService({ detail: vi.fn().mockResolvedValue({ ...evaluation, estado: 'EN_REVISION' }) })} onAuthorization={vi.fn()} onPage={vi.fn()} />)); await screen.findByRole('article', { name: 'Respuesta A.1' }); expect(screen.queryByRole('button', { name: 'Diligenciar A.1' })).not.toBeInTheDocument();
  });
  it('guards cancellation with the workspace unsaved decision', async () => {
    const leave = vi.fn().mockReturnValue(false); const dirty = vi.fn(); render(wrap(<EvaluationWorkspace company={a} evaluationId={evaluation.evaluacionId} service={evaluationService()} onAuthorization={vi.fn()} onPage={vi.fn()} onDirty={dirty} onLeave={leave} />));
    await userEvent.click(await screen.findByRole('button', { name: 'Diligenciar A.1' })); await screen.findByRole('form', { name: 'Diligenciar respuesta' }); fireEvent.change(screen.getByLabelText(/Fundamento/), { target: { value: 'Cambio' } }); expect(dirty).toHaveBeenCalledWith(true);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar y volver' })); expect(leave).toHaveBeenCalled(); expect(screen.getByLabelText(/Fundamento/)).toHaveValue('Cambio');
    leave.mockReturnValue(true); await userEvent.click(screen.getByRole('button', { name: 'Cancelar y volver' })); await screen.findByRole('article', { name: 'Respuesta A.1' });
  });
  it('uses typed mutation paths, same-origin session and a fresh CSRF on every write', async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (url) => String(url).endsWith('/csrf') ? Response.json({ headerName: 'X-CSRF-TOKEN', token: 'fixture-csrf' }) : Response.json({ ...answer, revisionEvaluacion: 5 }));
    const service = createEvaluationService(createApiClient({ fetch: fetcher })); const signal = new AbortController().signal;
    await service.editAnswer(a.empresaId, evaluation.evaluacionId, answer.respuestaId, { revisionEsperada: 4, aplicabilidad: 'APLICA', calificacion: 0, fundamento: 'Fundamento' }, signal);
    await service.createFinding(a.empresaId, evaluation.evaluacionId, answer.respuestaId, { revisionEsperada: 5, descripcionBrecha: 'Brecha' }, signal);
    expect(fetcher.mock.calls.map(call => call[1]?.method || 'GET')).toEqual(['GET', 'PUT', 'GET', 'POST']);
    expect(fetcher.mock.calls[1][0]).toBe(`/api/v1/empresas/${a.empresaId}/evaluaciones/${evaluation.evaluacionId}/respuestas/${answer.respuestaId}`);
    expect(new Headers(fetcher.mock.calls[3][1]?.headers).get('X-CSRF-TOKEN')).toBe('fixture-csrf'); expect(fetcher.mock.calls[3][1]?.credentials).toBe('same-origin');
  });
  it('refetches authoritative detail, answers and results after saving without computing a local result', async () => {
    const service = evaluationService({ detail: vi.fn().mockResolvedValueOnce(evaluation).mockResolvedValue({ ...evaluation, revision: 5 }),
      answers: vi.fn().mockResolvedValueOnce({ elementos: [answer], pagina: 0, tamano: 5, hayMas: false }).mockResolvedValue({ elementos: [{ ...answer, revisionEvaluacion: 5, respuesta: { ...answer.respuesta, calificacion: 20 } }], pagina: 0, tamano: 5, hayMas: false }),
      results: vi.fn().mockResolvedValueOnce(results).mockResolvedValue({ ...results, revision: 5 }) });
    render(wrap(<EvaluationWorkspace company={a} evaluationId={evaluation.evaluacionId} service={service} onAuthorization={vi.fn()} onPage={vi.fn()} />));
    await userEvent.click(await screen.findByRole('button', { name: 'Diligenciar A.1' })); await screen.findByLabelText('Calificación'); await save();
    await screen.findByText('20 / 100'); expect(service.detail).toHaveBeenCalledTimes(2); expect(service.results).toHaveBeenCalledTimes(2); expect(service.answers).toHaveBeenCalledTimes(2);
  });
  it('disables editing findings from a different evaluation revision', async () => {
    const service = evaluationService({ findings: vi.fn().mockResolvedValue({ elementos: [{ ...finding, revisionEvaluacion: 5 }], pagina: 0, tamano: 5, hayMas: false }) });
    render(wrap(<EvaluationWorkspace company={a} evaluationId={evaluation.evaluacionId} service={service} onAuthorization={vi.fn()} onPage={vi.fn()} />));
    await userEvent.click(await screen.findByText('Ver hallazgos de A.1')); expect(await screen.findByRole('button', { name: 'Editar hallazgo' })).toBeDisabled(); expect(screen.getByText(/El hallazgo pertenece a otra revisión/)).toBeInTheDocument();
  });
  it('uses server pagination for findings rather than treating a full page as the whole collection', async () => {
    const service = evaluationService({ findings: vi.fn().mockImplementation(async (_, __, ___, pagina) => ({ elementos: pagina ? [] : [finding], pagina, tamano: 5, hayMas: pagina === 0 })) });
    render(wrap(<EvaluationWorkspace company={a} evaluationId={evaluation.evaluacionId} service={service} onAuthorization={vi.fn()} onPage={vi.fn()} />));
    await userEvent.click(await screen.findByText('Ver hallazgos de A.1')); await userEvent.click(await screen.findByRole('button', { name: 'Siguiente en hallazgos' })); await screen.findByText('No hay hallazgos en esta página.');
    expect(service.findings).toHaveBeenLastCalledWith(a.empresaId, evaluation.evaluacionId, answer.respuestaId, 1, expect.any(AbortSignal));
  });
  it('withdraws access if a draft reference selector loses authorization', async () => {
    const service = evaluationService({ responsibles: vi.fn().mockRejectedValue(new ApiError(403, 'DENEGADO', 'Acceso retirado')) }); const { authorization } = mount({ kind: 'create' }, service);
    await waitFor(() => expect(authorization).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }))); expect(service.create).not.toHaveBeenCalled();
  });
  it('keeps missing references unselected and never invents a responsible', async () => {
    const service = evaluationService(); mount({ kind: 'create' }, service); await screen.findAllByText('No hay opciones compatibles en esta página.');
    expect(screen.getByLabelText('Responsable *')).toHaveValue(''); fireEvent.submit(screen.getByRole('form', { name: 'Crear evaluación' }));
    await screen.findByText(/Completa los campos obligatorios/); expect(service.create).not.toHaveBeenCalled();
  });

});
