import { ApiError, createApiClient, isApiError } from '@reactloom/api-client'
import type { Session } from '../auth/schema'
import { type Task, taskListSchema, taskSchema, taskTitleSchema } from './schema'

export type { Task } from './schema'

type RepositoryOptions = {
  baseUrl: string
  useFixtures: boolean
  session: Session
  invalidateSession: (expectedSession: Session) => Promise<void>
}

export type TaskRepository = ReturnType<typeof createTaskRepository>

export function createTaskRepository(initial: Task[] = [], options?: RepositoryOptions) {
  let tasks = initial.map((task) => ({ ...task }))
  let nextId = tasks.length + 1

  function checkSession() {
    if (options && options.session.expiresAt <= Date.now()) {
      throw new ApiError('Sign in is required.', 'unauthorized')
    }
  }

  const api =
    options && !options.useFixtures
      ? createApiClient({
          baseUrl: options.baseUrl,
          credentials: 'omit',
          getAccessToken: () => {
            checkSession()
            return options.session.accessToken
          },
        })
      : null

  async function request<T>(operation: () => Promise<T>): Promise<T> {
    try {
      checkSession()
      const result = await operation()
      checkSession()
      return result
    } catch (error) {
      if (isApiError(error) && error.code === 'unauthorized' && options) {
        await options.invalidateSession(options.session)
      }
      throw error
    }
  }

  return {
    list: (signal?: AbortSignal) =>
      request(async () => {
        if (api) return (await api.request('/api/tasks', taskListSchema, { signal })).tasks
        return tasks
      }),
    create: (title: string, signal?: AbortSignal) =>
      request(async () => {
        const input = { title: taskTitleSchema.parse(title) }
        if (api) {
          return api.request('/api/tasks', taskSchema, {
            method: 'POST',
            body: input,
            signal,
            retry: false,
          })
        }
        const task: Task = { id: `task-${nextId++}`, title: input.title, status: 'open' }
        tasks = [task, ...tasks]
        return task
      }),
    setStatus: (id: string, status: Task['status'], signal?: AbortSignal) =>
      request(async () => {
        if (api) {
          return api.request(`/api/tasks/${encodeURIComponent(id)}`, taskSchema, {
            method: 'PATCH',
            body: { status },
            signal,
            retry: false,
          })
        }
        const existing = tasks.find((task) => task.id === id)
        if (!existing) throw new Error('Task not found.')
        const updated = { ...existing, status }
        tasks = tasks.map((task) => (task.id === id ? updated : task))
        return updated
      }),
  }
}
