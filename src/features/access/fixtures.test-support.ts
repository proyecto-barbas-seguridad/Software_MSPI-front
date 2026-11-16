import { vi } from 'vitest';
import { ApiError } from '../../shared/api/client';
import type { AccessService, Company, Identity } from './workspace';
import type { Panel, PanelQuery, Results } from '../dashboard/panel';
export const identity: Identity = { usuarioId: '00000000-0000-0000-0000-000000000001', nombreVisible: 'Cuenta de prueba', expiraEn: new Date(Date.now() + 600000).toISOString() };
export const a: Company = { empresaId: '00000000-0000-0000-0000-000000000002', nombre: 'Empresa A', zonaHoraria: 'America/Bogota', roles: ['GS', 'RA'] };
export const b: Company = { ...a, empresaId: '00000000-0000-0000-0000-000000000003', nombre: 'Empresa B', roles: ['RA'] };
export function emptyPanel(id = a.empresaId, query: PanelQuery = {}): Panel {
  return { empresaId: id, empresa: 'Empresa de prueba', zonaHoraria: 'America/Bogota', generadoEn: '2026-11-16T15:00:00Z',
    filtros: { desde: query.desde || null, hasta: query.hasta || null, evaluacionId: null, estadoEvaluacion: null, estadoRiesgo: null,
      baseRiesgo: query.baseRiesgo || 'RESIDUAL', situacionRiesgo: null, nivelRiesgo: null, probabilidad: null, impacto: null, estadoAccion: null, vencida: null },
    pagina: query.pagina || 0, tamano: query.tamano || 5, detalle: query.detalle || 'EVALUACIONES',
    evaluaciones: { total: 0, porEstado: {}, elementos: [] }, riesgos: { total: 0, porEstado: {}, porSituacion: {}, porNivel: {}, matriz: [], elementos: [] },
    acciones: { total: 0, porEstado: {}, vencidas: 0, elementos: [] } };
}
export function emptyResults(evaluacionId: string): Results {
  return { evaluacionId, revision: 0, controlesGlobal: { total: 0, aplicables: 0, evaluados: 0, pendientes: 0, sinDecidir: 0, noAplican: 0, puntaje: null, avance: null, estado: 'SIN_ELEMENTOS' }, dominios: [], clausulas: [] };
}
export function service(overrides: Partial<AccessService> = {}): AccessService {
  return { session: vi.fn().mockResolvedValue(identity), login: vi.fn().mockResolvedValue(identity),
    panel: vi.fn().mockImplementation(async (id, query) => emptyPanel(id, query)), results: vi.fn().mockImplementation(async (_, id) => emptyResults(id)),
    logout: vi.fn().mockResolvedValue(undefined), companies: vi.fn().mockImplementation(async page => ({ empresas: [a, b], pagina: page, tamano: 10, hayMas: page === 0 })),
    company: vi.fn().mockImplementation(async id => id === a.empresaId ? a : b), ...overrides };
}
export function anonymous() { return service({ session: vi.fn().mockRejectedValue(new ApiError(401, 'NO_AUTENTICADO', 'Accede.')) }); }
export function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
