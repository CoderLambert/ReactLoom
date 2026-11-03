import { createApiClient, isApiError } from '@reactloom/api-client'
import { getActiveSession, useAuthStore } from '@/features/auth/store'
import { env } from '@/lib/env'

export const api = createApiClient({
  baseUrl: env.VITE_API_BASE_URL,
  getAccessToken: () => getActiveSession()?.accessToken ?? null,
  onUnauthorized: () => {
    useAuthStore.getState().clearSession()
  },
  logger: {
    debug: (message, extra) => console.debug(message, extra),
    warn: (message, extra) => console.warn(message, extra),
  },
})

export { isApiError }
