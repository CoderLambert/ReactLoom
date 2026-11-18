import { createTheme } from '@mui/material/styles'

/** Stable local themes. No CssBaseline, storage or global color-scheme controller. */
export const themes = {
  light: createTheme({
    cssVariables: false,
    palette: { mode: 'light', primary: { main: '#2b674e' }, secondary: { main: '#987a45' } },
    shape: { borderRadius: 10 },
  }),
  dark: createTheme({
    cssVariables: false,
    palette: { mode: 'dark', primary: { main: '#2b674e' }, secondary: { main: '#987a45' } },
    shape: { borderRadius: 10 },
  }),
}
