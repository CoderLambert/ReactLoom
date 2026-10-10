'use client'

import { type ApiClient, createApiClient } from '@reactloom/api-client'

let client: ApiClient | undefined

export function getApi(): ApiClient {
  client ??= createApiClient({
    baseUrl: window.location.origin,
    credentials: 'include',
  })
  return client
}
