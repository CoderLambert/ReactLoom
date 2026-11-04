import { ApiError } from '@reactloom/api-client'
import type { QueryClient } from '@tanstack/react-query'
import type { Task, TaskRepository } from './repository'

export function createTaskQueryScope(
  client: QueryClient,
  revision: number,
  repository: TaskRepository,
) {
  const queryKey = ['mobile-tasks', revision]
  const requests = new Set<AbortController>()
  let active = true
  let epoch = 0
  let creating = false
  const updating = new Set<string>()

  function assertCurrent(expectedEpoch: number) {
    if (!active || expectedEpoch !== epoch) {
      throw new ApiError('The task request was cancelled.', 'aborted')
    }
  }

  async function run<T>(
    operation: (signal: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    const expectedEpoch = epoch
    assertCurrent(expectedEpoch)
    const controller = new AbortController()
    const abort = () => controller.abort()
    if (signal?.aborted) abort()
    signal?.addEventListener('abort', abort, { once: true })
    requests.add(controller)
    try {
      if (controller.signal.aborted)
        throw new ApiError('The task request was cancelled.', 'aborted')
      const result = await operation(controller.signal)
      assertCurrent(expectedEpoch)
      if (controller.signal.aborted)
        throw new ApiError('The task request was cancelled.', 'aborted')
      return result
    } finally {
      requests.delete(controller)
      signal?.removeEventListener('abort', abort)
    }
  }

  const queryOptions = {
    queryKey,
    queryFn: ({ signal }: { signal: AbortSignal }) => run(repository.list, signal),
    // The API client already retries idempotent HTTP requests.
    retry: false,
  }

  function commit(expectedEpoch: number, update: (tasks: Task[]) => Task[]) {
    assertCurrent(expectedEpoch)
    const state = client.getQueryState<Task[]>(queryKey)
    const refresh =
      state?.data === undefined ||
      state.status === 'error' ||
      state.fetchStatus !== 'idle' ||
      state.isInvalidated
    // Cancellation dispatches synchronously. Keep the confirmed write in the same turn
    // so another GET cannot start in an await gap and overwrite this mutation.
    void client.cancelQueries({ queryKey, exact: true })
    assertCurrent(expectedEpoch)
    client.setQueryData<Task[]>(queryKey, (tasks) => update(tasks ?? []))
    if (refresh) {
      // QueryClient keeps the confirmed data and the refresh error for the retry UI.
      // A failed list refresh must not turn a successful mutation into a retryable create.
      void client.fetchQuery(queryOptions).catch(() => undefined)
    }
  }

  return {
    queryOptions,
    activate: () => {
      active = true
    },
    dispose: () => {
      active = false
      epoch += 1
      for (const controller of requests) controller.abort()
      void client.cancelQueries({ queryKey, exact: true })
      client.removeQueries({ queryKey, exact: true })
    },
    create: async (title: string) => {
      if (creating) throw new Error('A task is already being added.')
      creating = true
      const expectedEpoch = epoch
      try {
        const task = await run((signal) => repository.create(title, signal))
        commit(expectedEpoch, (tasks) => [
          tasks.find((item) => item.id === task.id) ?? task,
          ...tasks.filter((item) => item.id !== task.id),
        ])
        return task
      } finally {
        creating = false
      }
    },
    setStatus: async (id: string, status: Task['status']) => {
      if (updating.has(id)) throw new Error('This task is already being updated.')
      updating.add(id)
      const expectedEpoch = epoch
      try {
        const task = await run((signal) => repository.setStatus(id, status, signal))
        commit(expectedEpoch, (tasks) => tasks.map((item) => (item.id === task.id ? task : item)))
        return task
      } finally {
        updating.delete(id)
      }
    },
  }
}
