import { queryOptions } from '@tanstack/react-query'
import type { Backend, Tenant } from './fixture-backend'
import { keys } from './query-keys.ts'

export const SHARED_STALE_TIME = 3_000
export function sharedStatsOptions(backend: Backend, tenant: Tenant) {
  return queryOptions({
    queryKey: keys.stats(tenant),
    queryFn: ({ signal }) => backend.stats(tenant, signal, 600),
    staleTime: SHARED_STALE_TIME,
    // Keep this experiment's request count controlled. Workspace keeps normal defaults.
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}
