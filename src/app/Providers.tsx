import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { panoramaTheme } from './theme';

export function createStyleCache(nonce?: string) {
  return createCache({ key: 'mspi', nonce, prepend: true });
}

export function Providers({ children, mode, cache }: {
  children: ReactNode;
  mode: 'light' | 'dark';
  cache: ReturnType<typeof createStyleCache>;
}) {
  const theme = useMemo(() => panoramaTheme(mode), [mode]);
  return <CacheProvider value={cache}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  </CacheProvider>;
}
