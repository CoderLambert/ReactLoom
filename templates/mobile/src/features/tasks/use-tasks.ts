import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import type { Session } from '@/features/auth/schema'
import { env } from '@/lib/env'
import { createTaskQueryScope } from './query-scope'
import { createTaskRepository, type Task } from './repository'

type TaskSession = {
  session: Session
  revision: number
  invalidateSession: (expectedSession: Session) => Promise<void>
}

export function useTasks({ session, revision, invalidateSession }: TaskSession) {
  const client = useQueryClient()
  const scope = useMemo(
    () =>
      createTaskQueryScope(
        client,
        revision,
        createTaskRepository(
          [
            { id: 'task-1', title: 'Dress the loom', status: 'open' },
            { id: 'task-2', title: 'Wind a bobbin', status: 'done' },
          ],
          {
            baseUrl: env.EXPO_PUBLIC_API_BASE_URL,
            useFixtures: env.EXPO_PUBLIC_USE_FIXTURES === 'true',
            session,
            invalidateSession,
          },
        ),
      ),
    [client, revision, session, invalidateSession],
  )

  useEffect(() => {
    scope.activate()
    return scope.dispose
  }, [scope])

  const query = useQuery(scope.queryOptions)
  const createTask = useMutation({ mutationFn: scope.create, retry: false })
  const updateTask = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      scope.setStatus(id, status),
    retry: false,
  })

  return { query, createTask, updateTask }
}
