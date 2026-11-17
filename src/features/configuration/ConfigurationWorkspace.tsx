import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../shared/api/client';
import { capabilities } from '../access/workspace';
import type { Company } from '../access/workspace';
import { validateConfiguration } from './configuration';
import type { Configuration, ConfigurationService } from './configuration';
import ConfigurationEditor from './ConfigurationEditor';
export type Access = { scope?: AbortSignal; onAuthorization: (error: ApiError) => void };
export function ConfigurationError({ error }: { error: ApiError }) {
  return <Alert severity="error">{error.status === 404 ? 'La configuración no está disponible en esta empresa.' : error.message}{error.correlationId && ` Referencia de soporte: ${error.correlationId}`}{error.retryAfter !== undefined && ` Espera indicada por el servidor: ${error.retryAfter} segundos.`}</Alert>;
}
export default function ConfigurationWorkspace({ company, service, scope, onAuthorization, onDirty, onPending, onLeave, onContextRefresh }: { company: Company; service: ConfigurationService; onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void; onLeave: () => boolean; onContextRefresh: () => Promise<void> } & Access) {
  const [data, setData] = useState<Configuration>(); const [error, setError] = useState<ApiError>(); const [loading, setLoading] = useState(true); const [attempt, setAttempt] = useState(0); const [editing, setEditing] = useState(false); const [notice, setNotice] = useState('');
  const heading = useRef<HTMLHeadingElement>(null); const active = useRef<AbortController | undefined>(undefined); const allowed = capabilities(company).read;
  useEffect(() => {
    const request = active.current = new AbortController(); setData(undefined); setError(undefined); setLoading(true);
    if (!allowed || scope?.aborted) { setLoading(false); return () => request.abort(); }
    void service.read(company.empresaId, request.signal).then(value => { if (!request.signal.aborted && !scope?.aborted) { setData(validateConfiguration(value)); if (attempt > 0) void onContextRefresh(); } }).catch(failure => {
      if (request.signal.aborted || scope?.aborted) return; const problem = failure instanceof ApiError ? failure : new ApiError(502, 'CONSULTA_NO_DISPONIBLE', 'No pudimos consultar la configuración. Puedes volver a intentar.'); setError(problem); if ([401, 403].includes(problem.status)) onAuthorization(problem);
    }).finally(() => { if (!request.signal.aborted && !scope?.aborted) setLoading(false); });
    return () => request.abort();
  }, [company.empresaId, allowed, service, attempt, scope, onAuthorization, onContextRefresh]);
  useEffect(() => { if (!loading && !editing) heading.current?.focus(); }, [loading, editing]);
  if (!allowed) return <Alert severity="warning">La configuración requiere AE, GS o AU en esta empresa.</Alert>;
  if (editing && data) return <ConfigurationEditor company={company} initial={data} service={service} scope={scope} onAuthorization={onAuthorization} onDirty={onDirty} onPending={onPending} onCancel={() => { if (onLeave()) { setEditing(false); setData(undefined); setLoading(true); setAttempt(value => value + 1); } }} onSaved={latest => { setData(latest); setEditing(false); setNotice('Guardado confirmado. Se muestra la configuración consultada después del guardado; revisa su revisión vigente.'); void onContextRefresh(); }} onReconciled={latest => { setData(latest); setEditing(false); setNotice('Configuración consultada de nuevo. Revisa los datos vigentes antes de volver a editar; esta consulta no atribuye un cambio a una solicitud incierta.'); void onContextRefresh(); }} />;
  return <Stack component="section" spacing={3} aria-labelledby="configuration-title" aria-busy={loading} sx={{ overflowWrap: 'anywhere' }}>
    <Typography id="configuration-title" variant="h2" tabIndex={-1} ref={heading}>Configuración empresarial</Typography>
    <Typography>Datos básicos de la empresa activa. AE puede editar; GS y AU consultan. La zona horaria rige la interpretación de fechas límite futuras; los eventos históricos conservan sus instantes absolutos.</Typography>
    {notice && <Alert severity="info">{notice}</Alert>}{loading && <Typography role="status">Consultando configuración empresarial…</Typography>}{error && <ConfigurationError error={error} />}
    {data && <Paper sx={{ p: 2 }}><Box component="dl" sx={{ m: 0, '& dt': { fontWeight: 600 }, '& dd': { m: 0, mb: 2, whiteSpace: 'pre-wrap' } }}>{[['Nombre', data.nombre], ['Descripción', data.descripcion?.trim() ? data.descripcion : 'Sin descripción registrada'], ['Zona horaria', data.zonaHoraria], ['Revisión consultada', String(data.revision)]].map(([label, value]) => <Box key={label}><Typography component="dt">{label}</Typography><Typography component="dd">{value}</Typography></Box>)}</Box></Paper>}
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}>{data && capabilities(company).admin && <Button variant="contained" onClick={() => { setNotice(''); setEditing(true); }}>Editar configuración</Button>}<Button disabled={loading} onClick={() => { active.current?.abort(); setData(undefined); setError(undefined); setNotice(''); setLoading(true); setAttempt(value => value + 1); }}>{error ? 'Reintentar configuración' : 'Actualizar configuración'}</Button></Stack>
  </Stack>;
}
