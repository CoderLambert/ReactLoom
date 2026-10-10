import type { TaskStatus } from '@/features/tasks/schema'

export const taskKeys = {
  all: ['tasks'] as const,
  list: (status: 'all' | TaskStatus = 'all') => [...taskKeys.all, 'list', status] as const,
}
