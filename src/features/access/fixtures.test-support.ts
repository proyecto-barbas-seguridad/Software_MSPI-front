import { vi } from 'vitest';
import { ApiError } from '../../shared/api/client';
import type { AccessService, Company, Identity } from './workspace';
export const identity: Identity = { usuarioId: '00000000-0000-0000-0000-000000000001', nombreVisible: 'Cuenta de prueba', expiraEn: new Date(Date.now() + 600000).toISOString() };
export const a: Company = { empresaId: '00000000-0000-0000-0000-000000000002', nombre: 'Empresa A', zonaHoraria: 'America/Bogota', roles: ['GS', 'RA'] };
export const b: Company = { ...a, empresaId: '00000000-0000-0000-0000-000000000003', nombre: 'Empresa B', roles: ['RA'] };
export function service(overrides: Partial<AccessService> = {}): AccessService {
  return { session: vi.fn().mockResolvedValue(identity), login: vi.fn().mockResolvedValue(identity),
    logout: vi.fn().mockResolvedValue(undefined), companies: vi.fn().mockImplementation(async page => ({ empresas: [a, b], pagina: page, tamano: 10, hayMas: page === 0 })),
    company: vi.fn().mockImplementation(async id => id === a.empresaId ? a : b), ...overrides };
}
export function anonymous() { return service({ session: vi.fn().mockRejectedValue(new ApiError(401, 'NO_AUTENTICADO', 'Accede.')) }); }
export function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done; }); return { promise, resolve }; }
