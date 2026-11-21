import { type ApiClient, createApiClient, isApiError } from '@reactloom/api-client'
import { isSessionExpired } from '@/features/auth/session-expiration'
import { getActiveSession, useAuthStore } from '@/features/auth/store'
import { env } from '@/lib/env'

export const api: ApiClient = {
  request: (path, schema, options) => {
    const session = getActiveSession()
    const { sessionVersion: version, authOperation } = useAuthStore.getState()
    const clearRequestSession = () => {
      const current = useAuthStore.getState()
      if (current.sessionVersion === version && current.authOperation === authOperation) {
        current.clearSession()
      }
    }
    // Retries belong to the initiating session; a late 401 must not clear its replacement.
    const client = createApiClient({
      baseUrl: env.VITE_API_BASE_URL,
      getAccessToken: () => {
        if (!session) return null
        if (isSessionExpired(session.expiresAt)) {
          clearRequestSession()
          return null
        }
        return session.accessToken
      },
      onUnauthorized: clearRequestSession,
      logger: {
        debug: (message, extra) => console.debug(message, extra),
        warn: (message, extra) => console.warn(message, extra),
      },
    })
    return client.request(path, schema, options)
  },
}

// Public sign-in must not forward an existing session's bearer or clear it on 401.
export const publicApi: ApiClient = createApiClient({ baseUrl: env.VITE_API_BASE_URL })

export { isApiError }
