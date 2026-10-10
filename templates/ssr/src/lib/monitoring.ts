export type Monitor = {
  captureException: (error: unknown, context?: Record<string, unknown>) => void
  setUser: (user: { id: string; email?: string } | null) => void
}

export async function initMonitoring(dsn: string | undefined): Promise<Monitor> {
  if (!dsn) {
    return {
      captureException: () => undefined,
      setUser: () => undefined,
    }
  }
  const Sentry = await import('@sentry/nextjs')
  Sentry.init({ dsn, tracesSampleRate: 0.1 })
  return {
    captureException: (error, context) => {
      Sentry.captureException(error, { extra: context })
    },
    setUser: (user) => {
      Sentry.setUser(user)
    },
  }
}
