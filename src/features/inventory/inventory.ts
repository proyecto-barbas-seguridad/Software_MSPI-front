import { api, ApiError } from '../../shared/api/client';
import type { components, operations } from '../../shared/api/generated/schema';

export type Asset = components['schemas']['InventoryAsset'];
export type AssetPage = components['schemas']['AssetInventoryPage'];
export type ValuationPage = components['schemas']['AssetValuationPage'];
export type HistoryPage = components['schemas']['InventoryHistoryPage'];
export type Process = components['schemas']['BusinessProcess'];
export type Responsible = components['schemas']['BusinessResponsible'];
export type AssetQuery = NonNullable<operations['listarActivos']['parameters']['query']>;
export type NewAsset = components['schemas']['CreateInventoryAsset'];
export type EditAsset = components['schemas']['EditInventoryAsset'];
export type RestoreAsset = components['schemas']['RestoreInventoryAsset'];
export const assetTypes = { INFORMACION: 'Información', HARDWARE: 'Hardware', SOFTWARE: 'Software', SERVICIO: 'Servicio', RECURSO_HUMANO: 'Recurso humano', INSTALACION: 'Instalación', RED: 'Red' };
export const assetStates = { ACTIVO: 'Activo', ARCHIVADO: 'Archivado' };
export const levels = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' };
export const personalTypes = { IDENTIFICACION: 'Identificación', CONTACTO: 'Contacto', FINANCIEROS: 'Financieros', SALUD: 'Salud', BIOMETRICOS: 'Biométricos', OTROS: 'Otros' };
export const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const count = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const invalid = () => new ApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos validar los datos del inventario.');
export interface InventoryService {
  create(company: string, body: NewAsset, signal: AbortSignal): Promise<Asset>;
  edit(company: string, id: string, body: EditAsset, signal: AbortSignal): Promise<Asset>;
  archive(company: string, id: string, body: components['schemas']['ArchiveInventoryAsset'], signal: AbortSignal): Promise<Asset>;
  restore(company: string, id: string, body: RestoreAsset, signal: AbortSignal): Promise<Asset>;
  processes(company: string, page: number, signal: AbortSignal): Promise<components['schemas']['BusinessProcessPage']>;
  responsibles(company: string, page: number, signal: AbortSignal): Promise<components['schemas']['BusinessResponsiblePage']>;
  list(company: string, query: AssetQuery, signal: AbortSignal): Promise<AssetPage>;
  asset(company: string, id: string, signal: AbortSignal): Promise<Asset>;
  valuations(company: string, id: string, page: number, signal: AbortSignal): Promise<ValuationPage>;
  history(company: string, id: string, page: number, signal: AbortSignal): Promise<HistoryPage>;
  process(company: string, id: string, signal: AbortSignal): Promise<Process>;
  responsible(company: string, id: string, signal: AbortSignal): Promise<Responsible>;
}
export const createInventoryService = (client = api): InventoryService => ({
  create: async (empresaId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/activos', { path: { empresaId }, body, signal })).data,
  edit: async (empresaId, activoId, body, signal) => (await client.request('put', '/api/v1/empresas/{empresaId}/activos/{activoId}', { path: { empresaId, activoId }, body, signal })).data,
  archive: async (empresaId, activoId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/activos/{activoId}/archivar', { path: { empresaId, activoId }, body, signal })).data,
  restore: async (empresaId, activoId, body, signal) => (await client.request('post', '/api/v1/empresas/{empresaId}/activos/{activoId}/restaurar', { path: { empresaId, activoId }, body, signal })).data,
  processes: async (empresaId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/procesos', { path: { empresaId }, query: { pagina, tamano: 5, estado: 'ACTIVO' }, signal })).data,
  responsibles: async (empresaId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/responsables-negocio', { path: { empresaId }, query: { pagina, tamano: 5, estado: 'ACTIVO' }, signal })).data,
  list: async (empresaId, query, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/activos', { path: { empresaId }, query, signal })).data,
  asset: async (empresaId, activoId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/activos/{activoId}', { path: { empresaId, activoId }, signal })).data,
  valuations: async (empresaId, activoId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/activos/{activoId}/clasificaciones', { path: { empresaId, activoId }, query: { pagina, tamano: 5 }, signal })).data,
  history: async (empresaId, activoId, pagina, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/activos/{activoId}/historial', { path: { empresaId, activoId }, query: { pagina, tamano: 5 }, signal })).data,
  process: async (empresaId, procesoId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/procesos/{procesoId}', { path: { empresaId, procesoId }, signal })).data,
  responsible: async (empresaId, responsableId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/responsables-negocio/{responsableId}', { path: { empresaId, responsableId }, signal })).data,
});
export function validateAsset(asset: Asset, id?: string) {
  if (!asset || !uuid.test(asset.activoId) || (id && asset.activoId.toLowerCase() !== id.toLowerCase()) || typeof asset.codigo !== 'string' || typeof asset.nombre !== 'string'
    || typeof asset.descripcion !== 'string' || !Object.hasOwn(assetTypes, asset.tipo) || !Object.hasOwn(assetStates, asset.estado)
    || !uuid.test(asset.procesoId) || !uuid.test(asset.propietarioId) || (asset.custodioId !== null && !uuid.test(asset.custodioId))
    || (asset.ubicacion !== null && typeof asset.ubicacion !== 'string') || !count(asset.revision) || !['PENDIENTE', 'COMPLETO'].includes(asset.estadoClasificacion)) throw invalid();
  return asset;
}
function validPage<T>(page: { elementos: T[]; pagina: number; tamano: number; hayMas: boolean }, expected: number) {
  if (!page || !Array.isArray(page.elementos) || page.pagina !== expected || page.tamano !== 5 || typeof page.hayMas !== 'boolean' || page.elementos.length > 5) throw invalid();
  return page;
}
function validValuations(page: ValuationPage, expected: number, assetId: string) {
  validPage(page, expected);
  for (const value of page.elementos) {
    if (!value || !uuid.test(value.valoracionId) || value.activoId?.toLowerCase() !== assetId.toLowerCase() || !count(value.numero) || !count(value.revision)
      || !['PENDIENTE', 'COMPLETO'].includes(value.estado) || typeof value.vigente !== 'boolean' || !value.entradas
      || value.metodologia !== 'CID_MAX_V1' || value.versionTiposDatos !== 'DATOS_PERSONALES_V1'
      || !uuid.test(value.creadaPor) || (value.confirmadaPor !== null && !uuid.test(value.confirmadaPor))
      || (value.motivoRevision !== null && typeof value.motivoRevision !== 'string')
      || (value.criticidad !== null && ![1, 3, 5].includes(value.criticidad)) || (value.nivel !== null && !Object.hasOwn(levels, value.nivel))
      || !Number.isFinite(Date.parse(value.creadaEn)) || (value.confirmadaEn !== null && !Number.isFinite(Date.parse(value.confirmadaEn)))) throw invalid();
    for (const dimension of ['confidencialidad', 'integridad', 'disponibilidad'] as const)
      if (value.entradas[dimension] != null && ![1, 3, 5].includes(value.entradas[dimension])) throw invalid();
    for (const flag of ['contieneDatosPersonales', 'contieneDatosMenores'] as const)
      if (value.entradas[flag] != null && typeof value.entradas[flag] !== 'boolean') throw invalid();
    for (const field of ['fundamento', 'finalidadTratamiento', 'justificacionNoAplica'] as const)
      if (value.entradas[field] != null && typeof value.entradas[field] !== 'string') throw invalid();
    if (value.entradas.tiposDatosPersonales != null && (!Array.isArray(value.entradas.tiposDatosPersonales)
      || value.entradas.tiposDatosPersonales.some(type => !Object.hasOwn(personalTypes, type)))) throw invalid();
    if (value.entradas.autorizacionTratamiento != null && !['SI', 'NO', 'NO_APLICA'].includes(value.entradas.autorizacionTratamiento)) throw invalid();
  }
  return page;
}
function validHistory(page: HistoryPage, expected: number) {
  validPage(page, expected);
  for (const entry of page.elementos) if (!entry || !['CREAR', 'EDITAR', 'ARCHIVAR', 'RESTAURAR'].includes(entry.accion)
    || !uuid.test(entry.actorId) || !uuid.test(entry.correlationId) || !Number.isFinite(Date.parse(entry.registradoEn)) || !Object.hasOwn(assetStates, entry.estadoNuevo)
    || (entry.estadoAnterior !== null && !Object.hasOwn(assetStates, entry.estadoAnterior)) || (entry.motivo !== null && typeof entry.motivo !== 'string')
    || !Array.isArray(entry.camposModificados) || entry.camposModificados.some(field => typeof field !== 'string')) throw invalid();
  for (const entry of page.elementos) if (entry.referencias !== null) {
    if (!entry.referencias || typeof entry.referencias !== 'object') throw invalid();
    for (const reference of [entry.referencias.anteriores, entry.referencias.nuevas]) if (reference !== null && (!reference
      || !uuid.test(reference.procesoId) || !uuid.test(reference.propietarioId) || (reference.custodioId != null && !uuid.test(reference.custodioId)))) throw invalid();
  }
  return page;
}
export type InventoryState = {
  status: 'loading' | 'list' | 'detail' | 'error'; query: AssetQuery; error?: ApiError;
  list?: AssetPage; asset?: Asset; valuations?: ValuationPage; history?: HistoryPage;
  process?: Process; owner?: Responsible; custodian?: Responsible;
  valuationPage: number; historyPage: number;
  warnings?: Partial<Record<'valuations' | 'history' | 'process' | 'owner' | 'custodian', ApiError>>;
};
export class InventoryStore {
  private state: InventoryState = { status: 'loading', query: {}, valuationPage: 0, historyPage: 0 };
  private listeners = new Set<() => void>();
  private controller?: AbortController;
  private generation = 0;
  private selected?: string;
  constructor(private company: string, private service: InventoryService, private onAuthorization: (error: ApiError) => void, private canAudit = false) {}
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private set(state: InventoryState) { this.state = state; this.listeners.forEach(fn => fn()); }
  private begin(state: InventoryState) {
    this.controller?.abort(); const controller = this.controller = new AbortController(); const version = ++this.generation;
    this.set(state); return { signal: controller.signal, current: () => version === this.generation && !controller.signal.aborted };
  }
  dispose() { ++this.generation; this.controller?.abort(); }
  private fail(error: unknown, base: InventoryState) {
    const problem = error instanceof ApiError ? error : invalid();
    this.set({ ...base, status: 'error', error: problem });
    if ([401, 403].includes(problem.status)) this.onAuthorization(problem);
  }
  loadList = async (query: AssetQuery = { estado: 'ACTIVO' }) => {
    this.selected = undefined;
    const effective = { ...query, pagina: query.pagina ?? 0, tamano: 5 };
    const base: InventoryState = { status: 'loading', query: effective, valuationPage: 0, historyPage: 0 };
    const task = this.begin(base);
    try {
      const list = validPage(await this.service.list(this.company, effective, task.signal), effective.pagina);
      list.elementos.forEach(asset => validateAsset(asset));
      if (task.current()) this.set({ ...base, status: 'list', list });
    } catch (error) { if (task.current()) this.fail(error, base); }
  };
  loadAsset = async (id: string, valuationPage = 0, historyPage = 0) => {
    this.selected = id;
    const base: InventoryState = { status: 'loading', query: this.state.query, valuationPage, historyPage };
    const task = this.begin(base);
    try {
      if (!uuid.test(id)) throw new ApiError(404, 'ACTIVO_NO_DISPONIBLE', 'Activo no disponible.');
      const asset = validateAsset(await this.service.asset(this.company, id, task.signal), id);
      if (!task.current()) return;
      const related = await Promise.allSettled([
        this.service.valuations(this.company, id, valuationPage, task.signal).then(page => validValuations(page, valuationPage, id)),
        this.canAudit ? this.service.history(this.company, id, historyPage, task.signal).then(page => validHistory(page, historyPage)) : Promise.resolve(undefined),
        this.service.process(this.company, asset.procesoId, task.signal).then(value => {
          if (!value || value.procesoId !== asset.procesoId || typeof value.nombre !== 'string' || !Object.hasOwn(assetStates, value.estado)) throw invalid(); return value;
        }),
        this.service.responsible(this.company, asset.propietarioId, task.signal).then(value => {
          if (!value || value.responsableId !== asset.propietarioId || typeof value.nombre !== 'string' || !Object.hasOwn(assetStates, value.estado)) throw invalid(); return value;
        }),
        asset.custodioId ? this.service.responsible(this.company, asset.custodioId, task.signal).then(value => {
          if (!value || value.responsableId !== asset.custodioId || typeof value.nombre !== 'string' || !Object.hasOwn(assetStates, value.estado)) throw invalid(); return value;
        }) : Promise.resolve(undefined),
      ]);
      if (!task.current()) return;
      const detail: InventoryState = { ...base, status: 'detail', asset, warnings: {} };
      const keys = ['valuations', 'history', 'process', 'owner', 'custodian'] as const;
      for (const [index, result] of related.entries()) {
        if (result.status === 'rejected') {
          const problem = result.reason instanceof ApiError ? result.reason : invalid();
          if ([401, 403].includes(problem.status)) throw problem;
          detail.warnings![keys[index]] = problem;
        }
      }
      const [valuations, history, process, owner, custodian] = related;
      if (valuations.status === 'fulfilled') detail.valuations = valuations.value;
      if (history.status === 'fulfilled') detail.history = history.value;
      if (process.status === 'fulfilled') detail.process = process.value;
      if (owner.status === 'fulfilled') detail.owner = owner.value;
      if (custodian.status === 'fulfilled') detail.custodian = custodian.value;
      this.set(detail);
    } catch (error) { if (task.current()) this.fail(error, base); }
  };
  retry = () => this.selected ? this.loadAsset(this.selected, this.state.valuationPage, this.state.historyPage) : this.loadList(this.state.query);
}
