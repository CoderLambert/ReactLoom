import {
  type CreateTaskInput,
  createTaskSchema,
  type TaskStatus,
  taskListSchema,
  taskSchema,
} from '@/features/tasks/schema'
import { api } from '@/lib/api'

export function listTasks(signal?: AbortSignal) {
  return api.request('/api/tasks', taskListSchema, { signal })
}

export function createTask(input: CreateTaskInput, signal?: AbortSignal) {
  return api.request('/api/tasks', taskSchema, {
    method: 'POST',
    body: createTaskSchema.parse(input),
    signal,
    retry: false,
  })
}

export function setTaskStatus(id: string, status: TaskStatus, signal?: AbortSignal) {
  return api.request(`/api/tasks/${id}`, taskSchema, {
    method: 'PATCH',
    body: { status },
    signal,
    retry: false,
  })
}
