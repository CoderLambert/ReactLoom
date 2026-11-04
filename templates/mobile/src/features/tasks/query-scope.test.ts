import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {} from 'vitest/node'
import { createTaskQueryScope } from './query-scope'
import { createTaskRepository } from './repository'

const clients: QueryClient[] = []
const servers: ReturnType<typeof createServer>[] = []

afterEach(async () => {
  for (const client of clients.splice(0)) client.clear()
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()))
          server.closeAllConnections()
        }),
    ),
  )
})

function client() {
  const value = new QueryClient()
  clients.push(value)
  return value
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error('Not initialized')
  }
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function send(response: ServerResponse, status: number, body: unknown) {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(body))
}

async function remote(respond: (request: IncomingMessage, response: ServerResponse) => void) {
  const server = createServer(respond)
  servers.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected HTTP port')
  return createTaskRepository([], {
    baseUrl: `http://127.0.0.1:${address.port}`,
    useFixtures: false,
    session: {
      accessToken: 'captured-session',
      expiresAt: Date.now() + 60_000,
      user: { id: 'ada', name: 'Ada', email: 'ada@reactloom.dev' },
    },
    invalidateSession: async () => undefined,
  })
}

describe('task query scope', () => {
  it('loads and changes server-confirmed tasks through QueryClient', async () => {
    const repository = await remote((request, response) => {
      if (request.method === 'GET') {
        send(response, 200, { tasks: [{ id: 'one', title: 'Original cloth', status: 'open' }] })
      } else {
        send(response, 200, { id: 'one', title: 'Confirmed cloth', status: 'done' })
      }
    })
    const queryClient = client()
    const scope = createTaskQueryScope(queryClient, 3, repository)
    await queryClient.fetchQuery(scope.queryOptions)
    await scope.setStatus('one', 'done')
    expect(queryClient.getQueryData(scope.queryOptions.queryKey)).toEqual([
      { id: 'one', title: 'Confirmed cloth', status: 'done' },
    ])
    expect(JSON.stringify(scope.queryOptions.queryKey)).not.toContain('captured-session')
  })

  it('aborts a pending mutation and removes only its own cache on session replacement', async () => {
    const received = deferred<ServerResponse>()
    const repository = await remote((_request, response) => received.resolve(response))
    const queryClient = client()
    queryClient.setQueryData(['unrelated'], 'keep')
    const oldScope = createTaskQueryScope(queryClient, 4, repository)
    queryClient.setQueryData(oldScope.queryOptions.queryKey, [])
    const mutation = oldScope.create('Old account draft')
    const rejected = expect(mutation).rejects.toMatchObject({ code: 'aborted' })
    const response = await received.promise
    oldScope.dispose()
    const nextScope = createTaskQueryScope(queryClient, 5, createTaskRepository())
    await queryClient.fetchQuery(nextScope.queryOptions)
    send(response, 200, { id: 'late', title: 'Old account draft', status: 'open' })
    await rejected
    expect(queryClient.getQueryData(oldScope.queryOptions.queryKey)).toBeUndefined()
    expect(queryClient.getQueryData(nextScope.queryOptions.queryKey)).toEqual([])
    expect(queryClient.getQueryData(['unrelated'])).toBe('keep')
  })

  it('creates fresh request controllers after a cleanup and reactivation', async () => {
    const first = deferred<ServerResponse>()
    let requests = 0
    const repository = await remote((_request, response) => {
      requests += 1
      if (requests === 1) first.resolve(response)
      else send(response, 200, { tasks: [{ id: 'fresh', title: 'Fresh cloth', status: 'open' }] })
    })
    const queryClient = client()
    const scope = createTaskQueryScope(queryClient, 6, repository)
    const pending = queryClient.fetchQuery(scope.queryOptions)
    const cancelled = expect(pending).rejects.toThrow()
    await first.promise
    scope.dispose()
    scope.activate()
    await cancelled
    expect(await queryClient.fetchQuery(scope.queryOptions)).toEqual([
      { id: 'fresh', title: 'Fresh cloth', status: 'open' },
    ])
    expect(requests).toBe(2)
  })

  it('blocks duplicate creates before React can rerender', async () => {
    const received = deferred<ServerResponse>()
    let requests = 0
    const repository = await remote((request, response) => {
      if (request.method === 'POST') {
        requests += 1
        received.resolve(response)
      } else send(response, 200, { tasks: [{ id: 'new', title: 'Weave cloth', status: 'open' }] })
    })
    const scope = createTaskQueryScope(client(), 7, repository)
    const first = scope.create('Weave cloth')
    await expect(scope.create('Weave cloth')).rejects.toThrow('already')
    send(await received.promise, 200, { id: 'new', title: 'Weave cloth', status: 'open' })
    await first
    expect(requests).toBe(1)
  })

  it('lets the API client retry GET once per policy without QueryClient multiplying attempts', async () => {
    let requests = 0
    const repository = await remote((_request, response) => {
      requests += 1
      response.setHeader('retry-after', '0')
      send(response, 503, { message: 'Unavailable' })
    })
    const queryClient = client()
    const scope = createTaskQueryScope(queryClient, 8, repository)
    await expect(queryClient.fetchQuery(scope.queryOptions)).rejects.toMatchObject({ status: 503 })
    expect(requests).toBe(3)
    expect(queryClient.getQueryData(scope.queryOptions.queryKey)).toBeUndefined()
  })

  it('keeps the confirmed cache intact when a status update fails', async () => {
    const repository = await remote((request, response) => {
      if (request.method === 'GET') {
        send(response, 200, { tasks: [{ id: 'one', title: 'Original cloth', status: 'open' }] })
      } else send(response, 500, { message: 'Update failed' })
    })
    const queryClient = client()
    const scope = createTaskQueryScope(queryClient, 9, repository)
    await queryClient.fetchQuery(scope.queryOptions)
    await expect(scope.setStatus('one', 'done')).rejects.toMatchObject({ status: 500 })
    expect(queryClient.getQueryData(scope.queryOptions.queryKey)).toEqual([
      { id: 'one', title: 'Original cloth', status: 'open' },
    ])
  })

  it('refreshes the complete list when create finishes before the initial GET', async () => {
    const first = deferred<ServerResponse>()
    const oldTask = { id: 'old', title: 'Existing cloth', status: 'open' }
    const newTask = { id: 'new', title: 'New cloth', status: 'open' }
    let reads = 0
    const repository = await remote((request, response) => {
      if (request.method !== 'GET') send(response, 200, newTask)
      else if (++reads === 1) first.resolve(response)
      else send(response, 200, { tasks: [newTask, oldTask] })
    })
    const queryClient = client()
    const scope = createTaskQueryScope(queryClient, 10, repository)
    const initial = queryClient.fetchQuery(scope.queryOptions).catch(() => undefined)
    const response = await first.promise
    expect(await scope.create(newTask.title)).toEqual(newTask)
    send(response, 200, { tasks: [oldTask] })
    await initial
    await vi.waitFor(() => {
      expect(queryClient.getQueryData(scope.queryOptions.queryKey)).toEqual([newTask, oldTask])
    })
    expect(reads).toBe(2)
  })

  it('retains the confirmed create if refresh fails and lets the list retry', async () => {
    const oldTask = { id: 'old', title: 'Existing cloth', status: 'open' }
    const newTask = { id: 'new', title: 'New cloth', status: 'open' }
    let failRead = true
    const repository = await remote((request, response) => {
      if (request.method !== 'GET') send(response, 200, newTask)
      else if (failRead) send(response, 400, { message: 'List unavailable' })
      else send(response, 200, { tasks: [newTask, oldTask] })
    })
    const queryClient = client()
    const scope = createTaskQueryScope(queryClient, 11, repository)
    expect(await scope.create(newTask.title)).toEqual(newTask)
    await vi.waitFor(() => {
      expect(queryClient.getQueryState(scope.queryOptions.queryKey)?.status).toBe('error')
    })
    expect(queryClient.getQueryData(scope.queryOptions.queryKey)).toEqual([newTask])
    failRead = false
    await queryClient.fetchQuery(scope.queryOptions)
    expect(queryClient.getQueryData(scope.queryOptions.queryKey)).toEqual([newTask, oldTask])
  })

  it('cancels a stale refresh before committing a newer confirmed status', async () => {
    const firstRefresh = deferred<ServerResponse>()
    const nextRefresh = deferred<ServerResponse>()
    const oldTask = { id: 'old', title: 'Existing cloth', status: 'open' }
    const newTask = { id: 'new', title: 'New cloth', status: 'open' }
    const updated = { id: 'new', title: 'Renamed cloth', status: 'done' }
    let reads = 0
    const repository = await remote((request, response) => {
      if (request.method === 'POST') send(response, 200, newTask)
      else if (request.method === 'PATCH') send(response, 200, updated)
      else if (++reads === 1) firstRefresh.resolve(response)
      else nextRefresh.resolve(response)
    })
    const queryClient = client()
    const scope = createTaskQueryScope(queryClient, 12, repository)
    await scope.create(newTask.title)
    const stale = await firstRefresh.promise
    expect(await scope.setStatus('new', 'done')).toEqual(updated)
    expect(queryClient.getQueryData(scope.queryOptions.queryKey)).toEqual([updated])
    const fresh = await nextRefresh.promise
    send(stale, 200, { tasks: [newTask, oldTask] })
    send(fresh, 200, { tasks: [updated, oldTask] })
    await vi.waitFor(() => {
      expect(queryClient.getQueryData(scope.queryOptions.queryKey)).toEqual([updated, oldTask])
    })
    expect(reads).toBe(2)
  })

  it('preserves a newer confirmed canonical task when its older create response arrives late', async () => {
    const post = deferred<ServerResponse>()
    const created = { id: 'new', title: 'New cloth', status: 'open' }
    const updated = { id: 'new', title: 'Renamed cloth', status: 'done' }
    const repository = await remote((request, response) => {
      if (request.method === 'POST') post.resolve(response)
      else if (request.method === 'PATCH') send(response, 200, updated)
      else send(response, 200, { tasks: [created] })
    })
    const queryClient = client()
    const scope = createTaskQueryScope(queryClient, 13, repository)
    const pending = scope.create(created.title)
    const response = await post.promise
    await queryClient.fetchQuery(scope.queryOptions)
    await scope.setStatus('new', 'done')
    send(response, 200, created)
    await pending
    expect(queryClient.getQueryData(scope.queryOptions.queryKey)).toEqual([updated])
  })
})
