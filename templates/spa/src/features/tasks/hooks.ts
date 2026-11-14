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
      return { optimisticId: optimistic.id }
    },
    onSuccess: (task, _title, context) => {
      if (isCurrentSession(version) && context) {
        queryClient.setQueryData<{ tasks: Task[] }>(taskKeys.list(version), (current) => {
          if (!current) return current
          const tasks = current.tasks.filter((item) => item.id !== context.optimisticId)
          // A concurrent refetch may already contain a newer version of the server task.
          return { tasks: tasks.some((item) => item.id === task.id) ? tasks : [task, ...tasks] }
        })
      }
    },
    onError: (_error, _title, context) => {
      if (isCurrentSession(version) && context) {
        queryClient.setQueryData<{ tasks: Task[] }>(taskKeys.list(version), (current) =>
          current
            ? { tasks: current.tasks.filter((task) => task.id !== context.optimisticId) }
            : current,
        )
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
    onMutate: async () => {
      if (!isCurrentSession(version)) return
      // An earlier GET can complete after PATCH and replace the confirmed status
      // with stale data. Stop only this session's reads before sending the write.
      await queryClient.cancelQueries({ queryKey: taskKeys.session(version) })
    },
    onSuccess: (task) => {
      if (!isCurrentSession(version)) return
      // A successful write must remain visible if the follow-up read fails.
      queryClient.setQueryData<{ tasks: Task[] }>(taskKeys.list(version), (current) =>
        current
          ? { tasks: current.tasks.map((item) => (item.id === task.id ? task : item)) }
          : current,
      )
    },
    onSettled: async () => {
      if (isCurrentSession(version)) {
        await queryClient.invalidateQueries({ queryKey: taskKeys.session(version) })
      }
    },
  })
}
