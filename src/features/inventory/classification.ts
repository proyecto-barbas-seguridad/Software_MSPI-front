import { ApiError } from '../../shared/api/client';
import { validateAsset, validValuations, validateValuation } from './inventory';
import type { Asset, InventoryService, Valuation, ValuationEntries } from './inventory';

const empty: ValuationEntries = { confidencialidad: null, integridad: null, disponibilidad: null, fundamento: null,
  contieneDatosPersonales: null, contieneDatosMenores: null, tiposDatosPersonales: [], finalidadTratamiento: null, autorizacionTratamiento: null, justificacionNoAplica: null };
const invalid = () => new ApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos validar la clasificación recibida.');
export function normalizeEntries(input: ValuationEntries): ValuationEntries {
  const personal = input.contieneDatosPersonales === true;
  const text = (value?: string | null) => value?.trim() || null;
  return { confidencialidad: input.confidencialidad ?? null, integridad: input.integridad ?? null, disponibilidad: input.disponibilidad ?? null,
    fundamento: text(input.fundamento), contieneDatosPersonales: input.contieneDatosPersonales ?? null, contieneDatosMenores: personal ? input.contieneDatosMenores ?? null : null,
    tiposDatosPersonales: personal ? [...(input.tiposDatosPersonales || [])] : [], finalidadTratamiento: personal ? text(input.finalidadTratamiento) : null,
    autorizacionTratamiento: personal ? input.autorizacionTratamiento ?? null : null,
    justificacionNoAplica: personal && input.autorizacionTratamiento === 'NO_APLICA' ? text(input.justificacionNoAplica) : null };
}
export interface ClassificationState {
  status: 'loading' | 'ready' | 'error' | 'confirmed'; asset?: Asset; source?: Valuation; draft?: Valuation;
  entries: ValuationEntries; reason: string; dirty: boolean; pending: boolean; blocked: boolean; error?: ApiError; notice?: string;
}
export class ClassificationStore {
  private state: ClassificationState = { status: 'loading', entries: { ...empty }, reason: '', dirty: false, pending: false, blocked: false };
  private listeners = new Set<() => void>();
  private controller?: AbortController;
  private generation = 0;
  constructor(private companyId: string, private assetId: string, private service: InventoryService,
    private onAuthorization: (error: ApiError) => void, private onDirty: (dirty: boolean) => void, private onPending: (pending: boolean) => void) {}
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private set(state: ClassificationState) {
    this.state = state; this.onDirty(state.dirty || state.pending); this.onPending(state.pending); this.listeners.forEach(fn => fn());
  }
  private task() {
    this.controller?.abort(); const controller = this.controller = new AbortController(); const version = ++this.generation;
    return { signal: controller.signal, current: () => version === this.generation && !controller.signal.aborted };
  }
  dispose() { ++this.generation; this.controller?.abort(); this.onDirty(false); this.onPending(false); }
  private error(error: unknown, writing: boolean) {
    const problem = error instanceof ApiError ? error : invalid();
    if (problem.status === 401 || (problem.status === 403 && problem.code !== 'CSRF_INVALIDO')) {
      this.set({ status: 'error', entries: { ...empty }, reason: '', dirty: false, pending: false, blocked: true, error: problem });
      this.onAuthorization(problem); return;
    }
    this.set({ ...this.state, status: this.state.asset ? 'ready' : 'error', pending: false, error: problem,
      blocked: (writing && (problem.status === 0 || problem.status >= 500)) || ['REVISION_DESACTUALIZADA', 'VALORACION_CONFIRMADA', 'CLASIFICACION_PENDIENTE_EXISTENTE', 'CLASIFICACION_ORIGEN_MODIFICADA', 'REGISTRO_ARCHIVADO', 'ESTADO_INCOMPATIBLE'].includes(problem.code) });
  }
  load = async () => {
    const task = this.task();
    this.set({ status: 'loading', entries: { ...empty }, reason: '', dirty: false, pending: false, blocked: false });
    try {
      const asset = validateAsset(await this.service.asset(this.companyId, this.assetId, task.signal), this.assetId);
      if (!task.current()) return;
      if (asset.estado !== 'ACTIVO') throw new ApiError(409, 'REGISTRO_ARCHIVADO', 'El activo está archivado. Su clasificación solo puede consultarse.');
      const page = validValuations(await this.service.valuations(this.companyId, this.assetId, 0, task.signal), 0, this.assetId);
      if (!task.current()) return;
      const pending = page.elementos.filter(value => value.estado === 'PENDIENTE'); const current = page.elementos.filter(value => value.vigente);
      if (pending.length > 1 || current.length > 1 || (asset.estadoClasificacion === 'COMPLETO' && !current.length)) throw invalid();
      let draft: Valuation | undefined; let source = current[0];
      if (pending[0]) {
        draft = validateValuation(await this.service.valuation(this.companyId, this.assetId, pending[0].valoracionId, task.signal), this.assetId, pending[0].valoracionId);
        if (draft.estado !== 'PENDIENTE') throw new ApiError(409, 'VALORACION_CONFIRMADA', 'La versión cambió. Vuelve a consultar.');
      } else if (source) {
        source = validateValuation(await this.service.valuation(this.companyId, this.assetId, source.valoracionId, task.signal), this.assetId, source.valoracionId);
        if (!source.vigente || source.estado !== 'COMPLETO') throw invalid();
      }
      if (!task.current()) return;
      const seed = draft || source;
      this.set({ status: 'ready', asset, source, draft, entries: normalizeEntries(seed?.entradas || empty), reason: draft?.motivoRevision || '', dirty: false, pending: false, blocked: false });
    } catch (error) { if (task.current()) this.error(error, false); }
  };
  change = (entries: ValuationEntries) => { if (!this.state.pending && this.state.status === 'ready') this.set({ ...this.state, entries, dirty: true, notice: undefined }); };
  reason = (reason: string) => { if (!this.state.pending && !this.state.draft) this.set({ ...this.state, reason, dirty: true }); };
  save = async () => {
    if (this.state.pending || this.state.blocked || this.state.status !== 'ready') return;
    const previous = this.state;
    if (!previous.draft && previous.source && !previous.reason.trim()) {
      this.error(new ApiError(400, 'MOTIVO_REQUERIDO', 'Indica el motivo para revisar la clasificación vigente.', [{ field: 'motivoRevision', code: 'REQUERIDO', message: 'Indica el motivo de revisión.' }]), false); return;
    }
    const task = this.task(); this.set({ ...previous, pending: true, error: undefined, notice: undefined });
    let attempted = false;
    try {
      const entradas = normalizeEntries(previous.entries);
      if (!previous.draft) {
        const page = validValuations(await this.service.valuations(this.companyId, this.assetId, 0, task.signal), 0, this.assetId);
        if (!task.current()) return;
        if (page.elementos.some(value => value.estado === 'PENDIENTE')) throw new ApiError(409, 'CLASIFICACION_PENDIENTE_EXISTENTE', 'Ya existe un borrador. Consulta el estado actual para continuarlo.');
        if (page.elementos.find(value => value.vigente)?.valoracionId !== previous.source?.valoracionId)
          throw new ApiError(409, 'CLASIFICACION_ORIGEN_MODIFICADA', 'Cambió la versión vigente que originó este formulario. Consulta el estado actual antes de crear la revisión.');
      }
      attempted = true;
      const response = previous.draft
        ? await this.service.editValuation(this.companyId, this.assetId, previous.draft.valoracionId, { revisionEsperada: previous.draft.revision, entradas }, task.signal)
        : await this.service.startValuation(this.companyId, this.assetId, { entradas, motivoRevision: previous.reason.trim() || null }, task.signal);
      const draft = validateValuation(response, this.assetId, previous.draft?.valoracionId);
      if (draft.estado !== 'PENDIENTE' || draft.vigente) throw invalid();
      if (task.current()) this.set({ ...previous, draft, entries: normalizeEntries(draft.entradas), reason: draft.motivoRevision || '', dirty: false, pending: false, blocked: false, error: undefined, notice: 'Borrador guardado. La clasificación vigente se conserva hasta confirmar esta versión.' });
    } catch (error) { if (task.current()) this.error(error, attempted); }
  };
  confirm = async () => {
    const previous = this.state;
    if (previous.pending || previous.blocked || previous.dirty || !previous.draft || previous.status !== 'ready') return;
    const task = this.task(); this.set({ ...previous, pending: true, error: undefined, notice: undefined });
    try {
      const response = await this.service.confirmValuation(this.companyId, this.assetId, previous.draft.valoracionId, { revisionEsperada: previous.draft.revision }, task.signal);
      const draft = validateValuation(response, this.assetId, previous.draft.valoracionId);
      if (draft.estado !== 'COMPLETO' || !draft.vigente || draft.criticidad === null || draft.nivel === null) throw invalid();
      if (task.current()) this.set({ ...previous, status: 'confirmed', draft, entries: normalizeEntries(draft.entradas), dirty: false, pending: false, blocked: false, error: undefined, notice: 'Clasificación confirmada por el servidor.' });
    } catch (error) { if (task.current()) this.error(error, true); }
  };
}
