import { QueryClient } from '@tanstack/react-query'
import { expect, it } from 'vitest'
import { clearSessionCache } from './session-cache'

it('drops data cached under the previous cookie session', async () => {
  const client = new QueryClient()
  client.setQueryData(['tasks'], { tasks: [{ id: 'task-from-previous-user' }] })
  client.setQueryData(['session'], { user: { id: 'previous-user' } })

  await clearSessionCache(client)

  expect(client.getQueryCache().getAll()).toHaveLength(0)
  expect(client.getQueryData(['tasks'])).toBeUndefined()
  expect(client.getQueryData(['session'])).toBeUndefined()
})

it('cancels an in-flight task request before removing its cache entry', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  let aborted = false
  const pending = client.fetchQuery({
    queryKey: ['tasks'],
    queryFn: ({ signal }) =>
      new Promise<never>((_, reject) => {
        signal.addEventListener(
          'abort',
          () => {
            aborted = true
            reject(new Error('request aborted'))
          },
          { once: true },
        )
      }),
  })
  const handled = pending.catch(() => undefined)

  await clearSessionCache(client)
  await handled

  expect(aborted).toBe(true)
  expect(client.getQueryCache().getAll()).toHaveLength(0)
})
