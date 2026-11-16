import { Button, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { WorkspaceShell } from '../shared/layout/WorkspaceShell';
import { Providers } from './Providers';
import type { createStyleCache } from './Providers';

export function App({ cache }: { cache: ReturnType<typeof createStyleCache> }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  return <Providers mode={mode} cache={cache}>
    <WorkspaceShell mode={mode} onToggleMode={() => setMode(mode === 'light' ? 'dark' : 'light')}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography color="text.secondary" variant="overline">Espacio de trabajo</Typography>
          <Typography variant="h1">Tu gestión de seguridad, en un solo lugar</Typography>
          <Typography color="text.secondary">Accede para seleccionar una empresa y consultar su información.</Typography>
        </Stack>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="h2">Continúa en tu empresa</Typography>
            <Typography>La empresa seleccionada determina los datos y permisos disponibles para tu cuenta.</Typography>
            <Button component="a" href="/empresas" variant="contained">Entrar al espacio empresarial</Button>
          </Stack>
        </Paper>
      </Stack>
    </WorkspaceShell>
  </Providers>;
}
