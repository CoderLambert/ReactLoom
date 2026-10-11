import { HttpResponse, http } from 'msw/http'

const user = { id: 'user-ada', email: 'ada@reactloom.dev', name: 'Ada Loom' }

let signedIn = false
let tasks = [
  {
    id: 'task-1',
    title: 'Dress the loom',
    status: 'open' as const,
    ownerId: user.id,
    createdAt: '2026-10-10T12:00:00.000Z',
  },
  {
    id: 'task-2',
    title: 'Wind a bobbin',
    status: 'done' as const,
    ownerId: user.id,
    createdAt: '2026-10-10T12:05:00.000Z',
  },
]

export const handlers = [
  http.post('*/api/session', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string }
    if (body.email !== user.email || body.password !== 'loom-demo') {
      return HttpResponse.json(
        { message: 'Those credentials were not recognized.' },
        { status: 401 },
      )
    }
    signedIn = true
    return HttpResponse.json({ user })
  }),

  http.get('*/api/tasks', () => {
    if (!signedIn) {
      return HttpResponse.json({ message: 'Sign in is required.' }, { status: 401 })
    }
    return HttpResponse.json({ tasks })
  }),

  http.post('*/api/tasks', async ({ request }) => {
    if (!signedIn) {
      return HttpResponse.json({ message: 'Sign in is required.' }, { status: 401 })
    }
    const body = (await request.json()) as { title?: string }
    const task = {
      id: `task-${tasks.length + 1}`,
      title: body.title ?? '',
      status: 'open' as const,
      ownerId: user.id,
      createdAt: new Date().toISOString(),
    }
    tasks = [task, ...tasks]
    return HttpResponse.json(task, { status: 201 })
  }),
]
