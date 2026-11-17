import { ApiError } from '../../shared/api/client';
import { validatePage, validators } from './risks';
import type { Inherent, Residual, Risk, RiskService } from './risks';
export const residualStates = ['EN_ANALISIS', 'EN_TRATAMIENTO'];
export async function residualContext(company: string, risk: Risk, service: RiskService, signal: AbortSignal, scope?: AbortSignal) {
  if (!residualStates.includes(risk.estado) || !risk.inherenteVigenteId || risk.requiereRevision) throw new ApiError(409, 'BASE_INHERENTE_NO_VIGENTE', 'Confirma una valoración inherente vigente antes de trabajar en la residual.');
  const active = () => { if (signal.aborted || scope?.aborted) throw new DOMException('Cancelada', 'AbortError'); };
  let base: Inherent | undefined;
  for (let page = 0; !base; page++) {
    active(); const data = validatePage(await service.inherent(company, risk.riesgoId, page, signal), page, item => validators.inherent(item, risk.riesgoId)); active();
    if (data.elementos.some(item => item.revisionRiesgo !== risk.revision)) throw new ApiError(409, 'REVISION_DESACTUALIZADA', 'La ficha y su base cambiaron. Consulta el riesgo nuevamente.');
    base = data.elementos.find(item => item.valoracionId === risk.inherenteVigenteId);
    if (!data.hayMas && !base) throw new ApiError(409, 'BASE_INHERENTE_NO_VIGENTE', 'La base inherente indicada no está disponible. Actualiza la ficha.');
  }
  if (base.estadoResultado !== 'CONFIRMADA' || base.requiereRevision || !base.entradas.probabilidad || !base.entradas.impacto) throw new ApiError(409, 'BASE_INHERENTE_NO_VIGENTE', 'La valoración inherente debe estar confirmada y sin revisión requerida.');
  let reevaluation = false; let existingDraft: Residual | undefined;
  for (let page = 0; ; page++) {
    active(); const data = validatePage(await service.residual(company, risk.riesgoId, page, signal), page, item => validators.residual(item, risk.riesgoId)); active();
    if (data.elementos.some(item => item.revisionRiesgo !== risk.revision)) throw new ApiError(409, 'REVISION_DESACTUALIZADA', 'El historial residual y la ficha cambiaron. Consulta de nuevo.');
    existingDraft ||= data.elementos.find(item => item.estadoResultado === 'BORRADOR');
    reevaluation ||= data.elementos.some(item => item.estadoResultado === 'CONFIRMADA');
    if (reevaluation || !data.hayMas) break;
  }
  return { base, reevaluation, existingDraft };
}
