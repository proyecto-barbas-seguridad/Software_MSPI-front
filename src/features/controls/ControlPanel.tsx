import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError } from '../../shared/api/client';
import { date, timestamp } from '../dashboard/panel';
import { controlLabels, uuid, validateControl, validatePage, validateVerification, validateVersion } from './controls';
import type { Control, ControlService, Version } from './controls';
export type ControlAccess = { scope?: AbortSignal; onAuthorization: (error: ApiError) => void };
export function useControlRead<T>(load: (signal: AbortSignal) => Promise<T>, { scope, onAuthorization }: ControlAccess) {
  const [data, setData] = useState<T>(); const [error, setError] = useState<ApiError>(); const [loading, setLoading] = useState(true); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const request = new AbortController(); setData(undefined); setError(undefined); setLoading(true);
    if (scope?.aborted) { setLoading(false); return; }
    void load(request.signal).then(value => { if (!request.signal.aborted && !scope?.aborted) setData(value); }).catch(failure => {
      if (request.signal.aborted || scope?.aborted) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo consultar la implementación de control.'); setError(problem);
      if ([401, 403].includes(problem.status)) onAuthorization(problem);
    }).finally(() => { if (!request.signal.aborted && !scope?.aborted) setLoading(false); });
    return () => request.abort();
  }, [load, scope, onAuthorization, attempt]);
  return { data, error, loading, retry: () => { setData(undefined); setError(undefined); setLoading(true); setAttempt(value => value + 1); } };
}
export function ControlError({ error }: { error: ApiError }) { return <Alert severity="error">{error.status === 404 ? 'La implementación o versión no está disponible en esta empresa.' : error.message}{error.correlationId && ` Referencia de soporte: ${error.correlationId}`}{error.retryAfter !== undefined && ` El servidor indicó esperar ${error.retryAfter} segundos antes de reintentar.`}</Alert>; }
export function ControlPager({ page, more, label, load }: { page: number; more: boolean; label: string; load: (page: number) => void }) { return <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}><Button disabled={!page} aria-label={'Anterior en ' + label} onClick={() => load(page - 1)}>Anterior</Button><Typography>Página {page + 1}</Typography><Button disabled={!more} aria-label={'Siguiente en ' + label} onClick={() => load(page + 1)}>Siguiente</Button></Stack>; }
function Details({ rows }: { rows: [string, ReactNode][] }) { return <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px,1fr) minmax(0,2fr)' }, gap: 1, '& dt': { color: 'text.secondary' }, '& dd': { m: 0, mb: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } }}>{rows.map(([key, value]) => <Box key={key} sx={{ display: 'contents' }}><Typography component="dt">{key}</Typography><Typography component="dd">{value}</Typography></Box>)}</Box>; }
type Props = { company: string; controlId: string; service: ControlService; zone: string } & ControlAccess;
export default function ControlPanel({ company, controlId, service, zone, scope, onAuthorization }: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const load = useCallback(async (signal: AbortSignal) => { if (!uuid.test(controlId)) throw new ApiError(404, 'IMPLEMENTACION_NO_DISPONIBLE', 'Implementación no disponible.'); return validateControl(await service.detail(company, controlId, signal), controlId); }, [company, controlId, service]);
  const state = useControlRead(load, { scope, onAuthorization });
  return <Stack spacing={2} sx={{ mt: 2, overflowWrap: 'anywhere' }} aria-busy={state.loading}>
    {state.loading && <Typography role="status">Consultando implementación de control…</Typography>}{state.error && <ControlError error={state.error} />}<Button disabled={state.loading} onClick={state.retry}>Actualizar implementación de control</Button>
    {state.data && <><Typography variant="h2" component="h4">{state.data.versionActual.detalle.nombre}</Typography><Details rows={[
      ['Estado de implementación', controlLabels[state.data.estado]], ['Resultado vigente del servidor', controlLabels[state.data.resultadoVigente]], ['Revisión de implementación', state.data.revision],
    ]} />{state.data.causaSinVigencia && <Alert severity="warning">Sin vigencia: {controlLabels[state.data.causaSinVigencia]}. Consulta el contexto y las evidencias antes de utilizar esta verificación.</Alert>}
      <Typography variant="body2">Esta es una implementación empresarial. Su estado y verificación no son la nota del catálogo ni una reducción automática del riesgo.</Typography>
      <VersionBlock {...{ company, service, zone, scope, onAuthorization }} control={state.data} version={state.data.versionActual} />
      <Box component="details"><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Referencias de catálogo e implementación</Typography><Details rows={[
        ['Implementación', state.data.implementacionId], ['Versión de catálogo', state.data.versionCatalogoId], ['Elemento de catálogo', state.data.elementoId], ['Última verificación (referencia)', state.data.ultimaVerificacionId || 'No registrada'],
      ]} /></Box>
      <Box component="details" onToggle={event => setHistoryOpen(event.currentTarget.open)}><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Historial de versiones del control</Typography>
        {historyOpen && <Versions {...{ company, service, zone, scope, onAuthorization }} control={state.data} />}
      </Box>
    </>}
  </Stack>;
}
function VersionBlock({ company, service, zone, scope, onAuthorization, control, version }: Omit<Props, 'controlId'> & { control: Control; version: Version }) {
  const [open, setOpen] = useState(false);
  return <Paper component="article" sx={{ p: 2 }}><Stack spacing={2}><Typography variant="h2" component="h5">Versión {version.numero} · {version.versionId === control.versionActual.versionId ? 'Actual según la ficha' : 'Histórica'}</Typography><Details rows={[
    ['Descripción', version.detalle.descripcion], ['Alcance', version.detalle.alcance], ['Trabajo de implementación', version.detalle.trabajo], ['Responsable de negocio', version.detalle.responsableId], ['Tipo', version.detalle.tipo ? controlLabels[version.detalle.tipo] : 'Pendiente'], ['Modo', version.detalle.modo ? controlLabels[version.detalle.modo] : 'Pendiente'], ['Motivo de cambio', version.motivoCambio || 'No registrado'], ['Creada', timestamp(version.creadaEn, zone)],
    ['Aplicación registrada', version.aplicacion ? date(version.aplicacion.fechaAplicacion) : 'Pendiente de registrar'],
  ]} />{version.aplicacion && <Typography>Evidencia de aplicación: {version.aplicacion.evidenciaId} · Registrada por: {version.aplicacion.registradaPor} · {timestamp(version.aplicacion.registradaEn, zone)}</Typography>}
    <Box component="details"><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Referencias de esta versión de control</Typography><Typography>Versión: {version.versionId} · Creada por: {version.creadaPor}</Typography></Box>
    <Box component="details" onToggle={event => setOpen(event.currentTarget.open)}><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Verificaciones de versión {version.numero}</Typography>{open && <Verifications {...{ company, service, zone, scope, onAuthorization, control, version }} />}</Box>
  </Stack></Paper>;
}
function Versions({ company, service, zone, scope, onAuthorization, control }: Omit<Props, 'controlId'> & { control: Control }) {
  const [page, setPage] = useState(0);
  const load = useCallback(async (signal: AbortSignal) => validatePage(await service.versions(company, control.implementacionId, page, signal), page, validateVersion), [company, control.implementacionId, service, page]);
  const state = useControlRead(load, { scope, onAuthorization });
  return <Stack spacing={2} sx={{ mt: 2 }} aria-busy={state.loading}>{state.loading && <Typography role="status">Consultando versiones de control…</Typography>}{state.error && <ControlError error={state.error} />}<Button disabled={state.loading} onClick={state.retry}>Actualizar versiones de control</Button>
    {state.data && <>{!state.data.elementos.length && <Typography>No hay versiones en esta página.</Typography>}{state.data.elementos.map(version => <VersionBlock key={version.versionId} {...{ company, service, zone, scope, onAuthorization, control, version }} />)}<ControlPager page={page} more={state.data.hayMas} label="versiones de control" load={setPage} /></>}
  </Stack>;
}
function Verifications({ company, service, zone, scope, onAuthorization, control, version }: Omit<Props, 'controlId'> & { control: Control; version: Version }) {
  const [page, setPage] = useState(0);
  const load = useCallback(async (signal: AbortSignal) => validatePage(await service.verifications(company, control.implementacionId, version.versionId, page, signal), page, value => validateVerification(value, version.versionId)), [company, control.implementacionId, version.versionId, service, page]);
  const state = useControlRead(load, { scope, onAuthorization });
  return <Stack spacing={2} sx={{ mt: 2 }} aria-busy={state.loading}>{state.loading && <Typography role="status">Consultando verificaciones de control…</Typography>}{state.error && <ControlError error={state.error} />}<Button disabled={state.loading} onClick={state.retry}>Actualizar verificaciones de control</Button>
    {state.data && <>{!state.data.elementos.length && <Typography>No hay verificaciones en esta página. No equivale a un resultado no efectivo.</Typography>}{state.data.elementos.map(v => <Box component="article" key={v.verificacionId}>
      <Typography sx={{ fontWeight: 600 }}>{controlLabels[v.resultado]} · {version.versionId === control.versionActual.versionId && v.verificacionId === control.ultimaVerificacionId ? 'Última verificación según ficha' : 'Antecedente; no acredita vigencia'}</Typography><Details rows={[
        ['Prueba realizada', v.prueba], ['Fundamento', v.fundamento], ['Criterios cumplidos / evaluados', `${v.criteriosCumplidos} / ${v.criteriosEvaluados}`], ['Próxima revisión', date(v.proximaRevision)], ['Verificada', timestamp(v.verificadaEn, zone)], ['Autor de verificación', v.verificadaPor], ['Revisión registrada al verificar', v.revisionImplementacion], ['Evidencia de verificación', v.evidenciaId], ['Verificación (identificador)', v.verificacionId],
      ]} />
    </Box>)}<ControlPager page={page} more={state.data.hayMas} label={'verificaciones de versión ' + version.numero} load={setPage} /></>}
  </Stack>;
}
