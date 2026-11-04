import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getActiveSession, useAuthStore } from '@/features/auth/store'
import { createTask, listTasks, setTaskStatus } from '@/features/tasks/api'
import { taskKeys } from '@/features/tasks/keys'
import type { Task, TaskStatus } from '@/features/tasks/schema'

function isCurrentSession(version: number) {
  return useAuthStore.getState().sessionVersion === version && getActiveSession() !== null
}

export function useTasks() {
  const version = useAuthStore((state) => state.sessionVersion)
  const session = useAuthStore((state) => state.session)
  return useQuery({
    queryKey: taskKeys.list(version),
    queryFn: ({ signal }) => listTasks(signal),
    select: (data) => data.tasks,
    enabled: session !== null,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const version = useAuthStore((state) => state.sessionVersion)
  return useMutation({
    mutationKey: [...taskKeys.session(version), 'create'],
    mutationFn: (title: string) => {
      if (!isCurrentSession(version)) throw new Error('The session has changed.')
      return createTask({ title })
    },
    onMutate: async (title) => {
      if (!isCurrentSession(version)) return
      await queryClient.cancelQueries({ queryKey: taskKeys.session(version) })
      if (!isCurrentSession(version)) return
      const previous = queryClient.getQueryData<{ tasks: Task[] }>(taskKeys.list(version))
      const optimistic: Task = {
        id: `tmp-${crypto.randomUUID()}`,
        title,
        status: 'open',
        createdAt: new Date().toISOString(),
      }
      queryClient.setQueryData<{ tasks: Task[] }>(taskKeys.list(version), {
        tasks: [optimistic, ...(previous?.tasks ?? [])],
      })
      return { previous }
    },
    onError: (_error, _title, context) => {
      if (isCurrentSession(version) && context?.previous) {
        queryClient.setQueryData(taskKeys.list(version), context.previous)
      }
    },
    onSettled: async () => {
      if (isCurrentSession(version)) {
        await queryClient.invalidateQueries({ queryKey: taskKeys.session(version) })
      }
    },
  })
}

export function useSetTaskStatus() {
  const queryClient = useQueryClient()
  const version = useAuthStore((state) => state.sessionVersion)
  return useMutation({
    mutationKey: [...taskKeys.session(version), 'status'],
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => {
      if (!isCurrentSession(version)) throw new Error('The session has changed.')
      return setTaskStatus(id, status)
    },
    onSettled: async () => {
      if (isCurrentSession(version)) {
        await queryClient.invalidateQueries({ queryKey: taskKeys.session(version) })
      }
    },
  })
}
