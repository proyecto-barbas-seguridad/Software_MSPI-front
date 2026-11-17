import { Box, Button, Divider, Link, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import type { ReactNode } from 'react';

export function WorkspaceShell({ children, mode, onToggleMode, panelHref, activityHref, section, actionsHref, actionsLabel = 'Acciones' }: {
  children: ReactNode;
  mode: 'light' | 'dark';
  onToggleMode: () => void;
  panelHref?: string;
  activityHref?: string;
  actionsHref?: string;
  actionsLabel?: string;
  section?: 'panel' | 'assets' | 'evaluations' | 'risks' | 'controls' | 'actions' | 'reports' | 'activity';
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <Box>
    <Link href="#contenido-react" onClick={event => { event.preventDefault(); document.getElementById('contenido-react')?.focus(); }} sx={{ position: 'absolute', left: 16, top: -100, zIndex: 10,
      bgcolor: 'background.paper', p: 1, '&:focus': { top: 8 } }}>Ir al contenido</Link>
    <Box component="header" sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider', px: { xs: 2, md: 3 }, py: 1.5 }}>
      <Stack direction="row" useFlexGap sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Typography component="p" variant="h2" color="primary">MSPI</Typography>
        <Stack direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="navegacion-react"
            sx={{ display: { md: 'none' } }}>Menú</Button>
          <Button onClick={onToggleMode} aria-label={mode === 'light' ? 'Usar tema oscuro' : 'Usar tema claro'}>
            {mode === 'light' ? 'Tema oscuro' : 'Tema claro'}
          </Button>
        </Stack>
      </Stack>
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px minmax(0, 1fr)' }, minHeight: 'calc(100dvh - 80px)' }}>
      <Box component="aside" id="navegacion-react" sx={{ display: { xs: menuOpen ? 'block' : 'none', md: 'block' },
        bgcolor: 'background.paper', borderRight: { md: 1 }, borderBottom: { xs: 1, md: 0 }, borderColor: 'divider', p: 2 }}>
        <Stack component="nav" aria-label="Navegación principal" spacing={1}>
          {panelHref && <>
            <Button component="a" href={panelHref} aria-current={!section || section === 'panel' ? 'page' : undefined} variant={!section || section === 'panel' ? 'contained' : 'outlined'} onClick={() => setMenuOpen(false)}>Panel</Button>
            <Button component="a" href={panelHref + '/activos'} aria-current={section === 'assets' ? 'page' : undefined} variant={section === 'assets' ? 'contained' : 'outlined'} onClick={() => setMenuOpen(false)}>Inventario de activos</Button>
            <Button component="a" href={panelHref + '/evaluaciones'} aria-current={section === 'evaluations' ? 'page' : undefined} variant={section === 'evaluations' ? 'contained' : 'outlined'} onClick={() => setMenuOpen(false)}>Consultar evaluaciones</Button>
            <Button component="a" href={panelHref + '/riesgos'} aria-current={section === 'risks' ? 'page' : undefined} variant={section === 'risks' ? 'contained' : 'outlined'} onClick={() => setMenuOpen(false)}>Consultar riesgos</Button>
            <Button component="a" href={panelHref + '/controles'} aria-current={section === 'controls' ? 'page' : undefined} variant={section === 'controls' ? 'contained' : 'outlined'} onClick={() => setMenuOpen(false)}>Implementaciones de controles</Button>
            <Button component="a" href={panelHref + '/reportes'} aria-current={section === 'reports' ? 'page' : undefined} variant={section === 'reports' ? 'contained' : 'outlined'} onClick={() => setMenuOpen(false)}>Reportes</Button>
          </>}
          {activityHref && <Button component="a" href={activityHref} aria-current={section === 'activity' ? 'page' : undefined} variant={section === 'activity' ? 'contained' : 'outlined'} onClick={() => setMenuOpen(false)}>Actividad empresarial</Button>}
          {actionsHref && <Button component="a" href={actionsHref} aria-current={section === 'actions' ? 'page' : undefined} variant={section === 'actions' ? 'contained' : 'outlined'} onClick={() => setMenuOpen(false)}>{actionsLabel}</Button>}
          <Button component="a" href="/interfaz/#/empresas" variant="outlined" onClick={() => setMenuOpen(false)}>Mis empresas</Button>
        </Stack>
        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" color="text.secondary">Gestión de seguridad de la información</Typography>
      </Box>
      <Box component="main" id="contenido-react" tabIndex={-1} sx={{ minWidth: 0, p: { xs: 2, md: 4 }, maxWidth: 1180, width: '100%', mx: 'auto' }}>
        {children}
      </Box>
    </Box>
  </Box>;
}
