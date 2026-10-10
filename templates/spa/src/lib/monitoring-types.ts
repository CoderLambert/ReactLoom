export type Monitor = {
  captureException: (error: unknown, context?: Record<string, unknown>) => void
  setUser: (user: { id: string; email?: string } | null) => void
  addBreadcrumb: (message: string, data?: Record<string, unknown>) => void
}
