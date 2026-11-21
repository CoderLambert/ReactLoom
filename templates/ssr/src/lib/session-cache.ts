import type { QueryClient } from '@tanstack/react-query'

// Session transitions must not reuse cached data or complete in-flight fetches
// that were authorized by a previous cookie.
export async function clearSessionCache(client: QueryClient): Promise<void> {
  await client.cancelQueries()
  client.clear()
}
