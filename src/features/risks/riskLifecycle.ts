import { ApiError } from '../../shared/api/client';
import { validatePage, validators, uuid } from './risks';
import type { Inherent, Residual, Risk, RiskAction, RiskService, RiskTransition } from './risks';
export type RiskLifecycleMode = { kind: 'accept' } | { kind: 'transition'; target: RiskTransition['destino'] };
export const transitions: Record<Risk['estado'], RiskTransition['destino'][]> = { IDENTIFICADO: [], EN_ANALISIS: ['EN_TRATAMIENTO', 'EN_SEGUIMIENTO'], EN_TRATAMIENTO: ['EN_SEGUIMIENTO'], EN_SEGUIMIENTO: ['EN_ANALISIS', 'EN_TRATAMIENTO', 'CERRADO'], CERRADO: [] };
export function transitionLabel(risk: Risk, target: RiskTransition['destino']) { return target === 'CERRADO' ? 'Cerrar riesgo' : target === 'EN_ANALISIS' ? 'Volver a análisis' : target === 'EN_TRATAMIENTO' ? risk.estado === 'EN_SEGUIMIENTO' ? 'Volver a tratamiento' : 'Pasar a tratamiento' : 'Pasar a seguimiento'; }
export { companyDay, calendarDay } from '../../shared/date/companyDay';
export async function acceptanceContext(company: string, risk: Risk, service: RiskService, signal: AbortSignal, scope?: AbortSignal) {
  if (risk.estado === 'CERRADO' || risk.detalle.tratamientoPropuesto !== 'ACEPTAR' || !risk.inherenteVigenteId || risk.requiereRevision) throw new ApiError(409, 'VALORACIONES_RIESGO_NO_VIGENTES', 'La aceptación requiere tratamiento aceptar y valoraciones inherente y residual vigentes.');
  const active = () => { if (signal.aborted || scope?.aborted) throw new DOMException('Cancelada', 'AbortError'); };
  let base: Inherent | undefined; let residual: Residual | undefined;
  for (let page = 0; !base; page++) {
    active(); const data = validatePage(await service.inherent(company, risk.riesgoId, page, signal), page, item => validators.inherent(item, risk.riesgoId)); active();
    if (data.elementos.some(item => item.revisionRiesgo !== risk.revision)) throw new ApiError(409, 'REVISION_DESACTUALIZADA', 'Las valoraciones y la ficha cambiaron. Consulta el riesgo nuevamente.');
    base = data.elementos.find(item => item.valoracionId === risk.inherenteVigenteId);
    if (!data.hayMas && !base) throw new ApiError(409, 'BASE_INHERENTE_NO_VIGENTE', 'No está disponible la base inherente indicada por la ficha.');
  }
  if (base.estadoResultado !== 'CONFIRMADA' || base.requiereRevision) throw new ApiError(409, 'BASE_INHERENTE_NO_VIGENTE', 'La inherente debe estar confirmada y vigente.');
  for (let page = 0; !residual; page++) {
    active(); const data = validatePage(await service.residual(company, risk.riesgoId, page, signal), page, item => validators.residual(item, risk.riesgoId)); active();
    if (data.elementos.some(item => item.revisionRiesgo !== risk.revision)) throw new ApiError(409, 'REVISION_DESACTUALIZADA', 'El historial residual y la ficha cambiaron.');
    residual = data.elementos.find(item => item.vigente && !item.requiereRevision && item.estadoResultado === 'CONFIRMADA' && item.inherenteId === base!.valoracionId);
    if (!data.hayMas && !residual) throw new ApiError(409, 'BASE_RESIDUAL_NO_VIGENTE', 'Confirma una residual vigente asociada a la inherente actual antes de aprobar aceptación.');
  }
  return { base, residual };
}
export async function closingActions(company: string, risk: string, service: RiskService, signal: AbortSignal, scope?: AbortSignal) {
  const linked: RiskAction[] = []; const seen = new Set<string>();
  for (let page = 0; ; page++) {
    if (signal.aborted || scope?.aborted) throw new DOMException('Cancelada', 'AbortError');
    const data = validatePage(await service.actions(company, page, signal), page, item => {
      if (!uuid.test(item.accionId) || typeof item.codigo !== 'string' || (item.riesgoId !== null && !uuid.test(item.riesgoId)) || !['PENDIENTE', 'EN_EJECUCION', 'EN_REVISION', 'COMPLETADA', 'CANCELADA'].includes(item.estado)) throw new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudieron validar las acciones autorizadas.');
    });
    if (signal.aborted || scope?.aborted) throw new DOMException('Cancelada', 'AbortError');
    for (const item of data.elementos) {
      if (seen.has(item.accionId)) throw new ApiError(409, 'CONSULTA_ACCIONES_CAMBIADA', 'El listado de acciones cambió durante la consulta. Actualiza la ficha antes de cerrar.');
      seen.add(item.accionId); if (item.riesgoId === risk) linked.push(item);
    }
    if (!data.hayMas) break;
  }
  return linked;
}
