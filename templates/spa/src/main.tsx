import { RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from '@/app/providers'
import { router } from '@/app/router'
import { env } from '@/lib/env'
import { i18n } from '@/lib/i18n'
import { initMonitoring } from '@/lib/monitoring'
import '@/styles/globals.css'

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
      </Providers>
    </StrictMode>,
  )
}

void i18n
void boot()
