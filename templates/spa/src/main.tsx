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

const TanStackRouterDevtools = showDevtools
  ? lazy(() =>
      import('@tanstack/react-router-devtools').then((mod) => ({
        default: mod.TanStackRouterDevtools,
      })),
    )
  : null

async function boot() {
  if (showDevtools) {
    const { scan } = await import('react-scan')
    scan({ enabled: true })
  }
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
        {TanStackRouterDevtools ? (
          <Suspense fallback={null}>
            <TanStackRouterDevtools router={router} position="bottom-right" initialIsOpen={false} />
          </Suspense>
        ) : null}
      </Providers>
    </StrictMode>,
  )
}

void i18n
void boot()
