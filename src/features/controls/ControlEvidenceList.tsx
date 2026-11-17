import { Alert, Button, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../../shared/api/client';
import { timestamp } from '../dashboard/panel';
import { ControlError, ControlPager, useControlRead } from './ControlPanel';
import { validateEvidence, validatePage } from './controls';
import type { ControlService, Evidence } from './controls';
export default function ControlEvidenceList({ company, controlId, versionId, zone, service, scope, onAuthorization }: {
  company: string; controlId: string; versionId: string; zone: string; service: ControlService; scope?: AbortSignal; onAuthorization: (error: ApiError) => void;
}) {
  const [page, setPage] = useState(0); const [downloading, setDownloading] = useState<string>(); const [error, setError] = useState<ApiError>();
  const load = useCallback(async (signal: AbortSignal) => validatePage(await service.evidence(company, controlId, versionId, page, signal), page, validateEvidence), [company, controlId, versionId, page, service]);
  const state = useControlRead(load, { scope, onAuthorization });
  const alive = useRef(false); const busy = useRef(false); const request = useRef<AbortController | undefined>(undefined); const urls = useRef(new Map<string, number>());
  useEffect(() => { alive.current = true; const resources = urls.current; return () => { alive.current = false; request.current?.abort(); resources.forEach((timer, url) => { window.clearTimeout(timer); URL.revokeObjectURL(url); }); resources.clear(); }; }, []);
  const current = () => alive.current && !scope?.aborted && !request.current?.signal.aborted;
  async function download(item: Evidence) {
    if (busy.current || scope?.aborted) return; busy.current = true; request.current = new AbortController(); setDownloading(item.evidenciaId); setError(undefined);
    try {
      const blob = await service.file(company, controlId, versionId, item.evidenciaId, request.current.signal); if (!current()) return;
      if (!(blob instanceof Blob) || blob.type !== item.tipoDetectado || blob.size !== item.tamanoBytes) throw new ApiError(502, 'RESPUESTA_INVALIDA', 'El archivo recibido no coincide con el tipo o tamaño registrado.');
      const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
      const extension = blob.type === 'application/pdf' ? 'pdf' : blob.type === 'image/png' ? 'png' : 'jpg';
      const name = item.nombreOriginal.replace(/[\\/\p{Cc}\p{Cf}]/gu, '_').slice(0, 180) || 'evidencia';
      const suffix = blob.type === 'image/jpeg' ? /\.jpe?g$/i : new RegExp('\\.' + extension + '$', 'i');
      anchor.href = url; anchor.download = suffix.test(name) ? name : name + '.' + extension; anchor.hidden = true;
      document.body.append(anchor); anchor.click(); anchor.remove();
      urls.current.set(url, window.setTimeout(() => { URL.revokeObjectURL(url); urls.current.delete(url); }, 1000));
    } catch (failure) {
      if (!current()) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo descargar la evidencia.'); setError(problem); if ([401, 403].includes(problem.status)) onAuthorization(problem);
    } finally { busy.current = false; if (current()) setDownloading(undefined); }
  }
  return <Stack spacing={2} aria-busy={state.loading || Boolean(downloading)} sx={{ mt: 2 }}>
    <Typography>La inspección mostrada es el último estado registrado. El servidor vuelve a inspeccionar y autorizar cada descarga. Un adjunto no acredita por sí solo aplicación o efectividad.</Typography>
    {state.loading && <Typography role="status">Consultando evidencias de control…</Typography>}{(error || state.error) && <ControlError error={(error || state.error)!} />}
    {error?.code === 'EVIDENCIA_BLOQUEADA' && <Alert severity="warning">El archivo no pasó la inspección actual y no se descargó.</Alert>}
    <Button disabled={state.loading || Boolean(downloading)} onClick={() => { setError(undefined); state.retry(); }}>Actualizar evidencias de control</Button>
    {state.data && <>{!state.data.elementos.length && <Typography>No hay evidencias en esta página de la versión.</Typography>}{state.data.elementos.map(item => <Stack component="article" key={item.evidenciaId} spacing={1}><Typography sx={{ fontWeight: 600 }}>{item.nombreOriginal}</Typography><Typography>{item.descripcion || 'Sin descripción'} · {item.tamanoBytes} bytes · {timestamp(item.creadaEn, zone)}</Typography><Typography>Inspección registrada: {({ LIMPIA: 'Limpia', PENDIENTE: 'Pendiente', ERROR: 'Error' })[item.estadoInspeccion]}</Typography><Button disabled={Boolean(downloading)} aria-label={'Descargar ' + item.nombreOriginal} onClick={() => { void download(item); }}>{downloading === item.evidenciaId ? 'Descargando…' : 'Descargar archivo'}</Button></Stack>)}<ControlPager page={page} more={state.data.hayMas} label="evidencias de control" load={value => { if (!busy.current) setPage(value); }} /></>}
  </Stack>;
}
