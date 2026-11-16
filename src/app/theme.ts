import { createTheme } from '@mui/material/styles';
import { esES } from '@mui/material/locale';

export function panoramaTheme(mode: 'light' | 'dark') {
  const dark = mode === 'dark';
  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? '#a5c5ff' : '#2455ad' },
      background: { default: dark ? '#101a24' : '#f3f6fa', paper: dark ? '#182430' : '#ffffff' },
      text: { primary: dark ? '#e6edf5' : '#182b40', secondary: dark ? '#b3c2d4' : '#52647a' },
    },
    typography: {
      fontFamily: '"Segoe UI", Arial, sans-serif',
      h1: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.25 },
      h2: { fontSize: '1.25rem', fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiAlert: { defaultProps: { variant: 'outlined' } },
      MuiPaper: { defaultProps: { variant: 'outlined' } },
      MuiButtonBase: { defaultProps: { disableRipple: true } },
      MuiButton: { styleOverrides: { root: { minHeight: 44 } } },
      MuiCssBaseline: { styleOverrides: {
        body: { minWidth: 320 },
        ':focus-visible': { outline: `3px solid ${dark ? '#a5c5ff' : '#2455ad'}`, outlineOffset: 3 },
      } },
    },
  }, esES);
}
