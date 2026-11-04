import type { TaskStatus } from '@/features/tasks/schema'

export const taskKeys = {
  all: ['tasks'] as const,
  session: (version: number) => [...taskKeys.all, 'session', version] as const,
  list: (version: number, status: 'all' | TaskStatus = 'all') =>
    [...taskKeys.session(version), 'list', status] as const,
}
