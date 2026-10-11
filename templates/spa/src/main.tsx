// biome-ignore-all assist/source/organizeImports: react-scan must be imported before React and React DOM
import { scan } from 'react-scan'
import { RouterProvider } from '@tanstack/react-router'
import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { env } from '@/lib/env'
import { i18n } from '@/lib/i18n'
import { initMonitoring } from '@/lib/monitoring'
import '@/styles/globals.css'

const showDevtools = import.meta.env.DEV && env.VITE_DEVTOOLS === 'true'

if (import.meta.env.DEV && env.VITE_REACT_SCAN === 'true') {
  scan({ enabled: true })
}

if (showDevtools) {
  void import('@axe-core/react').then(async (axe) => {
    const React = await import('react')
    const ReactDOM = await import('react-dom')
    await axe.default(React, ReactDOM, 1000)
  })
}

const TanStackDevtools = showDevtools
  ? lazy(() =>
      import('@tanstack/react-devtools').then((mod) => ({
        default: mod.TanStackDevtools,
      })),
    )
  : null

const ReactQueryDevtoolsPanel = showDevtools
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((mod) => ({
        default: mod.ReactQueryDevtoolsPanel,
      })),
    )
  : null

const TanStackRouterDevtoolsPanel = showDevtools
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((mod) => ({
        default: mod.TanStackRouterDevtoolsPanel,
      })),
    )
  : null

async function boot() {
  await initMonitoring(env.VITE_SENTRY_DSN)
  if (env.VITE_ENABLE_MSW === 'true' && import.meta.env.DEV) {
    const { worker } = await import('@/mocks/browser')
    await worker.start({ serviceWorker: { url: '/mockServiceWorker.js' } })
  }

  const root = document.getElementById('root')
  if (!root) throw new Error('Root element was not found.')

  createRoot(root).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
        {TanStackDevtools && ReactQueryDevtoolsPanel && TanStackRouterDevtoolsPanel ? (
          <Suspense fallback={null}>
            <TanStackDevtools
              plugins={[
                {
                  name: 'TanStack Query',
                  render: <ReactQueryDevtoolsPanel />,
                },
                {
                  name: 'TanStack Router',
                  render: <TanStackRouterDevtoolsPanel router={router} />,
                },
              ]}
            />
          </Suspense>
        ) : null}
      </Providers>
    </StrictMode>,
  )
}

void i18n
void boot()
