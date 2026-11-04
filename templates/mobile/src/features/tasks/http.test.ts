import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {} from 'vitest/node'
import { createTaskRepository } from './repository'

type ReceivedRequest = {
  method: string | undefined
  path: string | undefined
  authorization: string | undefined
  body: unknown
}

const servers: ReturnType<typeof createServer>[] = []

afterEach(async () => {
  vi.restoreAllMocks()
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

async function serve(respond: (request: IncomingMessage, response: ServerResponse) => void) {
  const server = createServer(respond)
  servers.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('Expected an HTTP port')
  return `http://127.0.0.1:${address.port}`
}

function send(response: ServerResponse, status: number, payload: unknown) {
  response.writeHead(status, { 'content-type': 'application/json' })
  response.end(JSON.stringify(payload))
}

async function receive(request: IncomingMessage): Promise<ReceivedRequest> {
  let text = ''
  for await (const chunk of request) text += String(chunk)
  return {
    method: request.method,
    path: request.url,
    authorization: request.headers.authorization,
    body: text ? JSON.parse(text) : undefined,
  }
}

function session(token = 'first-account') {
  return {
    accessToken: token,
    expiresAt: Date.now() + 60_000,
    user: { id: token, name: 'Ada Loom', email: 'ada@reactloom.dev' },
  }
}

describe('task HTTP repository', () => {
  it('loads the API list with the captured bearer session when fixtures are disabled', async () => {
    const requests: ReceivedRequest[] = []
    const baseUrl = await serve((request, response) => {
      void receive(request).then((received) => {
        requests.push(received)
        send(response, 200, {
          tasks: [{ id: 'remote-1', title: 'Remote warp', status: 'open', createdAt: 'now' }],
        })
      })
    })
    const repository = createTaskRepository([], {
      baseUrl,
      useFixtures: false,
      session: session(),
      invalidateSession: async () => undefined,
    })

    expect(await repository.list()).toEqual([
      { id: 'remote-1', title: 'Remote warp', status: 'open' },
    ])
    expect(requests).toEqual([
      { method: 'GET', path: '/api/tasks', authorization: 'Bearer first-account', body: undefined },
    ])
  })

  it('sends validated creates and status updates and returns server-confirmed data', async () => {
    const requests: ReceivedRequest[] = []
    const baseUrl = await serve((request, response) => {
      void receive(request).then((received) => {
        requests.push(received)
        send(response, 200, {
          id: 'remote-1',
          title: 'Server title',
          status: received.method === 'PATCH' ? 'done' : 'open',
          createdAt: 'now',
        })
      })
    })
    const repository = createTaskRepository([], {
      baseUrl,
      useFixtures: false,
      session: session(),
      invalidateSession: async () => undefined,
    })

    expect(await repository.create('  Weave cloth  ')).toEqual({
      id: 'remote-1',
      title: 'Server title',
      status: 'open',
    })
    expect(await repository.setStatus('remote-1', 'done')).toEqual({
      id: 'remote-1',
      title: 'Server title',
      status: 'done',
    })
    expect(requests.map(({ method, path, body }) => ({ method, path, body }))).toEqual([
      { method: 'POST', path: '/api/tasks', body: { title: 'Weave cloth' } },
      { method: 'PATCH', path: '/api/tasks/remote-1', body: { status: 'done' } },
    ])
  })

  it('rejects invalid titles without contacting the server', async () => {
    let requests = 0
    const baseUrl = await serve((_request, response) => {
      requests += 1
      send(response, 200, {})
    })
    const repository = createTaskRepository([], {
      baseUrl,
      useFixtures: false,
      session: session(),
      invalidateSession: async () => undefined,
    })

    await expect(repository.create('  x ')).rejects.toThrow()
    await expect(repository.create('x'.repeat(81))).rejects.toThrow()
    expect(requests).toBe(0)
  })

  it('invalidates only the captured session on 401 and never retries mutations', async () => {
    let requests = 0
    const invalidated: unknown[] = []
    const captured = session()
    const baseUrl = await serve((_request, response) => {
      requests += 1
      send(response, 401, { message: 'Expired remotely' })
    })
    const repository = createTaskRepository([], {
      baseUrl,
      useFixtures: false,
      session: captured,
      invalidateSession: async (expected) => {
        invalidated.push(expected)
      },
    })

    await expect(repository.create('Weave cloth')).rejects.toMatchObject({ code: 'unauthorized' })
    expect(requests).toBe(1)
    expect(invalidated).toEqual([captured])
    expect(invalidated[0]).toBe(captured)
  })

  it('checks expiry before using credentials', async () => {
    let requests = 0
    const captured = { ...session(), expiresAt: Date.now() - 1 }
    const invalidated: unknown[] = []
    const baseUrl = await serve((_request, response) => {
      requests += 1
      send(response, 200, { tasks: [] })
    })
    const repository = createTaskRepository([], {
      baseUrl,
      useFixtures: false,
      session: captured,
      invalidateSession: async (expected) => {
        invalidated.push(expected)
      },
    })

    await expect(repository.list()).rejects.toMatchObject({ code: 'unauthorized' })
    expect(requests).toBe(0)
    expect(invalidated[0]).toBe(captured)
  })

  it('does not retry failed POST or PATCH requests', async () => {
    const methods: string[] = []
    const baseUrl = await serve((request, response) => {
      methods.push(request.method ?? '')
      send(response, 503, { message: 'Unavailable' })
    })
    const repository = createTaskRepository([], {
      baseUrl,
      useFixtures: false,
      session: session(),
      invalidateSession: async () => undefined,
    })
    await expect(repository.create('Weave cloth')).rejects.toMatchObject({ status: 503 })
    await expect(repository.setStatus('one/two', 'done')).rejects.toMatchObject({ status: 503 })
    expect(methods).toEqual(['POST', 'PATCH'])
  })

  it('encodes task identifiers and rejects malformed API data', async () => {
    const paths: string[] = []
    const baseUrl = await serve((request, response) => {
      paths.push(request.url ?? '')
      send(response, 200, { id: 'one/two', title: 'Weave cloth', status: 'unexpected' })
    })
    const repository = createTaskRepository([], {
      baseUrl,
      useFixtures: false,
      session: session(),
      invalidateSession: async () => undefined,
    })
    await expect(repository.setStatus('one/two', 'done')).rejects.toMatchObject({
      code: 'validation',
    })
    expect(paths).toEqual(['/api/tasks/one%2Ftwo'])
  })

  it('rejects a successful mutation response when its captured session expired in flight', async () => {
    let deliver: (response: ServerResponse) => void = () => {
      throw new Error('Not initialized')
    }
    const received = new Promise<ServerResponse>((resolve) => {
      deliver = resolve
    })
    const captured = session()
    const invalidated: unknown[] = []
    const baseUrl = await serve((_request, response) => deliver(response))
    const repository = createTaskRepository([], {
      baseUrl,
      useFixtures: false,
      session: captured,
      invalidateSession: async (expected) => {
        invalidated.push(expected)
      },
    })
    const pending = repository.create('Weave cloth')
    const response = await received
    vi.spyOn(Date, 'now').mockReturnValue(captured.expiresAt)
    send(response, 200, { id: 'late', title: 'Weave cloth', status: 'open' })
    await expect(pending).rejects.toMatchObject({ code: 'unauthorized' })
    expect(invalidated[0]).toBe(captured)
  })
})
