export type Monitor = {
  captureException: (error: unknown, context?: Record<string, unknown>) => void
  setUser: (user: { id: string } | null) => void
}

export function createMonitor(dsn: string | undefined): Monitor {
  if (!dsn) {
    return {
      captureException: (error) => {
        console.warn('monitor', error)
      },
      setUser: () => undefined,
    }
  }
  return {
    captureException: (error, context) => {
      console.error('sentry-hook', dsn, error, context)
    },
    setUser: () => undefined,
  }
}
