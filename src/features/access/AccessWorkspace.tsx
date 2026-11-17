import { Alert, Box, Button, Chip, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import { accessMessage, capabilities, roleNames, WorkspaceStore } from './workspace';
import type { Company } from './workspace';
import { CompanyDashboard } from '../dashboard/CompanyDashboard';
import { InventoryWorkspace } from '../inventory/InventoryWorkspace';
const ReportWorkspace = lazy(() => import('../reports/ReportWorkspace'));
const ActionWorkspace = lazy(() => import('../actions/ActionWorkspace'));
const ControlWorkspace = lazy(() => import('../controls/ControlWorkspace'));
const RiskWorkspace = lazy(() => import('../risks/RiskWorkspace'));
const EvaluationWorkspace = lazy(() => import('../evaluations/EvaluationWorkspace'));

function routeFromHash() {
  const hash = window.location.hash;
  if (!hash || hash === '#/empresas') return {};
  const route = /^#\/empresas\/([^/]+)(?:\/(activos|evaluaciones|riesgos|controles|acciones|reportes)(?:\/([^/]+))?)?$/.exec(hash);
  if (route?.[2] === 'reportes' && route[3]) return { target: 'invalid' };
  return route ? { target: route[1], inventoryRoute: route[2] === 'reportes' ? { section: 'reports' as const } : route[2] === 'acciones' ? { section: 'actions' as const, actionId: route[3] } : route[2] === 'controles' ? { section: 'controls' as const, controlId: route[3] } : route[2] === 'riesgos' ? { section: 'risks' as const, riskId: route[3] } : route[2] === 'evaluaciones' ? { section: 'evaluations' as const, evaluationId: route[3] } : route[2] ? { assetId: route[3] } : undefined } : { target: 'invalid' };
}
export function RoleChips({ company }: { company: Company }) {
  return <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }} aria-label="Roles en esta empresa">
    {company.roles.map(role => <Chip key={role} label={roleNames[role]} size="small" variant="outlined" />)}
  </Stack>;
}
export function AccessWorkspace({ store }: { store: WorkspaceStore }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const heading = useRef<HTMLHeadingElement>(null);
  const acceptedUrl = useRef(window.location.href);
  const [showPassword, setShowPassword] = useState(false);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const remaining = Math.max(0, Math.ceil((waitUntil - now) / 1000));

  useEffect(() => {
    const route = () => {
      if (!store.allowNavigation()) { window.history.replaceState(null, '', acceptedUrl.current); return; }
      acceptedUrl.current = window.location.href;
      const location = routeFromHash(); void store.open(location.target, 0, undefined, location.inventoryRoute);
    };
    const revalidate = () => { if (document.visibilityState === 'visible' && store.getSnapshot().identity) void store.revalidate(); };
    const leave = (event: BeforeUnloadEvent) => { if (store.draftDirty) { event.preventDefault(); event.returnValue = ''; } };
    const link = (event: MouseEvent) => {
      if (event.button || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>('a[href]');
      if (anchor && anchor.hash !== '#contenido-react' && anchor.href !== window.location.href && !store.allowNavigation()) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    route();
    window.addEventListener('hashchange', route);
    window.addEventListener('focus', revalidate);
    window.addEventListener('pageshow', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    window.addEventListener('beforeunload', leave);
    document.addEventListener('click', link, true);
    return () => {
      store.dispose();
      window.removeEventListener('hashchange', route);
      window.removeEventListener('focus', revalidate);
      window.removeEventListener('pageshow', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
      window.removeEventListener('beforeunload', leave);
      document.removeEventListener('click', link, true);
    };
  }, [store]);
  useEffect(() => {
    if (state.status !== 'loading' && !store.draftDirty) heading.current?.focus();
    if (state.status === 'login') { window.history.replaceState(null, '', '#/empresas'); acceptedUrl.current = window.location.href; }
    const expires = state.identity && Date.parse(state.identity.expiraEn);
    if (!expires) return;
    const timer = window.setTimeout(store.expire, Math.max(0, Math.min(expires - Date.now(), 2147483647)));
    return () => window.clearTimeout(timer);
  }, [state, store]);
  useEffect(() => {
    if (state.error?.status === 429 && state.error.retryAfter !== undefined) {
      setWaitUntil(Date.now() + state.error.retryAfter * 1000); setNow(Date.now());
    }
  }, [state.error]);
  useEffect(() => {
    if (!remaining) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [remaining]);
  function navigate(company?: Company) {
    if (!store.allowNavigation()) return;
    const hash = company ? '#/empresas/' + company.empresaId : '#/empresas';
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    acceptedUrl.current = window.location.href;
    void store.open(company?.empresaId);
  }
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (remaining || store.getSnapshot().status === 'loading') return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const password = form.elements.namedItem('contrasena') as HTMLInputElement;
    password.value = '';
    setShowPassword(false);
    const pending = store.login(String(fields.get('correo') || '').trim(), String(fields.get('contrasena') || ''));
    fields.delete('contrasena');
    await pending;
  }
  const title = (text: string) => <Typography variant="h1" tabIndex={-1} ref={heading} sx={{ overflowWrap: 'anywhere' }}>{text}</Typography>;
  if (state.status === 'loading') return <Stack role="status" aria-live="polite" spacing={2}>
    <Typography variant="h1">Comprobando acceso…</Typography><Typography>Espera mientras validamos la sesión y los permisos vigentes.</Typography>
  </Stack>;
  return <Stack spacing={3}>
    {state.identity && <Stack direction="row" useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
      <Typography>{state.identity.nombreVisible}</Typography><Button onClick={() => { void store.logout(); }}>Cerrar sesión</Button>
    </Stack>}
    {state.notice && <Alert severity="info">{state.notice}</Alert>}
    {state.error && <Alert severity="error"><Stack spacing={1}>
      <Typography>{accessMessage(state.error)}</Typography>
      {state.error.correlationId && <Typography variant="body2" sx={{ overflowWrap: 'anywhere' }}>Referencia de soporte: {state.error.correlationId}</Typography>}
    </Stack></Alert>}
    {state.status === 'login' && <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, maxWidth: 480 }}>
      <Box component="form" onSubmit={login}>
        <Stack spacing={2}>
          {title('Accede a MSPI')}
          <Typography color="text.secondary">Usa tu cuenta para consultar las empresas a las que tienes acceso.</Typography>
          <TextField label="Correo electrónico" name="correo" type="email" autoComplete="username" required fullWidth
            error={state.error?.fields.some(field => field.field === 'correo')}
            helperText={state.error?.fields.find(field => field.field === 'correo')?.message} />
          <TextField label="Contraseña" name="contrasena" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required fullWidth
            error={state.error?.fields.some(field => field.field === 'contrasena')}
            helperText={state.error?.fields.find(field => field.field === 'contrasena')?.message} />
          <Button type="button" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword}>{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</Button>
          <Button type="submit" variant="contained" disabled={remaining > 0}>{remaining ? `Espera ${remaining} s` : 'Entrar'}</Button>
        </Stack>
      </Box>
    </Paper>}
    {state.status === 'error' && <>
      {title('No pudimos abrir esta vista')}
      <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}>
        {state.notice ? <Button variant="contained" onClick={() => { void store.logout(); }}>Reintentar cierre de sesión</Button>
          : <Button variant="contained" onClick={() => { void store.retry(); }}>Reintentar</Button>}
        <Button onClick={() => navigate()}>Volver a mis empresas</Button>
      </Stack>
    </>}
    {state.status === 'companies' && state.companies && <>
      {title('Elige una empresa')}
      <Typography color="text.secondary">Cada empresa tiene sus propios roles y permisos. No se comparten datos entre empresas.</Typography>
      {!state.companies.empresas.length && <Alert severity="info">{state.companies.pagina === 0 ? 'No tienes empresas disponibles. Solicita una invitación al administrador de tu empresa. El acceso de plataforma no concede una membresía empresarial.' : 'No hay empresas en esta página.'}</Alert>}
      <Stack component="ul" spacing={2} sx={{ p: 0, m: 0, listStyle: 'none' }}>
        {state.companies.empresas.map(company => <Paper component="li" variant="outlined" key={company.empresaId} sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Typography variant="h2" sx={{ overflowWrap: 'anywhere' }}>{company.nombre}</Typography>
            <Typography color="text.secondary">{company.zonaHoraria}</Typography>
            <RoleChips company={company} />
            <Button sx={{ alignSelf: 'flex-start' }} variant="outlined" onClick={() => navigate(company)} aria-label={`Entrar a ${company.nombre}`}>Entrar</Button>
          </Stack>
        </Paper>)}
      </Stack>
      <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
        <Button disabled={state.companies.pagina === 0} onClick={() => { void store.open(undefined, state.companies!.pagina - 1); }}>Anterior</Button>
        <Typography>Página {state.companies.pagina + 1}</Typography>
        <Button disabled={!state.companies.hayMas} onClick={() => { void store.open(undefined, state.companies!.pagina + 1); }}>Siguiente</Button>
      </Stack>
    </>}
    {state.status === 'company' && state.company && <>
      <Stack spacing={1}>
        <Typography variant="overline" color="text.secondary">Empresa activa</Typography>
        {title(state.company.nombre)}
        <Typography color="text.secondary">{state.company.zonaHoraria}</Typography>
        <RoleChips company={state.company} />
        <Button sx={{ alignSelf: 'flex-start' }} onClick={() => navigate()}>Cambiar empresa</Button>
      </Stack>
      {(!state.section || state.section === 'panel') && <CompanyEntry company={state.company} />}
      {state.section === 'actions' && capabilities(state.company).actions && <Suspense fallback={<Typography role="status">Abriendo acciones…</Typography>}><ActionWorkspace key={state.company.empresaId} company={state.company} userId={state.identity?.usuarioId} actionId={state.actionId} initialPage={state.actionPage} service={store.actions} onDirty={store.setDraftDirty} onPending={store.setDraftPending} onLeave={store.allowNavigation} scope={store.scopeSignal} onAuthorization={store.authorizationLost} onPage={page => store.rememberActionPage(state.company!.empresaId, page)} /></Suspense>}
      {capabilities(state.company).read && state.section !== 'actions' && (state.section === 'reports'
        ? <Suspense fallback={<Typography role="status">Abriendo reportes…</Typography>}><ReportWorkspace key={state.company.empresaId} company={state.company} service={store.reports} scope={store.scopeSignal} onAuthorization={store.authorizationLost} /></Suspense>
        : state.section === 'controls'
        ? <Suspense fallback={<Typography role="status">Abriendo controles…</Typography>}><ControlWorkspace key={state.company.empresaId} company={state.company} controlId={state.controlId} service={store.controls} scope={store.scopeSignal} onAuthorization={store.authorizationLost} onDirty={store.setDraftDirty} onPending={store.setDraftPending} onLeave={store.allowNavigation} /></Suspense>
        : state.section === 'risks'
        ? <Suspense fallback={<Typography role="status">Abriendo riesgos…</Typography>}><RiskWorkspace key={state.company.empresaId} company={state.company} onDirty={store.setDraftDirty} onPending={store.setDraftPending} onLeave={store.allowNavigation} riskId={state.riskId} query={state.riskQuery} controls={store.controls} service={store.risks} scope={store.scopeSignal} onAuthorization={store.authorizationLost} onQuery={query => store.rememberRiskQuery(state.company!.empresaId, query)} /></Suspense>
        : state.section === 'evaluations'
        ? <Suspense fallback={<Typography role="status">Abriendo evaluaciones…</Typography>}><EvaluationWorkspace key={state.company.empresaId} company={state.company} evaluationId={state.evaluationId} page={state.evaluationPage || 0}
            service={store.evaluations} scope={store.scopeSignal} query={state.answerQuery} onAuthorization={store.authorizationLost} onPage={page => store.rememberEvaluationPage(state.company!.empresaId, page)}
            onDirty={store.setDraftDirty} onPending={store.setDraftPending} onLeave={store.allowNavigation}
            onQuery={query => store.rememberAnswerQuery(state.company!.empresaId, state.evaluationId!, query)} /></Suspense>
        : state.section === 'assets'
        ? <InventoryWorkspace key={state.company.empresaId} company={state.company} assetId={state.assetId} query={state.inventoryQuery} service={store.inventory}
            onQuery={query => store.rememberInventoryQuery(state.company!.empresaId, query)} onAuthorization={store.authorizationLost}
            onDirty={store.setDraftDirty} onPending={store.setDraftPending} onLeave={store.allowNavigation} />
        : <CompanyDashboard state={state} onLoad={query => { void store.loadPanel(query); }} />)}
    </>}
  </Stack>;
}
function CompanyEntry({ company }: { company: Company }) {
  const permissions = capabilities(company);
  const url = '/empresas/' + encodeURIComponent(company.empresaId);
  return <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}><Stack spacing={2}>
    <Typography variant="h2">{permissions.read ? 'Espacio empresarial' : 'Mis acciones'}</Typography>
    <Typography>{permissions.read
      ? permissions.write ? 'Tu membresía permite gestionar información. Las consultas existentes están disponibles en los enlaces siguientes.' : 'Tu membresía permite consultar información en modo de lectura.'
      : 'Tu acceso se limita a las acciones asignadas y su contexto mínimo. Abre Mis acciones para consultar las tareas que mantienes asignadas.'}</Typography>
    {!permissions.read && permissions.actions && <Link href={'#/empresas/' + company.empresaId + '/acciones'}>Abrir mis acciones</Link>}
    {permissions.admin && <Typography>También tienes permisos de administración de empresa. Su pantalla se incorporará en la historia correspondiente.</Typography>}
    {permissions.read && <Stack direction="row" useFlexGap sx={{ gap: 2, flexWrap: 'wrap' }}>
      <Link href={url}>Resumen de empresa</Link><Link href={'#/empresas/' + company.empresaId + '/activos'}>Activos</Link><Link href={'#/empresas/' + company.empresaId + '/evaluaciones'}>Evaluaciones</Link>
    </Stack>}
    <Typography variant="body2" color="text.secondary">Los permisos se verifican en cada operación. Nadie puede aprobar o devolver su propia entrega de una acción.</Typography>
  </Stack></Paper>;
}
