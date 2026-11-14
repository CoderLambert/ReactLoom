import { isApiError } from '@reactloom/api-client'
import { QueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/store'

export function bindSessionQueryCache(client: QueryClient) {
  return useAuthStore.subscribe((state, previous) => {
    if (state.sessionVersion === previous.sessionVersion) return
    void client.cancelQueries()
    client.removeQueries()
  })
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // The API client already retries eligible GET failures with backoff.
          // Retrying its final ApiError here multiplies the network requests.
          if (isApiError(error)) return false
          return failureCount < 2
        },
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const queryClient = createAppQueryClient()
