import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { capabilities } from '../access/workspace';
import type { Company } from '../access/workspace';
import { timestamp } from '../dashboard/panel';
import { effectiveFilters, filterFields, validatePage } from './activity';
import type { ActivityService, Filters, Page } from './activity';

export default function ActivityWorkspace({ company, service, scope, onAuthorization }: { company: Company; service: ActivityService; scope?: AbortSignal; onAuthorization: (error: ApiError) => void }) {
  const [draft, setDraft] = useState<Filters>({});
  const [request, setRequest] = useState<{ filters: Filters; cursors: (string | undefined)[] }>({ filters: {}, cursors: [undefined] });
  const [data, setData] = useState<Page>(); const [error, setError] = useState<ApiError>(); const [formError, setFormError] = useState<ApiError>(); const [loading, setLoading] = useState(true);
  const heading = useRef<HTMLHeadingElement>(null); const resultHeading = useRef<HTMLHeadingElement>(null); const controller = useRef<AbortController | undefined>(undefined); const interacted = useRef(false);
  const allowed = capabilities(company).admin;
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => {
    const task = controller.current = new AbortController(); setData(undefined); setError(undefined); setLoading(true);
    if (!allowed || scope?.aborted) { setLoading(false); return () => task.abort(); }
    void service.list(company.empresaId, request.filters, request.cursors.at(-1), task.signal).then(page => { if (!task.signal.aborted && !scope?.aborted) setData(validatePage(page, request.cursors)); }).catch(failure => {
      if (task.signal.aborted || scope?.aborted) return;
      const problem = failure instanceof ApiError ? failure : new ApiError(502, 'CONSULTA_NO_DISPONIBLE', 'No pudimos consultar la actividad. Puedes volver a intentar.'); setError(problem); if ([401, 403].includes(problem.status)) onAuthorization(problem);
    }).finally(() => { if (!task.signal.aborted && !scope?.aborted) setLoading(false); });
    return () => task.abort();
  }, [company.empresaId, allowed, service, request, scope, onAuthorization]);
  useEffect(() => { if (!loading && data && interacted.current) resultHeading.current?.focus(); }, [loading, data]);
  let dirty = true; try { dirty = JSON.stringify(effectiveFilters(draft)) !== JSON.stringify(request.filters); } catch { /* Invalid filters cannot continue an old cursor. */ }
  function load(next: typeof request) { controller.current?.abort(); interacted.current = true; setData(undefined); setError(undefined); setFormError(undefined); setLoading(true); setRequest(next); }
  function apply(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (loading || !allowed || scope?.aborted) return; try { load({ filters: effectiveFilters(draft), cursors: [undefined] }); } catch (failure) { setFormError(failure as ApiError); } }
  if (!allowed) return <Alert severity="warning">El registro de actividad requiere el rol AE en esta empresa.</Alert>;
  return <Stack component="section" spacing={3} aria-labelledby="activity-title" sx={{ overflowWrap: 'anywhere' }}>
    <Typography id="activity-title" variant="h2" tabIndex={-1} ref={heading}>Actividad empresarial</Typography>
    <Typography>Registro de solo lectura para AE. Reúne eventos administrativos y operativos de la empresa activa; no permite editar ni borrar eventos.</Typography>
    <Box component="form" aria-label="Filtros de actividad" onSubmit={apply}><Box component="fieldset" disabled={loading} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}><Stack spacing={2}>
      <Typography>Las fechas requieren hora y zona explícita: Z para UTC o un desplazamiento como -05:00. Desde incluye el instante; Hasta lo excluye. No se usa automáticamente la zona de tu PC.</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2,minmax(0,1fr))' }, gap: 2 }}>{filterFields.map(field => <TextField key={field.key} label={field.label} placeholder={field.hint} value={draft[field.key] || ''} slotProps={{ htmlInput: { maxLength: field.max } }} onChange={event => { setDraft(previous => ({ ...previous, [field.key]: event.target.value })); setFormError(undefined); }} />)}</Box>
      <Typography variant="body2">Filtros combinados por coincidencia exacta. Actor identifica al usuario, no a su membresía. Un código válido sin coincidencias devuelve una página vacía.</Typography>
      <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button type="submit" variant="contained">Aplicar filtros</Button><Button onClick={() => { setDraft({}); load({ filters: {}, cursors: [undefined] }); }}>Restablecer filtros</Button></Stack>
    </Stack></Box></Box>
    {formError && <Alert severity="error">{formError.message}</Alert>}
    {dirty && data && <Alert severity="warning">Hay filtros sin aplicar. La página corresponde a los filtros aplicados; aplícalos antes de continuar.</Alert>}
    <Box component="section" aria-label="Resultados de actividad" aria-busy={loading}>
      <Typography variant="h2" ref={resultHeading} tabIndex={-1}>Eventos · Página {request.cursors.length}</Typography>
      <Typography>Instantes mostrados en {company.zonaHoraria}, con el instante original disponible en cada evento. Orden del servidor: más reciente primero. No se conoce el total de páginas; la consulta no es una instantánea inmutable.</Typography>
      <Box component="dl" sx={{ '& dt': { fontWeight: 600 }, '& dd': { m: 0, mb: 1 } }}>{filterFields.map(field => <Box key={field.key}><Typography component="dt">{field.label}</Typography><Typography component="dd">{request.filters[field.key] || 'Sin filtro'}</Typography></Box>)}</Box>
      {loading && <Typography role="status">Consultando actividad empresarial…</Typography>}
      {error && <Alert severity="error">{error.status === 404 ? 'El registro no está disponible en esta empresa.' : error.message}{error.correlationId && ` Referencia de soporte: ${error.correlationId}`}{error.retryAfter !== undefined && ` Espera indicada: ${error.retryAfter} segundos.`}</Alert>}
      {data && !data.elementos.length && <Alert severity="info">No hay eventos que coincidan con los filtros aplicados en esta página.</Alert>}
      <Stack component="ol" aria-label="Eventos de actividad" spacing={2} sx={{ pl: 0, listStyle: 'none' }}>{data?.elementos.map(event => <Paper component="li" key={event.origen + ':' + event.eventoId} sx={{ p: 2 }}><Typography component="h3" variant="h2">{event.accion}</Typography><Typography>{event.origen === 'ADMINISTRATIVA' ? 'Origen administrativo' : 'Origen operativo'} · Evento {event.eventoId}</Typography><Typography component="time" dateTime={event.registradoEn}>{timestamp(event.registradoEn, company.zonaHoraria)}</Typography><Typography variant="body2">Instante original: {event.registradoEn}</Typography><Box component="dl" sx={{ '& dt': { fontWeight: 600 }, '& dd': { m: 0, mb: 1, whiteSpace: 'pre-wrap' } }}>{[['Actor (usuario)', event.actorId], ['Tipo de objeto', event.tipoObjeto], ['Objeto', event.objetoId], ['Resultado registrado', event.resultado], ['Motivo', event.motivo?.trim() ? event.motivo : 'Sin motivo registrado'], ['Correlación', event.correlacionId]].map(([label, value]) => <Box key={label}><Typography component="dt">{label}</Typography><Typography component="dd">{value}</Typography></Box>)}</Box></Paper>)}</Stack>
      <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap', mt: 2 }}><Button disabled={loading || dirty || request.cursors.length === 1} onClick={() => load({ ...request, cursors: request.cursors.slice(0, -1) })}>Anterior en actividad</Button><Button disabled={loading || dirty || !data?.siguienteCursor} onClick={() => { if (data?.siguienteCursor) load({ ...request, cursors: [...request.cursors, data.siguienteCursor] }); }}>Siguiente en actividad</Button><Button disabled={loading} onClick={() => load({ filters: request.filters, cursors: [undefined] })}>{error ? 'Reintentar actividad desde el inicio' : 'Actualizar actividad desde el inicio'}</Button></Stack>
    </Box>
  </Stack>;
}
