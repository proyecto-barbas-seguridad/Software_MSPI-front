import { Alert, Button, Link, Paper, Stack, Typography } from '@mui/material';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../shared/api/client';
import { capabilities } from '../access/workspace';
import type { Company } from '../access/workspace';
import { ControlDetail, ControlError, ControlPager, useControlRead } from './ControlPanel';
import { controlLabels, uuid, validateControl, validatePage } from './controls';
import type { ControlService } from './controls';
import type { ControlMode } from './ControlEditor';
const ControlEditor = lazy(() => import('./ControlEditor'));
const noop = () => {}; const allow = () => true;
export default function ControlWorkspace({ company, controlId, service, scope, onAuthorization, onDirty = noop, onPending = noop, onLeave = allow }: {
  company: Company; controlId?: string; service: ControlService; scope?: AbortSignal; onAuthorization: (error: ApiError) => void;
  onDirty?: (dirty: boolean) => void; onPending?: (pending: boolean) => void; onLeave?: () => boolean;
}) {
  const [page, setPage] = useState(0); const [mode, setMode] = useState<ControlMode>(); const [notice, setNotice] = useState<string>(); const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { setMode(undefined); setNotice(undefined); }, [controlId]);
  const canRead = capabilities(company).read;
  const load = useCallback(async (signal: AbortSignal) => {
    if (!canRead) throw new ApiError(403, 'ACCESO_DENEGADO', 'No tienes acceso a las implementaciones empresariales.');
    if (controlId) { if (!uuid.test(controlId)) throw new ApiError(404, 'IMPLEMENTACION_NO_DISPONIBLE', 'Implementación no disponible.'); return { control: validateControl(await service.detail(company.empresaId, controlId, signal), controlId) }; }
    return { list: validatePage(await service.list(company.empresaId, page, signal), page, item => validateControl(item)) };
  }, [company.empresaId, canRead, controlId, page, service]);
  const state = useControlRead(load, { scope, onAuthorization });
  useEffect(() => { if (!state.loading) heading.current?.focus(); }, [state.loading]);
  const base = '#/empresas/' + company.empresaId + '/controles';
  if (mode) return <Suspense fallback={<Typography role="status">Abriendo formulario de implementación…</Typography>}><ControlEditor company={company} control={state.data?.control} mode={mode} service={service} scope={scope} onAuthorization={onAuthorization} onDirty={onDirty} onPending={onPending} onCancel={() => { if (onLeave()) setMode(undefined); }} onSaved={created => { setMode(undefined); if (created) window.location.hash = base + '/' + created.implementacionId; else { setNotice('Consulta actualizada del servidor. Revisa estado, versión y antecedentes antes de continuar.'); state.retry(); } }} /></Suspense>;
  return <Stack component="section" spacing={3} aria-labelledby="controls-title" aria-busy={state.loading} sx={{ overflowWrap: 'anywhere' }}>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}><Typography id="controls-title" variant="h2" tabIndex={-1} ref={heading}>{controlId ? 'Ficha de implementación' : 'Implementaciones de controles'}</Typography>{controlId && <Link href={base}>Volver a implementaciones</Link>}<Button disabled={state.loading} onClick={state.retry}>Actualizar {controlId ? 'ficha de implementación' : 'implementaciones'}</Button></Stack>
    <Typography>Catálogo e implementación empresarial son distintos. El estado de trabajo no acredita efectividad ni reduce el riesgo automáticamente.</Typography>{notice && <Alert severity="info">{notice}</Alert>}
    {!controlId && capabilities(company).write && <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setMode('create')}>Crear implementación</Button>}
    {state.loading && <Typography role="status">Consultando implementaciones…</Typography>}{state.error && <ControlError error={state.error} />}
    {state.data?.control && <>{capabilities(company).write && <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}>{state.data.control.estado === 'PROPUESTO' && <Button variant="contained" onClick={() => setMode('start')}>Iniciar implementación</Button>}{state.data.control.estado === 'IMPLEMENTADO' && <Button onClick={() => setMode('change')}>Registrar cambio de implementación</Button>}</Stack>}<ControlDetail key={state.data.control.implementacionId + ':' + state.data.control.revision} company={company.empresaId} control={state.data.control} service={service} zone={company.zonaHoraria} scope={scope} onAuthorization={onAuthorization} /></>}
    {state.data?.list && <>{!state.data.list.elementos.length && <Alert severity="info">No hay implementaciones en esta página. No representa una medida de efectividad.</Alert>}<Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>{state.data.list.elementos.map(control => <Paper component="li" key={control.implementacionId} sx={{ p: 2 }}><Stack spacing={1}><Link href={base + '/' + control.implementacionId} sx={{ fontWeight: 600 }}>{control.versionActual.detalle.nombre}</Link><Typography>{controlLabels[control.estado]} · {controlLabels[control.resultadoVigente]} · Versión {control.versionActual.numero}</Typography>{control.causaSinVigencia && <Typography>{controlLabels[control.causaSinVigencia]}</Typography>}</Stack></Paper>)}</Stack><ControlPager page={page} more={state.data.list.hayMas} label="implementaciones" load={setPage} /></>}
  </Stack>;
}
