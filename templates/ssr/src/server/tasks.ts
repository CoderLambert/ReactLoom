import type { SessionUser } from './session-token'

export type Task = {
  id: string
  title: string
  status: 'open' | 'done'
  ownerId: string
  createdAt: string
}

export type TaskRepository = {
  list: (ownerId: string) => Task[]
  create: (ownerId: string, title: string) => Task
  setStatus: (ownerId: string, id: string, status: Task['status']) => Task | undefined
}

type Store = { tasks: Task[]; sequence: number }

const globalStore = globalThis as typeof globalThis & { __reactloomTasks?: Store }

function store(): Store {
  globalStore.__reactloomTasks ??= {
    sequence: 2,
    tasks: [
      {
        id: 'task-1',
        title: 'Dress the loom',
        status: 'open',
        ownerId: 'user-ada',
        createdAt: '2026-10-10T12:00:00.000Z',
      },
      {
        id: 'task-2',
        title: 'Wind a bobbin',
        status: 'done',
        ownerId: 'user-ada',
        createdAt: '2026-10-10T12:05:00.000Z',
      },
    ],
  }
  return globalStore.__reactloomTasks
}

export function createTaskRepository(initial?: Store): TaskRepository {
  const state = initial ?? store()
  return {
    list: (ownerId) => state.tasks.filter((task) => task.ownerId === ownerId),
    create: (ownerId, title) => {
      state.sequence += 1
      const task: Task = {
        id: `task-${state.sequence}`,
        title,
        status: 'open',
        ownerId,
        createdAt: new Date().toISOString(),
      }
      state.tasks = [task, ...state.tasks]
      return task
    },
    setStatus: (ownerId, id, status) => {
      const current = state.tasks.find((task) => task.id === id && task.ownerId === ownerId)
      if (!current) return undefined
      const next = { ...current, status }
      state.tasks = state.tasks.map((task) => (task.id === id ? next : task))
      return next
    },
  }
}

export const tasks = createTaskRepository()

export const demoCredentials = {
  email: 'ada@reactloom.dev',
  password: 'loom-demo',
}

export function authenticate(email: string, password: string): SessionUser | null {
  if (email !== demoCredentials.email || password !== demoCredentials.password) return null
  return { id: 'user-ada', email, name: 'Ada Loom' }
}
