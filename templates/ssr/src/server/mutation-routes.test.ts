import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as login, DELETE as logout, GET as readSession } from '@/app/api/session/route'
import { PATCH as updateTask } from '@/app/api/tasks/[id]/route'
import { POST as createTask, GET as readTasks } from '@/app/api/tasks/route'
import { readSessionToken, SESSION_COOKIE, signSession } from './session-token'
import { type Task, tasks } from './tasks'

const origin = 'https://app.reactloom.test'
let requestCookies = new NextRequest(origin).cookies
let ownedTask: Task

// Only the Next request context is replaced; JWTs, responses, and the repository are real.
vi.mock('next/headers', () => ({ cookies: async () => requestCookies }))

beforeEach(async () => {
  requestCookies = new NextRequest(origin).cookies
  requestCookies.set(
    SESSION_COOKIE,
    await signSession({
      id: 'user-ada',
      email: 'ada@reactloom.dev',
      name: 'Ada Loom',
    }),
  )
  ownedTask = tasks.create('user-ada', 'Original task')
})

it.each([
  { route: 'GET /api/session', run: readSession },
  { route: 'GET /api/tasks', run: readTasks },
])('$route response prevents HTTP caching for both session states', async ({ run }) => {
  const authenticated = await run()
  expect(authenticated.status).toBe(200)
  expect(authenticated.headers.get('cache-control')).toBe('private, no-store')

  requestCookies = new NextRequest(origin).cookies
  const unauthenticated = await run()
  expect(unauthenticated.status).toBe(401)
  expect(unauthenticated.headers.get('cache-control')).toBe('private, no-store')
})

const routes = [
  {
    name: 'login',
    method: 'POST',
    path: '/api/session',
    body: { email: 'ada@reactloom.dev', password: 'loom-demo' },
    run: (request: Request) => login(request),
    success: 200,
  },
  {
    name: 'logout',
    method: 'DELETE',
    path: '/api/session',
    body: undefined,
    run: (request: Request) => logout(request),
    success: 200,
  },
  {
    name: 'task creation',
    method: 'POST',
    path: '/api/tasks',
    body: { title: '  New task  ' },
    run: (request: Request) => createTask(request),
    success: 201,
  },
  {
    name: 'task update',
    method: 'PATCH',
    path: '/api/tasks/task-id',
    body: { status: 'done' },
    run: (request: Request) =>
      updateTask(request, { params: Promise.resolve({ id: ownedTask.id }) }),
    success: 200,
  },
] as const

function requestFor(route: (typeof routes)[number], headers: HeadersInit = {}) {
  const requestHeaders = new Headers(headers)
  if (!requestHeaders.has('content-type')) requestHeaders.set('content-type', 'application/json')
  return new Request(`${origin}${route.path}`, {
    method: route.method,
    headers: requestHeaders,
    ...(route.body ? { body: JSON.stringify(route.body) } : {}),
  })
}

describe.each(routes)('$name request protection', (route) => {
  it('rejects a foreign origin before reading the body or changing state', async () => {
    const before = tasks.list('user-ada').map((task) => ({ ...task }))
    const request = requestFor(route, { origin: 'https://evil.test' })
    const response = await route.run(request)

    expect(response.status).toBe(403)
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(tasks.list('user-ada')).toEqual(before)
    expect(request.bodyUsed).toBe(false)
  })

  it('allows the same-origin mutation and applies its expected side effect', async () => {
    const response = await route.run(requestFor(route, { origin }))
    expect(response.status).toBe(route.success)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    if (route.name === 'login') {
      const token = response.headers.get('set-cookie')?.match(/rl_session=([^;]+)/)?.[1]
      expect(token).toBeDefined()
      await expect(readSessionToken(token ?? '')).resolves.toMatchObject({
        id: 'user-ada',
      })
    } else if (route.name === 'logout') {
      expect(response.headers.get('set-cookie')).toContain('Max-Age=0')
    } else if (route.name === 'task creation') {
      expect(await response.json()).toMatchObject({
        title: 'New task',
        ownerId: 'user-ada',
      })
    } else {
      expect(tasks.list('user-ada').find((task) => task.id === ownedTask.id)?.status).toBe('done')
    }
  })
})

describe.each(routes.filter((route) => route.body))('$name JSON request contract', (route) => {
  it('rejects form content without side effects', async () => {
    const before = tasks.list('user-ada').map((task) => ({ ...task }))
    const request = requestFor(route, {
      origin,
      'content-type': 'text/plain',
    })
    const response = await route.run(request)
    expect(response.status).toBe(415)
    expect(response.headers.has('set-cookie')).toBe(false)
    expect(tasks.list('user-ada')).toEqual(before)
    expect(request.bodyUsed).toBe(false)
  })

  it('keeps malformed JSON as a 400 response', async () => {
    const request = new Request(`${origin}${route.path}`, {
      method: route.method,
      headers: { origin, 'content-type': 'application/json' },
      body: '{',
    })
    expect((await route.run(request)).status).toBe(400)
  })
})

it('rejects a cross-site text/plain login form without issuing a session', async () => {
  const request = new Request(`${origin}/api/session`, {
    method: 'POST',
    headers: { origin: 'https://evil.test', 'content-type': 'text/plain' },
    body: '{"email":"ada@reactloom.dev","password":"loom-demo","padding":"=ok"}\r\n',
  })
  const response = await login(request)
  expect(response.status).toBe(403)
  expect(response.headers.has('set-cookie')).toBe(false)
})

it('preserves authentication and ownership failures for valid requests', async () => {
  requestCookies = new NextRequest(origin).cookies
  expect((await createTask(requestFor(routes[2], { origin }))).status).toBe(401)
  expect((await routes[3].run(requestFor(routes[3], { origin }))).status).toBe(401)

  requestCookies.set(
    SESSION_COOKIE,
    await signSession({
      id: 'someone-else',
      email: 'other@reactloom.dev',
      name: 'Other',
    }),
  )
  expect((await routes[3].run(requestFor(routes[3], { origin }))).status).toBe(404)
  expect(tasks.list('user-ada').find((task) => task.id === ownedTask.id)?.status).toBe('open')
})
