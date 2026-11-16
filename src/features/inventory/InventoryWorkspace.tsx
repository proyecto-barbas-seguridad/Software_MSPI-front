import { Alert, Box, Button, Chip, Link, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ApiError } from '../../shared/api/client';
import { accessMessage } from '../access/workspace';
import type { Company } from '../access/workspace';
import { timestamp } from '../dashboard/panel';
import { assetStates, assetTypes, InventoryStore, levels, personalTypes } from './inventory';
import type { AssetQuery, HistoryPage, InventoryService, InventoryState, ValuationPage } from './inventory';

const fieldStyle = { width: '100%', minHeight: 44, px: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
const missing = (value?: string | null) => value?.trim() ? value : 'Pendiente';
const yesNo = (value?: boolean | null) => value == null ? 'Pendiente' : value ? 'Sí' : 'No';
const reference = (value: NonNullable<HistoryPage['elementos'][number]['referencias']>['anteriores']) => value
  ? `Proceso: ${value.procesoId} · Propietario: ${value.propietarioId} · Custodio: ${value.custodioId || 'No registrado'}` : 'Sin referencias registradas';
function Details({ children }: { children: ReactNode }) {
  return <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(150px,1fr) minmax(0,2fr)' }, gap: 1, '& dd': { m: 0, mb: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }, '& dt': { color: 'text.secondary' } }}>{children}</Box>;
}
function Pager({ label, page, more, load }: { label: string; page: number; more: boolean; load: (page: number) => void }) {
  return <Stack direction="row" useFlexGap sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }} aria-label={`Paginación de ${label}`}>
    <Button disabled={page === 0} aria-label={`Anterior en ${label}`} onClick={() => load(page - 1)}>Anterior</Button>
    <Typography>Página {page + 1}</Typography>
    <Button disabled={!more} aria-label={`Siguiente en ${label}`} onClick={() => load(page + 1)}>Siguiente</Button>
  </Stack>;
}
export function InventoryWorkspace({ company, assetId, query, service, onQuery, onAuthorization }: {
  company: Company; assetId?: string; query?: AssetQuery; service: InventoryService;
  onQuery: (query: AssetQuery) => void; onAuthorization: (error: ApiError) => void;
}) {
  const [store] = useState(() => new InventoryStore(company.empresaId, service, onAuthorization));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const heading = useRef<HTMLHeadingElement>(null);
  const base = '#/empresas/' + company.empresaId + '/activos';
  useEffect(() => {
    if (assetId) void store.loadAsset(assetId); else void store.loadList(query);
    return () => store.dispose();
  }, [store, assetId, query]);
  useEffect(() => { if (state.status !== 'loading') heading.current?.focus(); }, [state.status]);
  const load = (query: AssetQuery) => { onQuery(query); void store.loadList(query); };
  function filter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget);
    const estado = String(values.get('estado') || ''); const tipo = String(values.get('tipo') || '');
    load({ pagina: 0, texto: String(values.get('texto') || '').trim() || undefined,
      estado: estado === 'ACTIVO' || estado === 'ARCHIVADO' ? estado : undefined,
      tipo: Object.hasOwn(assetTypes, tipo) ? tipo as keyof typeof assetTypes : undefined });
  }
  return <Stack component="section" spacing={3} aria-labelledby="inventory-title" aria-busy={state.status === 'loading'}>
    <Stack direction="row" useFlexGap sx={{ gap: 1, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
      <Typography id="inventory-title" variant="h2" tabIndex={-1} ref={heading}>{assetId ? 'Ficha del activo' : 'Inventario de activos'}</Typography>
      {assetId && <Link href={base}>Volver al inventario</Link>}
      <Button disabled={state.status === 'loading'} onClick={() => { void store.retry(); }}>Actualizar {assetId ? 'ficha' : 'inventario'}</Button>
    </Stack>
    <Typography color="text.secondary">Consulta de información de la empresa activa. La clasificación confirmada y las revisiones pendientes se muestran por separado.</Typography>
    {!assetId && <Box component="form" aria-label="Filtros del inventario" onSubmit={filter} key={JSON.stringify(state.query)}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,minmax(0,1fr))', lg: '2fr 1fr 1fr' }, gap: 2 }}>
        <Stack spacing={1}><Typography component="label" htmlFor="asset-search">Buscar por nombre o código</Typography><Box component="input" type="search" id="asset-search" name="texto" maxLength={250} defaultValue={state.query.texto || ''} sx={fieldStyle} /></Stack>
        <Stack spacing={1}><Typography component="label" htmlFor="asset-type">Tipo</Typography><Box component="select" id="asset-type" name="tipo" defaultValue={state.query.tipo || ''} sx={fieldStyle}><option value="">Todos los tipos</option>{Object.entries(assetTypes).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</Box></Stack>
        <Stack spacing={1}><Typography component="label" htmlFor="asset-state">Estado del activo</Typography><Box component="select" id="asset-state" name="estado" defaultValue={state.query.estado || ''} sx={fieldStyle}><option value="">Todos los estados</option>{Object.entries(assetStates).map(([code, label]) => <option key={code} value={code}>{label}</option>)}</Box></Stack>
      </Box>
      <Stack direction="row" sx={{ gap: 1, mt: 2 }}><Button type="submit" variant="contained" disabled={state.status === 'loading'}>Aplicar filtros</Button><Button disabled={state.status === 'loading'} onClick={event => { event.currentTarget.form?.reset(); load({ estado: 'ACTIVO', pagina: 0 }); }}>Limpiar filtros</Button></Stack>
    </Box>}
    {state.status === 'loading' && <Typography role="status">Consultando {assetId ? 'la ficha y sus referencias' : 'el inventario'}…</Typography>}
    {state.error && <Alert severity="error">{state.error.status === 404 ? 'El activo no está disponible para tu cuenta en esta empresa.' : accessMessage(state.error)}{state.error.correlationId && ` Referencia de soporte: ${state.error.correlationId}`}</Alert>}
    {state.list && <>
      {!state.list.elementos.length && <Alert severity="info">No hay activos en esta página con los filtros aplicados.</Alert>}
      <Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>{state.list.elementos.map(asset => <Paper key={asset.activoId} component="li" sx={{ p: 2 }}>
        <Stack spacing={1}><Link href={base + '/' + asset.activoId} sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{asset.codigo} · {asset.nombre}</Link>
          <Typography>{assetTypes[asset.tipo]} · {assetStates[asset.estado]}</Typography><Typography>Clasificación: {asset.estadoClasificacion === 'COMPLETO' ? 'Confirmada vigente' : 'Pendiente'}</Typography>
        </Stack>
      </Paper>)}</Stack>
      <Pager label="activos" page={state.list.pagina} more={state.list.hayMas} load={pagina => load({ ...state.query, pagina })} />
    </>}
    {state.asset && <AssetDetails state={state} zone={company.zonaHoraria} onValuationPage={page => { void store.loadAsset(state.asset!.activoId, page, state.historyPage); }} onHistoryPage={page => { void store.loadAsset(state.asset!.activoId, state.valuationPage, page); }} />}
  </Stack>;
}
function AssetDetails({ state, zone, onValuationPage, onHistoryPage }: { state: InventoryState; zone: string; onValuationPage: (page: number) => void; onHistoryPage: (page: number) => void }) {
  const asset = state.asset!;
  const ref = (value?: { nombre: string; estado: 'ACTIVO' | 'ARCHIVADO' }) => value ? `${value.nombre} · ${assetStates[value.estado]}` : 'No disponible';
  return <>
    <Paper component="article" sx={{ p: { xs: 2, md: 3 } }}><Stack spacing={2}>
      <Typography variant="h2" sx={{ overflowWrap: 'anywhere' }}>{asset.codigo} · {asset.nombre}</Typography>
      <Chip label={assetStates[asset.estado]} variant="outlined" sx={{ alignSelf: 'flex-start' }} />
      {asset.estado === 'ARCHIVADO' && <Alert severity="info">Este activo está archivado. Se conservan sus referencias y versiones históricas.</Alert>}
      <Details><Typography component="dt">Descripción</Typography><Typography component="dd">{asset.descripcion}</Typography>
        <Typography component="dt">Tipo</Typography><Typography component="dd">{assetTypes[asset.tipo]}</Typography>
        <Typography component="dt">Proceso</Typography><Typography component="dd">{ref(state.process)}</Typography>
        <Typography component="dt">Propietario</Typography><Typography component="dd">{ref(state.owner)}</Typography>
        <Typography component="dt">Custodio</Typography><Typography component="dd">{asset.custodioId ? ref(state.custodian) : 'No registrado'}</Typography>
        <Typography component="dt">Ubicación</Typography><Typography component="dd">{asset.ubicacion || 'No registrada'}</Typography>
        <Typography component="dt">Revisión de ficha</Typography><Typography component="dd">{asset.revision}</Typography></Details>
    </Stack></Paper>
    {Object.entries(state.warnings || {}).map(([section, error]) => <Alert key={section} severity="warning">No pudimos consultar {({ valuations: 'las clasificaciones', history: 'el historial', process: 'el proceso', owner: 'el propietario', custodian: 'el custodio' })[section]}. Actualiza la ficha para reintentar.{error?.correlationId && ` Referencia: ${error.correlationId}`}</Alert>)}
    <Stack component="section" aria-labelledby="classifications-title" spacing={2}>
      <Typography id="classifications-title" variant="h2">Versiones de clasificación</Typography>
      <Typography color="text.secondary">Ordenadas por versión descendente. «Vigente» identifica la confirmada actual; un borrador pendiente no la reemplaza. No encontrar una versión en esta página no indica que no exista.</Typography>
      {state.valuations && <>
        {!state.valuations.elementos.length && <Alert severity="info">No hay clasificaciones en esta página. No se asignan valores C/I/D predeterminados.</Alert>}
        {state.valuations.elementos.map(value => <Valuation key={value.valoracionId} value={value} zone={zone} />)}
        <Pager label="clasificaciones" page={state.valuations.pagina} more={state.valuations.hayMas} load={onValuationPage} />
      </>}
    </Stack>
    <Box component="details"><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Ver historial del activo</Typography>
      <Stack spacing={2} sx={{ mt: 2 }}>
        {state.history && <>
          {!state.history.elementos.length && <Typography>No hay eventos en esta página.</Typography>}
          {state.history.elementos.map((event, index) => <Paper component="article" key={event.correlationId + index} sx={{ p: 2 }}>
            <Stack spacing={1}><Typography variant="h2">{({ CREAR: 'Creación', EDITAR: 'Edición', ARCHIVAR: 'Archivo', RESTAURAR: 'Restauración' })[event.accion]}</Typography>
              <Typography>{timestamp(event.registradoEn, zone)} · {event.estadoAnterior ? assetStates[event.estadoAnterior] + ' → ' : ''}{assetStates[event.estadoNuevo]}</Typography>
              <Typography sx={{ overflowWrap: 'anywhere' }}>Actor: {event.actorId}</Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>Motivo: {event.motivo || 'No registrado'} · Campos: {event.camposModificados.length ? event.camposModificados.join(', ') : 'Sin campos registrados'}</Typography>
              <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>Referencia: {event.correlationId}</Typography>
              {event.referencias && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>Referencias anteriores: {reference(event.referencias.anteriores)} · Nuevas: {reference(event.referencias.nuevas)}</Typography>}
            </Stack>
          </Paper>)}
          <Pager label="historial" page={state.history.pagina} more={state.history.hayMas} load={onHistoryPage} />
        </>}
      </Stack>
    </Box>
  </>;
}
function Valuation({ value, zone }: { value: ValuationPage['elementos'][number]; zone: string }) {
  const entries = value.entradas;
  const personalField = (text: string) => entries.contieneDatosPersonales === false ? 'No aplica' : text;
  const dimension = (value?: 1 | 3 | 5 | null) => value == null ? 'Pendiente' : `${value} · ${value === 1 ? 'Baja' : value === 3 ? 'Media' : 'Alta'}`;
  return <Paper component="article" aria-label={`Clasificación versión ${value.numero}`} sx={{ p: 2 }}><Stack spacing={2}>
    <Typography variant="h2">Versión {value.numero} · {value.vigente ? 'Vigente' : value.estado === 'PENDIENTE' ? 'Borrador pendiente' : 'Confirmada histórica'}</Typography>
    <Details>
      <Typography component="dt">Confidencialidad</Typography><Typography component="dd">{dimension(entries.confidencialidad)}</Typography>
      <Typography component="dt">Integridad</Typography><Typography component="dd">{dimension(entries.integridad)}</Typography>
      <Typography component="dt">Disponibilidad</Typography><Typography component="dd">{dimension(entries.disponibilidad)}</Typography>
      <Typography component="dt">Criticidad confirmada</Typography><Typography component="dd">{value.criticidad == null ? 'Pendiente' : value.criticidad} · {value.nivel == null ? 'Sin nivel confirmado' : levels[value.nivel]}</Typography>
      <Typography component="dt">Fundamento</Typography><Typography component="dd">{missing(entries.fundamento)}</Typography>
      <Typography component="dt">Motivo de revisión</Typography><Typography component="dd">{value.motivoRevision || 'No registrado'}</Typography>
    </Details>
    <Typography variant="body2" color="text.secondary">La criticidad y su nivel son los confirmados por el backend. Los valores ausentes no equivalen a una dimensión baja.</Typography>
    <Box component="details"><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Ver datos personales y trazabilidad de la versión {value.numero}</Typography>
      <Details><Typography component="dt">Contiene datos personales</Typography><Typography component="dd">{yesNo(entries.contieneDatosPersonales)}</Typography>
        <Typography component="dt">Datos de menores</Typography><Typography component="dd">{personalField(yesNo(entries.contieneDatosMenores))}</Typography>
        <Typography component="dt">Tipos declarados</Typography><Typography component="dd">{personalField(entries.tiposDatosPersonales?.length ? entries.tiposDatosPersonales.map(type => personalTypes[type]).join(', ') : 'Pendiente')}</Typography>
        <Typography component="dt">Finalidad</Typography><Typography component="dd">{personalField(missing(entries.finalidadTratamiento))}</Typography>
        <Typography component="dt">Autorización declarada</Typography><Typography component="dd">{personalField(entries.autorizacionTratamiento === 'NO_APLICA' ? 'No aplica' : entries.autorizacionTratamiento === 'SI' ? 'Sí' : entries.autorizacionTratamiento === 'NO' ? 'No' : 'Pendiente')}</Typography>
        <Typography component="dt">Justificación de no aplica</Typography><Typography component="dd">{personalField(entries.autorizacionTratamiento === 'NO_APLICA' ? missing(entries.justificacionNoAplica) : entries.autorizacionTratamiento == null ? 'Pendiente' : 'No aplica')}</Typography>
        <Typography component="dt">Metodología / tipos</Typography><Typography component="dd">{value.metodologia} · {value.versionTiposDatos}</Typography>
        <Typography component="dt">Creada</Typography><Typography component="dd">{timestamp(value.creadaEn, zone)} · {value.creadaPor}</Typography>
        <Typography component="dt">Confirmada</Typography><Typography component="dd">{value.confirmadaEn ? `${timestamp(value.confirmadaEn, zone)} · ${value.confirmadaPor}` : 'Pendiente'}</Typography>
        <Typography component="dt">Revisión de versión</Typography><Typography component="dd">{value.revision}</Typography>
      </Details>
    </Box>
  </Stack></Paper>;
}
