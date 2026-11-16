import { api, ApiError } from '../../shared/api/client';
import type { components } from '../../shared/api/generated/schema';
import { createPanelService, validatePanel, validateResults } from '../dashboard/panel';
import type { Panel, PanelQuery, PanelService, Results } from '../dashboard/panel';
import { createInventoryService } from '../inventory/inventory';
import type { AssetQuery, InventoryService } from '../inventory/inventory';

export type Identity = components['schemas']['SessionView'];
export type Company = components['schemas']['CompanyMembership'];
export type CompanyPage = components['schemas']['CompanyPage'];
export const roleNames = { AE: 'Administrador de empresa', GS: 'Gestor de seguridad', RA: 'Responsable de acciones', AU: 'Auditor / lector' };
export function capabilities(company: Company) {
  return { read: company.roles.some(role => ['AE', 'GS', 'AU'].includes(role)),
    write: company.roles.some(role => ['AE', 'GS'].includes(role)), admin: company.roles.includes('AE') };
}
export interface AccessService extends PanelService {
  session(signal: AbortSignal): Promise<Identity>;
  login(correo: string, contrasena: string, signal: AbortSignal): Promise<Identity>;
  logout(signal: AbortSignal): Promise<void>;
  companies(page: number, signal: AbortSignal): Promise<CompanyPage>;
  company(id: string, signal: AbortSignal): Promise<Company>;
}
export const createAccessService = (client = api): AccessService => ({
  ...createPanelService(client),
  session: async signal => (await client.request('get', '/api/v1/identidad/sesion', { signal })).data,
  login: async (correo, contrasena, signal) => (await client.request('post', '/api/v1/identidad/sesion', { body: { correo, contrasena }, signal })).data,
  logout: async signal => { await client.request('delete', '/api/v1/identidad/sesion', { signal }); },
  companies: async (pagina, signal) => (await client.request('get', '/api/v1/mis-empresas', { query: { pagina, tamano: 10 }, signal })).data,
  company: async (empresaId, signal) => (await client.request('get', '/api/v1/empresas/{empresaId}/contexto', { path: { empresaId }, signal })).data,
});
export const accessService = createAccessService();
export const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const invalid = () => new ApiError(502, 'RESPUESTA_INVALIDA', 'No pudimos validar la respuesta del servicio.');
function validIdentity(value: Identity) {
  if (!value || !uuid.test(value.usuarioId) || typeof value.nombreVisible !== 'string' || !Number.isFinite(Date.parse(value.expiraEn))) throw invalid();
  if (Date.parse(value.expiraEn) <= Date.now()) throw new ApiError(401, 'SESION_VENCIDA', 'La sesión venció.');
  return value;
}
function validCompany(value: Company) {
  if (!value || !uuid.test(value.empresaId) || typeof value.nombre !== 'string' || typeof value.zonaHoraria !== 'string'
    || !Array.isArray(value.roles) || !value.roles.length || value.roles.some(role => !Object.hasOwn(roleNames, role))
    || new Set(value.roles).size !== value.roles.length) throw invalid();
  try { new Intl.DateTimeFormat('es-CO', { timeZone: value.zonaHoraria }).format(); } catch { throw invalid(); }
  return value;
}
export type AccessState = {
  status: 'loading' | 'login' | 'companies' | 'company' | 'error';
  identity?: Identity;
  company?: Company;
  companies?: CompanyPage;
  error?: ApiError;
  notice?: string;
  panel?: Panel;
  panelQuery?: PanelQuery;
  panelLoading?: boolean;
  panelError?: ApiError;
  results?: Results;
  resultsError?: ApiError;
  section?: 'panel' | 'assets';
  assetId?: string;
  inventoryQuery?: AssetQuery;
};
export function accessMessage(error: ApiError) {
  if (error.code === 'CREDENCIALES_INVALIDAS' || error.status === 401) return 'El correo o la contraseña no son correctos.';
  if (error.status === 429) return `Demasiados intentos. ${error.retryAfter !== undefined ? `Espera ${error.retryAfter} segundos antes de volver a intentar.` : 'Espera un momento antes de volver a intentar.'}`;
  if (error.code === 'CSRF_INVALIDO') return 'No pudimos validar la solicitud. Vuelve a intentarlo.';
  if (error.status === 403 || error.status === 404) return 'El acceso ya no está disponible. La membresía, los permisos o el estado de la empresa pueden haber cambiado.';
  if (error.code === 'RESPUESTA_INVALIDA') return 'El servicio devolvió datos que no pudimos validar.';
  return 'No pudimos conectar con el servicio. Puedes volver a intentarlo.';
}

