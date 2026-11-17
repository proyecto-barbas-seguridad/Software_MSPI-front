import { controlService } from '../controls/controls';
import type { ControlService } from '../controls/controls';
import { Alert, Box, Button, Chip, Link, Paper, Stack, Typography } from '@mui/material';
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode, FormEvent } from 'react';
import { ApiError } from '../../shared/api/client';
import { capabilities } from '../access/workspace';
import type { RiskMode } from './RiskEditor';
import type { InherentMode } from './InherentEditor';
import type { Company } from '../access/workspace';
import { date, labels, number, timestamp } from '../dashboard/panel';
import { states, uuid, validatePage, validateRisk, validators } from './risks';
import type { Risk, RiskService, RiskQuery, Inherent, Residual, History, Page } from './risks';
const ControlPanel = lazy(() => import('../controls/ControlPanel'));
const RiskControlEditor = lazy(() => import('./RiskControlEditor'));
const InherentEditor = lazy(() => import('./InherentEditor'));
const RiskEditor = lazy(() => import('./RiskEditor'));
const noop = () => {};
const allow = () => true;
const names = { inherent: 'Valoraciones inherentes', residual: 'Valoraciones residuales', links: 'Controles vinculados', acceptances: 'Aceptaciones' };
const extra: Record<string, string> = { CONFIRMADA: 'Confirmada', REDUCIR: 'Reducir', COMPARTIR: 'Compartir', ACEPTAR: 'Aceptar', EVITAR: 'Evitar', PROBABILIDAD: 'Probabilidad', IMPACTO: 'Impacto', AMBOS: 'Probabilidad e impacto', REVISION_PENDIENTE: 'Revisión pendiente', HISTORICA: 'Histórica', CONTEXTO_CAMBIADO: 'Contexto cambiado', INHERENTE_SUSTITUIDA: 'Inherente sustituida', VERSION_CONTROL_CAMBIADA: 'Versión de control cambiada', VERIFICACION_SUSTITUIDA: 'Verificación sustituida', EVIDENCIA_BLOQUEADA: 'Evidencia bloqueada', CONTROL_VINCULADO: 'Control vinculado', VERIFICACION_VENCIDA: 'Verificación vencida' };
const label = (value: string | null | undefined) => value == null ? 'Pendiente' : labels[value] || extra[value] || value;
const fields = { width: '100%', minHeight: 44, px: 1.5, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', color: 'text.primary', font: 'inherit' };
type Access = { scope?: AbortSignal; onAuthorization: (error: ApiError) => void };
function useRead<T>(load: (signal: AbortSignal) => Promise<T>, { scope, onAuthorization }: Access) {
  const [data, setData] = useState<T>(); const [error, setError] = useState<ApiError>(); const [loading, setLoading] = useState(true); const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const request = new AbortController(); setData(undefined); setError(undefined); setLoading(true);
    void load(request.signal).then(value => { if (!request.signal.aborted && !scope?.aborted) setData(value); }).catch(failure => {
      if (request.signal.aborted || scope?.aborted) return;
      const problem = failure instanceof ApiError ? failure : new ApiError(502, 'RESPUESTA_INVALIDA', 'No se pudo validar la información de riesgos.'); setError(problem);
      if ([401, 403].includes(problem.status)) onAuthorization(problem);
    }).finally(() => { if (!request.signal.aborted && !scope?.aborted) setLoading(false); });
    return () => request.abort();
  }, [load, scope, onAuthorization, attempt]);
  return { data, error, loading, retry: () => { setData(undefined); setError(undefined); setLoading(true); setAttempt(value => value + 1); } };
}
function ErrorNotice({ error }: { error: ApiError }) { return <Alert severity="error">{error.status === 404 ? 'El riesgo o recurso no está disponible en esta empresa.' : error.message}{error.correlationId && ` Referencia de soporte: ${error.correlationId}`}{error.retryAfter !== undefined && ` El servidor indicó esperar ${error.retryAfter} segundos antes de reintentar.`}</Alert>; }
function Pager({ page, more, name, load }: { page: number; more: boolean; name: string; load: (page: number) => void }) { return <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap', alignItems: 'center' }}><Button aria-label={'Anterior en ' + name} disabled={page === 0} onClick={() => load(page - 1)}>Anterior</Button><Typography>Página {page + 1}</Typography><Button aria-label={'Siguiente en ' + name} disabled={!more} onClick={() => load(page + 1)}>Siguiente</Button></Stack>; }
function Details({ rows }: { rows: [string, ReactNode][] }) { return <Box component="dl" sx={{ m: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px,1fr) minmax(0,2fr)' }, gap: 1, '& dt': { color: 'text.secondary' }, '& dd': { m: 0, mb: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' } }}>{rows.map(([name, value]) => <Box key={name} sx={{ display: 'contents' }}><Typography component="dt">{name}</Typography><Typography component="dd">{value}</Typography></Box>)}</Box>; }
export default function RiskWorkspace({ company, riskId, query: initialQuery, service, controls = controlService, scope, onAuthorization, onQuery, onDirty = noop, onPending = noop, onLeave = allow }: { onDirty?: (dirty: boolean) => void; onPending?: (pending: boolean) => void; onLeave?: () => boolean; controls?: ControlService; company: Company; riskId?: string; query?: RiskQuery; service: RiskService; onQuery: (query: RiskQuery) => void } & Access) {
  const [editor, setEditor] = useState<RiskMode>();
  const [inherentEditor, setInherentEditor] = useState<InherentMode>();
  const [expandedHistory, setExpandedHistory] = useState<keyof History>();
  const [linkEditor, setLinkEditor] = useState(false);
  const [notice, setNotice] = useState<string>();
  useEffect(() => { setEditor(undefined); setInherentEditor(undefined); setExpandedHistory(undefined); setLinkEditor(false); setNotice(undefined); }, [riskId]);
  const [query, setQuery] = useState<RiskQuery>(() => ({ ...initialQuery, pagina: initialQuery?.pagina ?? 0, tamano: 5 }));
  const heading = useRef<HTMLHeadingElement>(null); const base = '#/empresas/' + company.empresaId + '/riesgos';
  const load = useCallback(async (signal: AbortSignal) => {
    if (riskId) { if (!uuid.test(riskId)) throw new ApiError(404, 'RIESGO_NO_DISPONIBLE', 'Riesgo no disponible.'); return { risk: validateRisk(await service.detail(company.empresaId, riskId, signal), riskId) }; }
    return { list: validatePage(await service.list(company.empresaId, query, signal), query.pagina ?? 0, item => validateRisk(item)) };
  }, [company.empresaId, riskId, query, service]);
  const state = useRead(load, { scope, onAuthorization });
  useEffect(() => { if (!state.loading) heading.current?.focus(); }, [state.loading]);
  function update(next: RiskQuery) { const effective = { ...next, tamano: 5 }; setQuery(effective); onQuery(effective); }
  function filter(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = new FormData(event.currentTarget); const estado = String(values.get('estado') || ''); update({ pagina: 0, codigo: String(values.get('codigo') || '').trim() || undefined, estado: states.includes(estado as Risk['estado']) ? estado as Risk['estado'] : undefined }); }
  if (linkEditor && state.data?.risk) return <Suspense fallback={<Typography role="status">Abriendo vínculo de control…</Typography>}><RiskControlEditor company={company.empresaId} zone={company.zonaHoraria} risk={state.data.risk} service={service} controls={controls} scope={scope} onAuthorization={onAuthorization} onDirty={onDirty} onPending={onPending} onCancel={() => { if (onLeave()) setLinkEditor(false); }}
    onSaved={() => { setLinkEditor(false); setExpandedHistory('links'); setNotice('Consulta actualizada del servidor. Revisa los vínculos y el estado del riesgo antes de continuar.'); state.retry(); }} /></Suspense>;
  if (inherentEditor && state.data?.risk) return <Suspense fallback={<Typography role="status">Abriendo valoración inherente…</Typography>}><InherentEditor companyId={company.empresaId} risk={state.data.risk} mode={inherentEditor} service={service} scope={scope} onAuthorization={onAuthorization} onDirty={onDirty} onPending={onPending} onCancel={() => { if (onLeave()) setInherentEditor(undefined); }}
    onSaved={() => { setInherentEditor(undefined); setExpandedHistory('inherent'); setNotice('Consulta actualizada del servidor. Revisa la ficha y las valoraciones antes de continuar.'); state.retry(); }} /></Suspense>;
  if (editor) return <Suspense fallback={<Typography role="status">Abriendo formulario de riesgo…</Typography>}><RiskEditor companyId={company.empresaId} risk={state.data?.risk} mode={editor} service={service} scope={scope} onAuthorization={onAuthorization} onDirty={onDirty} onPending={onPending} onCancel={() => { if (onLeave()) setEditor(undefined); }}
    onSaved={(created, inspectCode) => { setEditor(undefined); if (created) window.location.hash = base + '/' + created.riesgoId;
      else { setNotice('Consulta actualizada del servidor. Revisa el estado antes de otra escritura.'); if (inspectCode) update({ codigo: inspectCode, pagina: 0 }); else state.retry(); } }} /></Suspense>;
  return <Stack component="section" spacing={3} aria-labelledby="risk-title" aria-busy={state.loading} sx={{ overflowWrap: 'anywhere' }}>
    <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}><Typography id="risk-title" variant="h2" tabIndex={-1} ref={heading}>{riskId ? 'Ficha de riesgo' : 'Riesgos'}</Typography>{riskId && <Link href={base}>Volver a riesgos</Link>}<Button disabled={state.loading} onClick={state.retry}>Actualizar {riskId ? 'riesgo' : 'listado'}</Button></Stack>
    {notice && <Alert severity="info">{notice}</Alert>}
    {!riskId && capabilities(company).write && <Button variant="contained" sx={{ alignSelf: 'flex-start' }} onClick={() => setEditor('create')}>Crear riesgo</Button>}
    {state.data?.risk && capabilities(company).write && state.data.risk.estado !== 'CERRADO' && <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}><Button onClick={() => setEditor('edit')}>Editar riesgo</Button><Button onClick={() => setLinkEditor(true)}>Vincular control al riesgo</Button>{state.data.risk.estado === 'IDENTIFICADO' && <Button variant="contained" onClick={() => setEditor('analyze')}>Iniciar análisis</Button>}</Stack>}
    {state.data?.risk && capabilities(company).write && state.data.risk.estado === 'EN_ANALISIS' && <Button sx={{ alignSelf: 'flex-start' }} onClick={() => setInherentEditor({ kind: 'create' })}>Nueva valoración inherente</Button>}
    <Typography color="text.secondary">Consulta de la empresa activa. Las valoraciones y su vigencia proceden del servidor; un control vinculado no implica una reducción automática.</Typography>
    {!riskId && <Box component="form" aria-label="Filtros de riesgos" onSubmit={filter} key={JSON.stringify(query)}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr auto' }, gap: 2, alignItems: 'end' }}>
      <Stack spacing={1}><Typography component="label" htmlFor="risk-code">Código del riesgo</Typography><Box component="input" id="risk-code" name="codigo" maxLength={80} defaultValue={query.codigo || ''} sx={fields} /></Stack>
      <Stack spacing={1}><Typography component="label" htmlFor="risk-state">Estado del riesgo</Typography><Box component="select" id="risk-state" name="estado" defaultValue={query.estado || ''} sx={fields}><option value="">Todos los estados</option>{states.map(state => <option key={state} value={state}>{label(state)}</option>)}</Box></Stack>
      <Stack direction="row" sx={{ gap: 1 }}><Button type="submit" variant="contained" disabled={state.loading}>Aplicar filtros</Button><Button disabled={state.loading} onClick={() => update({ pagina: 0 })}>Limpiar filtros</Button></Stack>
    </Box><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>El filtro de código se envía al servidor. No busca en descripciones ni filtra los resultados del panel.</Typography></Box>}
    {state.loading && <Typography role="status">Consultando {riskId ? 'riesgo' : 'riesgos'}…</Typography>}{state.error && <ErrorNotice error={state.error} />}
    {state.data?.list && <>{!state.data.list.elementos.length && <Alert severity="info">No hay riesgos en esta página con los filtros aplicados.</Alert>}<Stack component="ul" spacing={2} sx={{ listStyle: 'none', p: 0, m: 0 }}>{state.data.list.elementos.map(risk => <Paper component="li" key={risk.riesgoId} sx={{ p: 2 }}><Stack spacing={1}><Link href={base + '/' + risk.riesgoId} sx={{ fontWeight: 600 }}>{risk.codigo}</Link><Typography>{risk.detalle.descripcion}</Typography><Typography>{label(risk.estado)} · Nivel inherente registrado: {risk.nivelInherente ? label(risk.nivelInherente) : 'Pendiente'}</Typography>{risk.requiereRevision && <Alert severity="warning">Revisión requerida. {risk.motivoRevision || 'Consulta el contexto de la ficha.'}</Alert>}<Typography variant="body2">Revisión: {risk.revision}</Typography></Stack></Paper>)}</Stack><Pager page={state.data.list.pagina} more={state.data.list.hayMas} name="riesgos" load={pagina => update({ ...query, pagina })} /></>}
    {state.data?.risk && <RiskDetail key={state.data.risk.riesgoId + ':' + state.data.risk.revision} expandedHistory={expandedHistory} controls={controls} onInherent={setInherentEditor} risk={state.data.risk} company={company} service={service} scope={scope} onAuthorization={onAuthorization} />}
  </Stack>;
}
function RiskDetail({ risk, company, service, scope, onAuthorization, expandedHistory, controls, onInherent }: { controls: ControlService; expandedHistory?: keyof History; onInherent: (mode: InherentMode) => void; risk: Risk; company: Company; service: RiskService } & Access) {
  const [open, setOpen] = useState<Partial<Record<keyof History, boolean>>>(expandedHistory ? { [expandedHistory]: true } : {}); const c = risk.cierre;
  return <><Paper component="article" sx={{ p: { xs: 2, md: 3 } }}><Stack spacing={2}><Typography variant="h2" component="h3">{risk.codigo}</Typography><Chip label={label(risk.estado)} variant="outlined" sx={{ alignSelf: 'flex-start' }} />
    {risk.requiereRevision && <Alert severity="warning">Revisión requerida: {risk.motivoRevision || 'El contexto o las dependencias requieren revisión.'}</Alert>}
    <Details rows={[
      ['Descripción', risk.detalle.descripcion], ['Amenaza', risk.detalle.amenaza], ['Vulnerabilidad', risk.detalle.vulnerabilidad],
      ['Activo principal', <Link href={`#/empresas/${company.empresaId}/activos/${risk.detalle.activoPrincipalId}`}>Consultar activo principal</Link>], ['Responsable (identificador)', risk.detalle.responsableId],
      ['Tratamiento propuesto', label(risk.detalle.tratamientoPropuesto)], ['Nivel inherente registrado', label(risk.nivelInherente)], ['Inherente vigente (identificador)', risk.inherenteVigenteId || 'Pendiente'],
      ['Revisión de ficha', risk.revision], ['Creado', timestamp(risk.creadaEn, company.zonaHoraria)], ['Riesgo relacionado', risk.riesgoRelacionadoId ? <Link href={`#/empresas/${company.empresaId}/riesgos/${risk.riesgoRelacionadoId}`}>Consultar riesgo relacionado</Link> : 'No registrado'],
    ]} /><Typography variant="body2">Un nivel registrado con revisión requerida no acredita una valoración vigente. «Aceptar» como tratamiento propuesto no equivale a una aceptación aprobada.</Typography>
  </Stack></Paper>
  {c && <Paper component="article" sx={{ p: 2 }}><Stack spacing={2}><Typography variant="h2" component="h3">Cierre conservado del riesgo</Typography><Details rows={[
    ['Justificación', c.justificacion], ['Fecha de cierre', timestamp(c.cerradaEn, company.zonaHoraria)], ['Persona que cerró', c.cerradaPor], ['Valoración inherente del cierre', c.inherenteId], ['Valoración residual del cierre', c.residualId], ['Aceptación del cierre', c.aceptacionId || 'No aplica'],
  ]} />{Object.entries(c.accionesCanceladas).map(([id, reason]) => <Typography key={id}>Acción cancelada {id}: {reason}</Typography>)}</Stack></Paper>}
  {(Object.keys(names) as (keyof History)[]).map(kind => <Box component="details" key={kind} open={Boolean(open[kind])} onToggle={event => { const visible = event.currentTarget.open; setOpen(prior => ({ ...prior, [kind]: visible })); }}><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>{names[kind]}</Typography>{open[kind] && <HistoryList controls={controls} onInherent={onInherent} kind={kind} risk={risk} company={company} service={service} scope={scope} onAuthorization={onAuthorization} />}</Box>)}</>;
}
function HistoryList<K extends keyof History>({ kind, risk, company, service, scope, onAuthorization, onInherent, controls }: { controls: ControlService; onInherent: (mode: InherentMode) => void; kind: K; risk: Risk; company: Company; service: RiskService } & Access) {
  const [page, setPage] = useState(0);
  const load = useCallback(async (signal: AbortSignal) => validatePage(await service[kind](company.empresaId, risk.riesgoId, page, signal) as Page<History[K]>, page, item => validators[kind](item, risk.riesgoId)), [kind, company.empresaId, risk.riesgoId, page, service]);
  const state = useRead(load, { scope, onAuthorization });
  return <Stack spacing={2} sx={{ mt: 2 }} aria-busy={state.loading}>{state.loading && <Typography role="status">Consultando {names[kind].toLowerCase()}…</Typography>}{state.error && <ErrorNotice error={state.error} />}<Button disabled={state.loading} onClick={state.retry}>Actualizar {names[kind].toLowerCase()}</Button>
    {state.data && <>{!state.data.elementos.length && <Typography>No hay registros en esta página de {names[kind].toLowerCase()}.</Typography>}{state.data.elementos.map((item, index) => <Paper component="article" key={index} sx={{ p: 2 }}><Stack spacing={2}>
      {item.revisionRiesgo !== risk.revision && <Alert severity="warning">La ficha y esta consulta corresponden a revisiones distintas. Actualiza el riesgo antes de compararlas como un mismo corte.</Alert>}
      {kind === 'inherent' && capabilities(company).write && risk.estado === 'EN_ANALISIS' && (item as Inherent).estadoResultado === 'BORRADOR' && <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}>
        <Button disabled={item.revisionRiesgo !== risk.revision} onClick={() => onInherent({ kind: 'edit', assessment: item as Inherent })}>Editar borrador inherente</Button>
        <Button disabled={item.revisionRiesgo !== risk.revision || (item as Inherent).requiereRevision} onClick={() => onInherent({ kind: 'confirm', assessment: item as Inherent })}>Confirmar valoración inherente</Button>
      </Stack>}
      {kind === 'inherent' ? <Assessment value={item as Inherent} risk={risk} zone={company.zonaHoraria} /> : kind === 'residual' ? <Assessment value={item as Residual} risk={risk} zone={company.zonaHoraria} /> : kind === 'links' ? <Control value={item as History['links']} company={company} controls={controls} scope={scope} onAuthorization={onAuthorization} /> : <AcceptanceView value={item as History['acceptances']} zone={company.zonaHoraria} />}
    </Stack></Paper>)}<Pager page={page} more={state.data.hayMas} name={names[kind].toLowerCase()} load={setPage} /></>}
  </Stack>;
}
function Assessment({ value, risk, zone }: { value: Inherent | Residual; risk: Risk; zone: string }) {
  const residual = 'residualId' in value; const inputs = residual ? value.datos.entradas : value.entradas;
  const pending = value.estadoResultado === 'BORRADOR'; const inputIndex = (v: number | null) => v === null ? 'Pendiente' : number.format(v);
  const current = residual ? value.vigente : value.valoracionId === risk.inherenteVigenteId && !value.requiereRevision;
  return <><Typography variant="h2" component="h4">{residual ? 'Residual' : 'Inherente'} · {label(value.estadoResultado)}</Typography><Typography>{value.requiereRevision ? 'Revisión requerida' : pending ? 'Resultado provisional de borrador' : current ? 'Vigente según el servidor' : 'Histórica; no acredita vigencia'}</Typography>
    <Details rows={[
      ['Probabilidad', label(inputs.probabilidad)], ['Impacto', label(inputs.impacto)], ['Nivel', label(value.nivel)], ['Índice de probabilidad', inputIndex(value.probabilidadIndice)], ['Índice de impacto', inputIndex(value.impactoIndice)],
      ['Periodo de referencia', inputs.periodoReferencia || 'Pendiente'], ['Fundamento', inputs.fundamento || 'Pendiente'], ['Supuestos', inputs.supuestos || 'No registrados'], ['Fuente', inputs.fuente || 'No registrada'],
      ['Creada', timestamp(value.creadaEn, zone)], ['Confirmación', value.confirmadaEn ? timestamp(value.confirmadaEn, zone) : 'Pendiente'], ['Motivo de reevaluación', value.motivoReevaluacion || 'No registrado'],
    ]} />
    {residual && <><Typography>Sin mitigación: {value.datos.sinMitigacion === true ? 'Sí' : value.datos.sinMitigacion === false ? 'No' : 'Pendiente'}</Typography><Typography>Justificación sin mitigación: {value.datos.justificacionSinMitigacion || (value.datos.sinMitigacion === true ? 'Pendiente' : value.datos.sinMitigacion === false ? 'No aplica' : 'Pendiente')}</Typography>
      {value.avisos.map((notice, index) => <Alert key={index} severity={notice.resueltoEn ? 'info' : 'warning'}>{label(notice.causa)} · {notice.resueltoEn ? 'Resuelto' : 'Pendiente de resolver'} · Detectado: {timestamp(notice.detectadoEn, zone)}{notice.resueltoEn && ` · Resuelto: ${timestamp(notice.resueltoEn, zone)}`}</Alert>)}
    </>}
    <Box component="details"><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Referencias de esta valoración</Typography><Stack spacing={1}>
      <Typography>Identificador: {residual ? value.residualId : value.valoracionId} · Metodología: {value.versionMetodologiaId}</Typography><Typography>Creada por: {value.creadaPor} · Confirmada por: {value.confirmadaPor || 'Pendiente'}</Typography><Typography>Versión anterior: {(residual ? value.anteriorId : value.valoracionAnteriorId) || 'No registrada'}</Typography>
      {residual ? <><Typography>Base inherente: {value.inherenteId}</Typography>{value.datos.verificaciones?.map(id => <Typography key={id}>Verificación seleccionada: {id}</Typography>)}{value.pruebas.map(proof => <Box key={proof.verificacionId}><Typography>Implementación: {proof.implementacionId} · Versión: {proof.versionId} · Verificación: {proof.verificacionId}</Typography><Typography>Evidencia de aplicación: {proof.evidenciaAplicacionId} · Evidencia de verificación: {proof.evidenciaVerificacionId} · Vence: {timestamp(proof.venceEn, zone)}</Typography></Box>)}{value.avisos.map((notice, index) => <Typography key={index}>Referencia de {label(notice.causa)}: {notice.referenciaId}</Typography>)}</> : value.base && <Details rows={[['Activo de la base', value.base.activoPrincipalId], ['Amenaza de la base', value.base.amenaza], ['Vulnerabilidad de la base', value.base.vulnerabilidad], ['Descripción de la base', value.base.descripcion]]} />}
    </Stack></Box></>;
}
function Control({ value, company, controls, scope, onAuthorization }: { value: History['links']; company: Company; controls: ControlService } & Access) { const [open, setOpen] = useState(false); return <><Typography variant="h2" component="h4">Implementación de control vinculada</Typography><Details rows={[
  ['Vínculo (identificador)', value.vinculoId], ['Creado', timestamp(value.creadaEn, company.zonaHoraria)], ['Registrado por', value.creadaPor], ['Implementación (identificador)', value.implementacionId], ['Efecto esperado', label(value.efectoEsperado)], ['Justificación', value.justificacion],
]} /><Typography>El vínculo y su efecto esperado no acreditan aplicación, verificación ni reducción porcentual.</Typography>
  <Box component="details" onToggle={event => setOpen(event.currentTarget.open)}><Typography component="summary" sx={{ cursor: 'pointer', py: 1 }}>Consultar implementación vinculada {value.implementacionId}</Typography>{open && <Suspense fallback={<Typography role="status">Abriendo implementación…</Typography>}><ControlPanel company={company.empresaId} controlId={value.implementacionId} service={controls} zone={company.zonaHoraria} scope={scope} onAuthorization={onAuthorization} /></Suspense>}</Box></>; }
function AcceptanceView({ value, zone }: { value: History['acceptances']; zone: string }) { return <><Typography variant="h2" component="h4">Aceptación · {label(value.estado)}</Typography><Details rows={[
  ['Aceptación (identificador)', value.aceptacionId], ['Justificación', value.justificacion], ['Próxima revisión', date(value.fechaProximaRevision)], ['Aprobada', timestamp(value.aprobadaEn, zone)], ['Persona que aprobó', value.aprobadaPor], ['Inherente aprobada', value.inherenteId], ['Residual aprobada', value.residualId],
]} /><Typography>La aceptación y el estado del riesgo son decisiones distintas.</Typography></>; }
