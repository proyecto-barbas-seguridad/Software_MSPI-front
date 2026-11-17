import { Box, Button, Stack, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { ControlError, ControlPager, useControlRead } from '../controls/ControlPanel';
import { controlLabels, validateControl, validatePage as controlPage, validateVerification } from '../controls/controls';
import type { Control, ControlService } from '../controls/controls';
import type { ControlAccess } from '../controls/ControlPanel';
import { date } from '../dashboard/panel';
import { validatePage, validators } from './risks';
import type { Risk, RiskService } from './risks';
export type SelectedVerification = { id: string; label: string };
type Props = { company: string; risk: Risk; service: RiskService; controls: ControlService; selected: SelectedVerification[]; onToggle: (item: SelectedVerification, checked: boolean) => void } & ControlAccess;
export default function ResidualVerificationPicker({ company, risk, service, controls, selected, onToggle, scope, onAuthorization }: Props) {
  const [page, setPage] = useState(0); const [open, setOpen] = useState<Record<string, boolean>>({});
  const load = useCallback(async (signal: AbortSignal) => validatePage(await service.links(company, risk.riesgoId, page, signal), page, item => validators.links(item, risk.riesgoId)), [service, company, risk.riesgoId, page]);
  const state = useControlRead(load, { scope, onAuthorization });
  return <Stack spacing={2} aria-busy={state.loading}>
    <Typography>Elige verificaciones de controles vinculados. Solo se ofrecen referencias de la versión actual que el servidor identifica como efectivas o parcialmente efectivas. La vigencia e integridad se comprueban otra vez al confirmar.</Typography>
    {state.loading && <Typography role="status">Consultando controles vinculados para mitigación…</Typography>}{state.error && <ControlError error={state.error} />}
    {state.data && <>{!state.data.elementos.length && <Typography>No hay controles vinculados en esta página.</Typography>}{state.data.elementos.map(link => <Box component="details" key={link.vinculoId} onToggle={event => { const visible = event.currentTarget.open; setOpen(prior => ({ ...prior, [link.vinculoId]: visible })); }}>
      <Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Seleccionar pruebas de {link.implementacionId}</Typography>
      {open[link.vinculoId] && <Candidate company={company} id={link.implementacionId} controls={controls} selected={selected} onToggle={onToggle} scope={scope} onAuthorization={onAuthorization} />}
    </Box>)}<ControlPager page={page} more={state.data.hayMas} label="controles para mitigación" load={setPage} /></>}
    <Button disabled={state.loading} onClick={state.retry}>Actualizar controles para mitigación</Button>
  </Stack>;
}
function Candidate({ company, id, controls, selected, onToggle, scope, onAuthorization }: { company: string; id: string; controls: ControlService; selected: SelectedVerification[]; onToggle: Props['onToggle'] } & ControlAccess) {
  const load = useCallback(async (signal: AbortSignal) => validateControl(await controls.detail(company, id, signal), id), [controls, company, id]);
  const state = useControlRead(load, { scope, onAuthorization });
  const c = state.data; const eligible = c && c.estado === 'IMPLEMENTADO' && Boolean(c.versionActual.aplicacion) && ['EFECTIVO', 'PARCIALMENTE_EFECTIVO'].includes(c.resultadoVigente) && !c.causaSinVigencia && c.ultimaVerificacionId;
  return <Stack spacing={2} sx={{ mt: 2 }} aria-busy={state.loading}>{state.loading && <Typography role="status">Consultando disponibilidad de pruebas…</Typography>}{state.error && <ControlError error={state.error} />}
    <Button disabled={state.loading} onClick={state.retry}>Actualizar disponibilidad de pruebas</Button>
    {c && <><Typography>{c.versionActual.detalle.nombre} · {controlLabels[c.estado]} · {controlLabels[c.resultadoVigente]}</Typography>{!eligible && <Typography>Esta implementación no ofrece una verificación vigente utilizable para mitigación según la ficha del servidor.</Typography>}
      {eligible && <Choices company={company} control={c} controls={controls} selected={selected} onToggle={onToggle} scope={scope} onAuthorization={onAuthorization} />}</>}
  </Stack>;
}
function Choices({ company, control, controls, selected, onToggle, scope, onAuthorization }: { company: string; control: Control; controls: ControlService; selected: SelectedVerification[]; onToggle: Props['onToggle'] } & ControlAccess) {
  const [page, setPage] = useState(0);
  const load = useCallback(async (signal: AbortSignal) => controlPage(await controls.verifications(company, control.implementacionId, control.versionActual.versionId, page, signal), page, item => validateVerification(item, control.versionActual.versionId)), [controls, company, control, page]);
  const state = useControlRead(load, { scope, onAuthorization });
  return <Stack spacing={1} aria-busy={state.loading}>{state.loading && <Typography role="status">Consultando verificaciones para mitigación…</Typography>}{state.error && <ControlError error={state.error} />}
    <Button disabled={state.loading} onClick={state.retry}>Actualizar verificaciones para mitigación</Button>
    {state.data && <>{!state.data.elementos.length && <Typography>No hay verificaciones en esta página.</Typography>}{state.data.elementos.map(v => {
      const checked = selected.some(item => item.id === v.verificacionId); const eligible = v.verificacionId === control.ultimaVerificacionId && ['EFECTIVO', 'PARCIALMENTE_EFECTIVO'].includes(v.resultado) && v.criteriosCumplidos > 0;
      return <Stack key={v.verificacionId} spacing={1}><Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}><Box component="input" type="checkbox" aria-label={'Seleccionar verificación ' + v.verificacionId} checked={checked} disabled={!eligible || (!checked && selected.length >= 100)} onChange={event => onToggle({ id: v.verificacionId, label: `${control.versionActual.detalle.nombre} · ${v.prueba} · ${v.verificacionId}` }, event.target.checked)} sx={{ minWidth: 24, minHeight: 44 }} /><Typography>{v.prueba} · {controlLabels[v.resultado]} · {v.criteriosCumplidos} / {v.criteriosEvaluados} · Próxima revisión: {date(v.proximaRevision)}</Typography></Stack><Typography variant="body2">{v.fundamento}{!eligible && ' · Antecedente sin selección disponible. No acredita vigencia actual.'}</Typography></Stack>;
    })}<ControlPager page={page} more={state.data.hayMas} label={'verificaciones para ' + control.implementacionId} load={setPage} /></>}
  </Stack>;
}
