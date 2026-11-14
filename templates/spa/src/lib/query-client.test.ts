import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { listTasks } from '@/features/tasks/api'
import { createAppQueryClient } from '@/lib/query-client'
import { server } from '@/mocks/server'

describe('query retry ownership', () => {
  it.each([
    {
      failure: 'HTTP 503',
      respond: () =>
        HttpResponse.json(
          { message: 'Service unavailable.' },
          { status: 503, headers: { 'Retry-After': '0' } },
        ),
    },
    { failure: 'network', respond: () => HttpResponse.error() },
  ])('does not repeat the API client retry budget after a $failure failure', async ({ respond }) => {
    let attempts = 0
    server.use(
      http.get('*/api/tasks', () => {
        attempts += 1
        return respond()
      }),
    )
    const client = createAppQueryClient()
    try {
      await expect(
        client.fetchQuery({
          queryKey: ['retry-budget'],
          queryFn: ({ signal }) => listTasks(signal),
          retryDelay: 0,
        }),
      ).rejects.toBeDefined()
      // The shared HTTP client owns its three GET attempts; Query must not
      // repeat the entire sequence (up to nine requests on the old policy).
      expect(attempts).toBe(3)
    } finally {
      client.clear()
    }
  })
})
