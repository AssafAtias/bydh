import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { prefixer } from 'stylis'
import rtlPlugin from 'stylis-plugin-rtl'
import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App'
import { I18nProvider, useI18n } from './lib/i18n'

const queryClient = new QueryClient()
const rtlCache = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
})
const ltrCache = createCache({
  key: 'mui',
})

function AppProviders() {
  const { direction } = useI18n()
  const theme = useMemo(
    () =>
      createTheme({
        direction,
        palette: {
          mode: 'light',
          primary: {
            main: '#0f766e',
            light: '#14b8a6',
            dark: '#115e59',
          },
          secondary: {
            main: '#7c3aed',
            light: '#a78bfa',
            dark: '#5b21b6',
          },
          background: {
            default: '#f1f5f9',
            paper: '#ffffff',
          },
        },
        shape: {
          borderRadius: 12,
        },
        typography: {
          fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                background:
                  'radial-gradient(circle at 0% 0%, rgba(20, 184, 166, 0.10), transparent 36%), radial-gradient(circle at 100% 0%, rgba(124, 58, 237, 0.10), transparent 38%), #f1f5f9',
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                background:
                  'linear-gradient(160deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.92))',
                backdropFilter: 'blur(6px)',
                boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)',
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              colorPrimary: {
                background: 'linear-gradient(120deg, #0f766e, #14b8a6)',
                color: '#ecfeff',
                fontWeight: 700,
              },
            },
          },
        },
      }),
    [direction],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <CacheProvider value={direction === 'rtl' ? rtlCache : ltrCache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </CacheProvider>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AppProviders />
    </I18nProvider>
  </StrictMode>,
)
