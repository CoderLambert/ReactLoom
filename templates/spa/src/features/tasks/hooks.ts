import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createTask, listTasks, setTaskStatus } from '@/features/tasks/api'
import { taskKeys } from '@/features/tasks/keys'
import type { Task, TaskStatus } from '@/features/tasks/schema'

export function useTasks() {
  return useQuery({
    queryKey: taskKeys.list(),
    queryFn: ({ signal }) => listTasks(signal),
    select: (data) => data.tasks,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => createTask({ title }),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all })
      const previous = queryClient.getQueryData<{ tasks: Task[] }>(taskKeys.list())
      const optimistic: Task = {
        id: `tmp-${crypto.randomUUID()}`,
        title,
        status: 'open',
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData<{ tasks: Task[] }>(taskKeys.list(), {
        tasks: [optimistic, ...(previous?.tasks ?? [])],
      })
      return { previous }
    },
    onError: (_error, _title, context) => {
      if (context?.previous) queryClient.setQueryData(taskKeys.list(), context.previous)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

export function useSetTaskStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => setTaskStatus(id, status),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}