/** One in-memory scope. Every transition aborts requests and withdraws previous private data. */
export class WorkspaceStore {
  private state: AccessState = { status: 'loading' };
  private listeners = new Set<() => void>();
  private generation = 0;
  private controller?: AbortController;
  private target?: string;
  private page = 0;
  private section: 'panel' | 'assets' = 'panel';
  private assetId?: string;
  private inventoryQuery: AssetQuery = { estado: 'ACTIVO' };
  constructor(private service: AccessService = accessService, readonly inventory: InventoryService = createInventoryService()) {}
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private set(state: AccessState) { this.state = state; this.listeners.forEach(listener => listener()); }
  private begin(state: AccessState) {
    this.controller?.abort();
    const controller = this.controller = new AbortController();
    const generation = ++this.generation;
    this.set(state);
    return { signal: controller.signal, current: () => generation === this.generation && !controller.signal.aborted };
  }
  dispose() { ++this.generation; this.controller?.abort(); }
  expire = () => {
    this.dispose(); this.target = undefined; this.page = 0;
    this.inventoryQuery = { estado: 'ACTIVO' }; this.assetId = undefined; this.section = 'panel';
    this.set({ status: 'login', notice: 'Tu sesión venció o dejó de estar activa. Vuelve a entrar.' });
  };
  private fail(error: unknown, identity?: Identity, login = false) {
    const problem = error instanceof ApiError ? error : invalid();
    if (problem.status === 401 && !login) return this.expire();
    this.set({ status: login ? 'login' : 'error', identity, error: problem });
  }
  open = async (target?: string, page = 0, panelQuery?: PanelQuery, inventoryRoute?: { assetId?: string }) => {
    const hadIdentity = Boolean(this.state.identity);
    if (target?.toLowerCase() !== this.target?.toLowerCase()) this.inventoryQuery = { estado: 'ACTIVO' };
    this.section = inventoryRoute ? 'assets' : 'panel'; this.assetId = inventoryRoute?.assetId;
    this.target = target; this.page = page;
    const task = this.begin({ status: 'loading' });
    let identity: Identity | undefined;
    try {
      identity = validIdentity(await this.service.session(task.signal));
      if (!task.current()) return;
      if (target) {
        if (!uuid.test(target)) throw new ApiError(404, 'EMPRESA_NO_DISPONIBLE', 'Empresa no disponible.');
        const company = validCompany(await this.service.company(target, task.signal));
        if (!task.current()) return;
        if (company.empresaId.toLowerCase() !== target.toLowerCase()) throw invalid();
        if (this.section === 'assets' && !capabilities(company).read) throw new ApiError(403, 'ACCESO_DENEGADO', 'No tienes acceso al inventario.');
        this.set({ status: 'company', identity, company, section: this.section, assetId: this.assetId, inventoryQuery: this.inventoryQuery });
        if (this.section === 'panel' && capabilities(company).read) await this.loadPanel(panelQuery);
      } else {
        const companies = await this.service.companies(page, task.signal);
        if (!task.current()) return;
        if (!companies || !Array.isArray(companies.empresas) || companies.pagina !== page || typeof companies.hayMas !== 'boolean') throw invalid();
        companies.empresas.forEach(validCompany);
        this.set({ status: 'companies', identity, companies });
      }
    } catch (error) {
      if (!task.current()) return;
      if (error instanceof ApiError && error.status === 401 && !hadIdentity && !identity) {
        this.target = undefined; this.page = 0;
        this.set({ status: 'login', notice: 'Inicia sesión para continuar.' });
      } else this.fail(error, identity);
    }
  };
  retry = () => this.open(this.target, this.page, this.state.panelQuery, this.section === 'assets' ? { assetId: this.assetId } : undefined);
  rememberInventoryQuery = (companyId: string, query: AssetQuery) => { if (companyId.toLowerCase() === this.target?.toLowerCase()) this.inventoryQuery = query; };
  authorizationLost = (error: ApiError) => {
    this.dispose(); this.fail(error, this.state.identity);
  };
  loadPanel = async (query: PanelQuery = {}) => {
    const { identity, company } = this.state;
    if (!identity || !company || !capabilities(company).read) return;
    const effective: PanelQuery = { ...query, pagina: query.pagina ?? 0, tamano: 5, detalle: query.detalle ?? 'EVALUACIONES', baseRiesgo: query.baseRiesgo ?? 'RESIDUAL' };
    const base: AccessState = { status: 'company', identity, company, panelQuery: effective };
    const task = this.begin({ ...base, panelLoading: true });
    try {
      const panel = validatePanel(await this.service.panel(company.empresaId, effective, task.signal), company.empresaId, effective);
      if (!task.current()) return;
      const evaluation = panel.evaluaciones.elementos[0];
      if (!evaluation) { this.set({ ...base, panel }); return; }
      // Results have their own endpoint and revision; they are never recomputed in the browser.
      try {
        const results = validateResults(await this.service.results(company.empresaId, evaluation.evaluacionId, task.signal), evaluation.evaluacionId);
        if (task.current()) this.set({ ...base, panel, results });
      } catch (error) {
        if (!task.current()) return;
        if (error instanceof ApiError && [401, 403].includes(error.status)) return this.fail(error, identity);
        this.set({ ...base, panel, resultsError: error instanceof ApiError ? error : new ApiError(502, 'RESPUESTA_INVALIDA', 'Resultados no disponibles.') });
      }
    } catch (error) {
      if (!task.current()) return;
      if (error instanceof ApiError && [401, 403].includes(error.status)) return this.fail(error, identity);
      this.set({ ...base, panelError: error instanceof ApiError ? error : new ApiError(502, 'RESPUESTA_INVALIDA', 'Panel no disponible.') });
    }
  };
  login = async (correo: string, contrasena: string) => {
    const task = this.begin({ status: 'loading' });
    try {
      validIdentity(await this.service.login(correo, contrasena, task.signal));
      if (task.current()) await this.open(this.target);
    } catch (error) { if (task.current()) this.fail(error, undefined, true); }
  };
  logout = async () => {
    const task = this.begin({ status: 'loading' });
    this.target = undefined; this.page = 0;
    this.inventoryQuery = { estado: 'ACTIVO' }; this.assetId = undefined; this.section = 'panel';
    try {
      await this.service.logout(task.signal);
      if (task.current()) this.set({ status: 'login', notice: 'Sesión cerrada.' });
    } catch (error) {
      if (!task.current()) return;
      if (error instanceof ApiError && error.status === 401) return this.expire();
      this.set({ status: 'error', notice: 'No se confirmó el cierre en el servidor. Vuelve a cerrar la sesión.',
        error: error instanceof ApiError ? error : invalid() });
    }
  };
}
