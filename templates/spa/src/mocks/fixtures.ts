import type { Session } from '@/features/auth/schema'
import type { Task } from '@/features/tasks/schema'

export const demoUser = {
  id: 'user-ada',
  name: 'Ada Loom',
  email: 'ada@reactloom.dev',
  password: 'loom-demo',
}

export const demoToken = 'rl-demo-token'

export function demoSession(): Session {
  return {
    accessToken: demoToken,
    expiresAt: Date.now() + 60 * 60 * 1000,
    user: {
      id: demoUser.id,
      name: demoUser.name,
      email: demoUser.email,
    },
  }
}

export function seedTasks(): Task[] {
  return [
    {
      id: 'task-1',
      title: 'Dress the loom',
      status: 'open',
      createdAt: '2026-10-10T12:00:00.000Z',
    },
    {
      id: 'task-2',
      title: 'Wind a bobbin',
      status: 'done',
      createdAt: '2026-10-10T12:05:00.000Z',
    },
  ]
}
