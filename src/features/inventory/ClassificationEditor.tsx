import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ApiError } from '../../shared/api/client';
import { ClassificationStore } from './classification';
import { levels, personalTypes } from './inventory';
import type { InventoryService, ValuationEntries } from './inventory';

const fieldStyle = { width: '100%', minHeight: 44, px: 1.5, py: 1, border: 1, borderColor: 'divider', borderRadius: 1,
  bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
const triState = (value?: boolean | null) => value == null ? '' : value ? 'SI' : 'NO';
const booleanValue = (value: string) => value === 'SI' ? true : value === 'NO' ? false : null;
export default function ClassificationEditor({ companyId, assetId, service, onAuthorization, onDirty, onPending, onCancel, onDone }: {
  companyId: string; assetId: string; service: InventoryService; onAuthorization: (error: ApiError) => void;
  onDirty: (dirty: boolean) => void; onPending: (pending: boolean) => void; onCancel: () => void; onDone: () => void;
}) {
  const [store] = useState(() => new ClassificationStore(companyId, assetId, service, onAuthorization, onDirty, onPending));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { void store.load(); return () => store.dispose(); }, [store]);
  useEffect(() => { if (state.status !== 'loading') heading.current?.focus(); }, [state.status]);
  const entries = state.entries;
  const fieldError = (key: string) => state.error?.fields.find(field => field.field === key || field.field === 'entradas.' + key)?.message;
  const help = (key: string) => fieldError(key) && <Typography id={'classification-error-' + key} role="alert" color="error">{fieldError(key)}</Typography>;
  const invalid = (key: string) => Boolean(fieldError(key));
  function change<K extends keyof ValuationEntries>(key: K, value: ValuationEntries[K]) { store.change({ ...entries, [key]: value }); }
  function personal(value: string) {
    const next = booleanValue(value);
    const hasDependent = entries.contieneDatosMenores != null || Boolean(entries.tiposDatosPersonales?.length || entries.finalidadTratamiento || entries.autorizacionTratamiento || entries.justificacionNoAplica);
    if (next !== true && hasDependent && !window.confirm('Se retirarán los datos dependientes de la declaración personal de este borrador. ¿Continuar?')) return;
    store.change({ ...entries, contieneDatosPersonales: next, ...(next !== true ? { contieneDatosMenores: null, tiposDatosPersonales: [], finalidadTratamiento: null, autorizacionTratamiento: null, justificacionNoAplica: null } : {}) });
  }
  const reload = () => { if (window.confirm('Se descartarán los cambios locales y se consultará la clasificación actual. ¿Continuar?')) void store.load(); };
  return <Stack component="section" aria-labelledby="classification-title" spacing={3} aria-busy={state.pending || state.status === 'loading'}>
    <Typography id="classification-title" variant="h2" tabIndex={-1} ref={heading}>Clasificar activo</Typography>
    {state.status === 'loading' && <Typography role="status">Consultando el activo y sus versiones actuales…</Typography>}
    {state.error && <Alert severity="error"><Stack spacing={1}><Typography>{state.error.message}</Typography>
      {state.error.correlationId && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>Referencia de soporte: {state.error.correlationId}</Typography>}
      {state.error.retryAfter !== undefined && <Typography>El servidor indicó esperar {state.error.retryAfter} segundos antes de reintentar.</Typography>}
    </Stack></Alert>}
    {state.blocked && <Alert severity="warning">No se reenvía la operación. Si hubo un fallo de conexión o servicio, puede haberse aplicado en el servidor. Consulta el estado actual antes de continuar.</Alert>}
    {state.notice && <Alert severity="success">{state.notice}</Alert>}
    {state.asset && <Typography sx={{ overflowWrap: 'anywhere' }}>{state.asset.codigo} · {state.asset.nombre}</Typography>}
    {state.status === 'confirmed' && state.draft && <Paper sx={{ p: 2 }}><Stack spacing={2}>
      <Typography variant="h2">Versión {state.draft.numero} · Vigente</Typography>
      <Typography>Criticidad confirmada: {state.draft.criticidad} · {state.draft.nivel ? levels[state.draft.nivel] : 'Pendiente'}</Typography>
      <Typography>El servidor confirmó la versión y actualizó la ficha. Las versiones anteriores se conservan.</Typography>
      <Button variant="contained" onClick={onDone}>Volver a la ficha actualizada</Button>
    </Stack></Paper>}
    {state.status === 'ready' && <>
      <Alert severity="info">{state.draft ? `Continuando el borrador existente: versión ${state.draft.numero}, revisión ${state.draft.revision}.`
        : state.source ? `Nueva revisión a partir de la versión vigente ${state.source.numero}. Se copiaron sus entradas reales; aún no se ha creado un borrador.`
          : 'Primera clasificación. Los valores ausentes permanecen pendientes; aún no se ha creado un borrador.'}</Alert>
      {state.source && <Typography color="text.secondary">Vigente anterior: versión {state.source.numero} · Criticidad {state.source.criticidad} · {state.source.nivel ? levels[state.source.nivel] : 'Pendiente'}. Se mantiene hasta confirmar otra versión.</Typography>}
      <Box component="form" aria-label="Formulario de clasificación" onSubmit={event => { event.preventDefault(); void store.save(); }}>
        <Stack spacing={3}>
          <Typography color="text.secondary">Guardar admite campos pendientes; las declaraciones condicionales deben ser coherentes. Confirmar publica la versión guardada y requiere completar las condiciones del servidor. La criticidad no se calcula en el formulario.</Typography>
          <Box component="fieldset" disabled={state.pending || state.blocked} sx={{ border: 0, m: 0, p: 0, minWidth: 0 }}><Stack spacing={2}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,minmax(0,1fr))' }, gap: 2 }}>
              {(['confidencialidad', 'integridad', 'disponibilidad'] as const).map(key => <Stack key={key} spacing={1}>
                <Typography component="label" htmlFor={'classification-' + key}>{key[0].toUpperCase() + key.slice(1)}</Typography>
                <Box component="select" id={'classification-' + key} value={entries[key] ?? ''} onChange={event => change(key, event.target.value ? Number(event.target.value) as 1 | 3 | 5 : null)} sx={fieldStyle}
                  aria-invalid={invalid(key)} aria-describedby={fieldError(key) ? 'classification-error-' + key : undefined}>
                  <option value="">Pendiente</option><option value="1">1 · Baja</option><option value="3">3 · Media</option><option value="5">5 · Alta</option>
                </Box>{help(key)}
              </Stack>)}
            </Box>
            <Stack spacing={1}><Typography component="label" htmlFor="classification-foundation">Fundamento</Typography><Box component="textarea" id="classification-foundation" rows={4} value={entries.fundamento || ''} onChange={event => change('fundamento', event.target.value)} sx={fieldStyle} aria-invalid={invalid('fundamento')} />{help('fundamento')}</Stack>
            <Stack spacing={1}><Typography component="label" htmlFor="classification-personal">¿Contiene datos personales?</Typography><Box component="select" id="classification-personal" value={triState(entries.contieneDatosPersonales)} onChange={event => personal(event.target.value)} sx={fieldStyle} aria-invalid={invalid('contieneDatosPersonales')}><option value="">Pendiente</option><option value="SI">Sí</option><option value="NO">No</option></Box>{help('contieneDatosPersonales')}</Stack>
            <Typography variant="body2" color="text.secondary">Elegir No o Pendiente retira los campos personales dependientes, previa confirmación si contienen datos.</Typography>
            {entries.contieneDatosPersonales === true ? <>
              <Stack spacing={1}><Typography component="label" htmlFor="classification-minors">¿Incluye datos de menores?</Typography><Box component="select" id="classification-minors" value={triState(entries.contieneDatosMenores)} onChange={event => change('contieneDatosMenores', booleanValue(event.target.value))} sx={fieldStyle} aria-invalid={invalid('contieneDatosMenores')}><option value="">Pendiente</option><option value="SI">Sí</option><option value="NO">No</option></Box>{help('contieneDatosMenores')}</Stack>
              <Box component="fieldset" sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 2 }}><Typography component="legend">Tipos de datos personales</Typography>
                <Stack spacing={1}>{Object.entries(personalTypes).map(([key, label]) => <Typography component="label" key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 44 }}>
                  <Box component="input" type="checkbox" checked={entries.tiposDatosPersonales?.includes(key as keyof typeof personalTypes) || false} onChange={event => {
                    const type = key as keyof typeof personalTypes; const types = entries.tiposDatosPersonales || [];
                    change('tiposDatosPersonales', event.target.checked ? [...types, type] : types.filter(value => value !== type));
                  }} /> {label}
                </Typography>)}</Stack>{help('tiposDatosPersonales')}
              </Box>
              <Stack spacing={1}><Typography component="label" htmlFor="classification-purpose">Finalidad del tratamiento</Typography><Box component="textarea" id="classification-purpose" rows={3} value={entries.finalidadTratamiento || ''} onChange={event => change('finalidadTratamiento', event.target.value)} sx={fieldStyle} aria-invalid={invalid('finalidadTratamiento')} />{help('finalidadTratamiento')}</Stack>
              <Stack spacing={1}><Typography component="label" htmlFor="classification-authorization">Autorización declarada</Typography><Box component="select" id="classification-authorization" value={entries.autorizacionTratamiento || ''} sx={fieldStyle} aria-invalid={invalid('autorizacionTratamiento')} onChange={event => {
                const value = event.target.value as ValuationEntries['autorizacionTratamiento'];
                if (value !== 'NO_APLICA' && entries.justificacionNoAplica && !window.confirm('Se retirará la justificación de no aplica de este borrador. ¿Continuar?')) return;
                store.change({ ...entries, autorizacionTratamiento: value || null, justificacionNoAplica: value === 'NO_APLICA' ? entries.justificacionNoAplica : null });
              }}><option value="">Pendiente</option><option value="SI">Sí</option><option value="NO">No</option><option value="NO_APLICA">No aplica</option></Box>{help('autorizacionTratamiento')}</Stack>
              {entries.autorizacionTratamiento === 'NO_APLICA' && <Stack spacing={1}><Typography component="label" htmlFor="classification-justification">Justificación de no aplica</Typography><Box component="textarea" id="classification-justification" maxLength={2000} rows={3} value={entries.justificacionNoAplica || ''} onChange={event => change('justificacionNoAplica', event.target.value)} sx={fieldStyle} aria-invalid={invalid('justificacionNoAplica')} />{help('justificacionNoAplica')}</Stack>}
            </> : <Typography color="text.secondary">Campos personales dependientes: {entries.contieneDatosPersonales === false ? 'No aplica' : 'Pendientes de definir aplicabilidad'}.</Typography>}
            {!state.draft ? <Stack spacing={1}><Typography component="label" htmlFor="classification-reason">Motivo de revisión{state.source ? ' (necesario para una nueva versión)' : ' (opcional)'}</Typography><Box component="textarea" id="classification-reason" rows={3} maxLength={1000} value={state.reason} onChange={event => store.reason(event.target.value)} sx={fieldStyle} aria-invalid={invalid('motivoRevision')} />{help('motivoRevision')}</Stack>
              : <Typography>Motivo registrado: {state.reason || 'No registrado'}.</Typography>}
          </Stack></Box>
          <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}>
            <Button type="submit" variant="contained" disabled={state.pending || state.blocked || Boolean(state.draft && !state.dirty)}>{state.pending ? 'Procesando…' : 'Guardar borrador'}</Button>
            <Button disabled={state.pending || state.blocked || state.dirty || !state.draft} onClick={() => {
              const value = state.draft;
              if (value && window.confirm(`¿Confirmar la versión ${value.numero} guardada? C/I/D: ${value.entradas.confidencialidad ?? 'Pendiente'}/${value.entradas.integridad ?? 'Pendiente'}/${value.entradas.disponibilidad ?? 'Pendiente'}. El servidor comprobará los requisitos y publicará su criticidad.`)) void store.confirm();
            }}>Confirmar versión guardada</Button>
          </Stack>
          {state.dirty && <Typography role="status">Hay cambios sin guardar. Guarda el borrador antes de confirmar.</Typography>}
        </Stack>
      </Box>
    </>}
    {state.status !== 'confirmed' && <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}>
      <Button disabled={state.pending} onClick={onCancel}>Volver a la ficha</Button>
      {state.status === 'error' || state.blocked ? <Button disabled={state.pending} onClick={reload}>Descartar cambios y consultar estado actual</Button> : null}
    </Stack>}
  </Stack>;
}
