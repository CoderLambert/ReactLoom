import type { Monitor } from './monitoring-types'

export type { Monitor }

const noop: Monitor = {
  captureException: () => undefined,
  setUser: () => undefined,
  addBreadcrumb: () => undefined,
}

export async function initMonitoring(dsn: string | undefined): Promise<Monitor> {
  if (!dsn) return noop

  try {
    const Sentry = await import('@sentry/react')
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
    })

    return {
      captureException: (error, context) => {
        Sentry.captureException(error, { extra: context })
      },
      setUser: (user) => {
        Sentry.setUser(user)
      },
      addBreadcrumb: (message, data) => {
        Sentry.addBreadcrumb({ message, data, category: 'reactloom' })
      },
    }
  } catch {
    // Telemetry is optional; a failed SDK chunk or initialization must not blank the app.
    console.warn('Monitoring initialization failed; continuing without telemetry.')
    return noop
  }
}
