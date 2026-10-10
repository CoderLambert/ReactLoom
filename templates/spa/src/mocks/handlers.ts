import { HttpResponse, http } from 'msw/http'
import type { Task, TaskStatus } from '@/features/tasks/schema'
import { demoSession, demoToken, demoUser, seedTasks } from '@/mocks/fixtures'

let tasks = seedTasks()
const tokens = new Set<string>()

export function resetFixtures() {
  tasks = seedTasks()
  tokens.clear()
}

function isAuthorized(request: Request) {
  return request.headers.get('authorization') === `Bearer ${demoToken}` && tokens.has(demoToken)
}

export const handlers = [
  http.post('*/api/session', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }
    if (body.email !== demoUser.email || body.password !== demoUser.password) {
      return HttpResponse.json(
        { message: 'Those credentials were not recognized.' },
        { status: 401 },
      )
    }
    tokens.add(demoToken)
    return HttpResponse.json(demoSession())
  }),

  http.post('*/api/session/logout', ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'Sign in is required.' }, { status: 401 })
    }
    tokens.delete(demoToken)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/api/tasks', ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'Sign in is required.' }, { status: 401 })
    }
    return HttpResponse.json({ tasks })
  }),

  http.post('*/api/tasks', async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'Sign in is required.' }, { status: 401 })
    }
    const body = (await request.json()) as { title?: string }
    const task: Task = {
      id: `task-${tasks.length + 1}`,
      title: body.title ?? '',
      status: 'open',
      createdAt: new Date().toISOString(),
    }
    tasks = [task, ...tasks]
    return HttpResponse.json(task, { status: 201 })
  }),

  http.patch('*/api/tasks/:id', async ({ request, params }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: 'Sign in is required.' }, { status: 401 })
    }
    const body = (await request.json()) as { status?: TaskStatus }
    const current = tasks.find((task) => task.id === params.id)
    if (!current || (body.status !== 'open' && body.status !== 'done')) {
      return HttpResponse.json({ message: 'Task not found.' }, { status: 404 })
    }
    const next = { ...current, status: body.status }
    tasks = tasks.map((task) => (task.id === current.id ? next : task))
    return HttpResponse.json(next)
  }),
]
