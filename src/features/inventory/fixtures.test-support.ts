import { vi } from 'vitest';
import type { components } from '../../shared/api/generated/schema';
import { a, identity } from '../access/fixtures.test-support';
import type { Asset, InventoryService } from './inventory';
export const asset: Asset = { activoId: '00000000-0000-0000-0000-000000000033', codigo: 'ACT-033', nombre: 'Servidor de nómina', descripcion: 'Información de prueba', tipo: 'SOFTWARE',
  procesoId: '00000000-0000-0000-0000-000000000020', propietarioId: '00000000-0000-0000-0000-000000000021', custodioId: null, ubicacion: 'Oficina de prueba', estado: 'ACTIVO', revision: 4, estadoClasificacion: 'COMPLETO' };
export const valuation: components['schemas']['AssetValuation'] = { valoracionId: '00000000-0000-0000-0000-000000000041', activoId: asset.activoId, numero: 1, revision: 2, metodologia: 'CID_MAX_V1', versionTiposDatos: 'DATOS_PERSONALES_V1', estado: 'COMPLETO', vigente: true, criticidad: 1, nivel: 'BAJA',
  entradas: { confidencialidad: 1, integridad: 1, disponibilidad: 1, fundamento: 'Fundamento de prueba', contieneDatosPersonales: false }, motivoRevision: null,
  creadaPor: identity.usuarioId, creadaEn: '2026-11-16T15:00:00Z', actualizadaPor: identity.usuarioId, actualizadaEn: '2026-11-16T15:00:00Z', confirmadaPor: identity.usuarioId, confirmadaEn: '2026-11-16T15:00:00Z' };
export const pending: typeof valuation = { ...valuation, valoracionId: '00000000-0000-0000-0000-000000000042', numero: 2, estado: 'PENDIENTE', vigente: false, criticidad: null, nivel: null,
  entradas: { confidencialidad: 3, integridad: null, disponibilidad: 5, contieneDatosPersonales: true, contieneDatosMenores: false, tiposDatosPersonales: ['IDENTIFICACION'], finalidadTratamiento: 'Finalidad de prueba', autorizacionTratamiento: 'NO_APLICA', justificacionNoAplica: 'Justificación declarada' }, motivoRevision: 'Revisión de prueba', confirmadaPor: null, confirmadaEn: null };
export function inventoryService(overrides: Partial<InventoryService> = {}): InventoryService {
  return {
    create: vi.fn().mockResolvedValue({ ...asset, revision: 0 }), edit: vi.fn().mockResolvedValue({ ...asset, revision: 5 }),
    archive: vi.fn().mockResolvedValue({ ...asset, estado: 'ARCHIVADO', revision: 5 }), restore: vi.fn().mockResolvedValue({ ...asset, revision: 5 }),
    processes: vi.fn().mockImplementation(async (_, pagina) => ({ elementos: [{ procesoId: asset.procesoId, nombre: 'Gestión de personas', estado: 'ACTIVO', revision: 1, descripcion: null, responsableId: null }], pagina, tamano: 5, hayMas: false })),
    responsibles: vi.fn().mockImplementation(async (_, pagina) => ({ elementos: [{ responsableId: asset.propietarioId, nombre: 'Talento humano', tipo: 'AREA', estado: 'ACTIVO', revision: 1, membresiaId: null }], pagina, tamano: 5, hayMas: false })),
    list: vi.fn().mockImplementation(async (_, query) => ({ elementos: [asset], pagina: query.pagina || 0, tamano: 5, hayMas: false })),
    asset: vi.fn().mockResolvedValue(asset),
    valuations: vi.fn().mockImplementation(async (_, __, pagina) => ({ elementos: [pending, valuation], pagina, tamano: 5, hayMas: false })),
    history: vi.fn().mockImplementation(async (_, __, pagina) => ({ elementos: [{ actorId: identity.usuarioId, accion: 'CREAR', estadoAnterior: null, estadoNuevo: 'ACTIVO', motivo: null,
      correlationId: '00000000-0000-0000-0000-000000000050', registradoEn: '2026-11-16T15:00:00Z', camposModificados: ['nombre'], referencias: null }], pagina, tamano: 5, hayMas: false })),
    process: vi.fn().mockResolvedValue({ procesoId: asset.procesoId, nombre: 'Gestión de personas', descripcion: null, responsableId: null, estado: 'ARCHIVADO', revision: 1 }),
    responsible: vi.fn().mockResolvedValue({ responsableId: asset.propietarioId, nombre: 'Área de talento humano', tipo: 'AREA', membresiaId: null, estado: 'ACTIVO', revision: 1 }), ...overrides,
  };
}
export const company = { ...a, roles: ['AE', 'GS'] as typeof a.roles };
