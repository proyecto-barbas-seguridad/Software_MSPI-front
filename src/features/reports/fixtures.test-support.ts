import { vi } from 'vitest';
import { a } from '../access/fixtures.test-support';
import { id } from '../risks/fixtures.test-support';
import { effectiveQuery, sections } from './reports';
import type { Query, Report, ReportService } from './reports';
export const method = { versionId: id(900), nombre: 'Metodología ilustrativa', codigo: 'MET-PRUEBA', version: '1.0', identificador: 'METODOLOGIA_PRUEBA' };
export function report(company = a.empresaId, input: Query = {}): Report {
  const query = effectiveQuery(input), selected = query.secciones ?? sections;
  return { empresaId: company, empresa: 'Empresa de prueba', zonaHoraria: 'America/Bogota', generadoEn: '2026-11-17T15:00:00Z', secciones: selected,
    filtros: { desde: query.desde ?? null, hasta: query.hasta ?? null, evaluacionId: query.evaluacionId ?? null, estadoEvaluacion: query.estadoEvaluacion ?? null, estadoRiesgo: query.estadoRiesgo ?? null, baseRiesgo: query.baseRiesgo ?? 'RESIDUAL', situacionRiesgo: query.situacionRiesgo ?? null, nivelRiesgo: query.nivelRiesgo ?? null, probabilidad: query.probabilidad ?? null, impacto: query.impacto ?? null, estadoAccion: query.estadoAccion ?? null, vencida: query.vencida ?? null },
    evaluaciones: selected.includes('EVALUACIONES') ? { datos: { total: query.evaluacionId ? 1 : 0, porEstado: query.evaluacionId ? { [query.estadoEvaluacion ?? 'BORRADOR']: 1 } : {}, elementos: query.evaluacionId ? [{ evaluacionId: query.evaluacionId, nombre: 'Diagnóstico de prueba', fecha: '2026-11-17', estado: query.estadoEvaluacion ?? 'BORRADOR', versionCatalogoId: id(901), versionMetodologiaId: method.versionId, sinDecidir: 1, sinCalificacion: 1, heredadasPendientes: 0, controlesAplicables: 1, controlesEvaluados: 0, clausulasAplicables: 0, clausulasEvaluadas: 0 }] : [] }, metodologias: query.evaluacionId ? [method] : [] } : null,
    riesgos: selected.includes('RIESGOS') ? { datos: { total: 2, porEstado: { EN_ANALISIS: 2 }, porSituacion: { VIGENTE: 1, PENDIENTE: 1 }, porNivel: { ALTO: 1 }, matriz: [{ probabilidad: 'MEDIA', impacto: 'MAYOR', nivel: 'ALTO', total: 1 }], elementos: [] }, metodologias: [method] } : null,
    acciones: selected.includes('ACCIONES') ? { total: 1, porEstado: { EN_EJECUCION: 1 }, vencidas: 0, elementos: [] } : null };
}
export function reportService(overrides: Partial<ReportService> = {}): ReportService { return { generate: vi.fn().mockImplementation(async (company, query) => report(company, query)), evaluations: vi.fn().mockImplementation(async (_, page) => ({ pagina: page, tamano: 5, hayMas: false, elementos: [{ id: id(902), label: 'Diagnóstico de prueba' }] })), ...overrides }; }
