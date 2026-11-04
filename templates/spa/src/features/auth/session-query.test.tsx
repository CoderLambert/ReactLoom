import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { type ReactNode, StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Providers } from '@/app/providers'
import { getActiveSession, useAuthStore } from '@/features/auth/store'
import { listTasks } from '@/features/tasks/api'
import { useCreateTask, useSetTaskStatus, useTasks } from '@/features/tasks/hooks'
import type { Task } from '@/features/tasks/schema'
import { queryClient } from '@/lib/query-client'
import { demoSession } from '@/mocks/fixtures'
import { server } from '@/mocks/server'

const taskA: Task = {
  id: 'private-a',
  title: 'Private task for A',
  status: 'open',
  createdAt: '2026-11-04T00:00:00.000Z',
}
const taskB: Task = { ...taskA, id: 'private-b', title: 'Private task for B' }

function wrapper({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <Providers>{children}</Providers>
    </StrictMode>
  )
}

function cachedTitles() {
  return queryClient
    .getQueriesData<{ tasks: Task[] }>({})
    .flatMap(([, data]) => data?.tasks.map((task) => task.title) ?? [])
}

beforeEach(() => {
  queryClient.clear()
  useAuthStore.getState().setSession({ ...demoSession(), accessToken: 'session-a' })
  server.use(
    http.get('*/api/tasks', ({ request }) =>
      HttpResponse.json({
        tasks: request.headers.get('authorization') === 'Bearer session-a' ? [taskA] : [taskB],
      }),
    ),
  )
})

afterEach(() => {
  cleanup()
  useAuthStore.getState().clearSession()
  queryClient.clear()
})

describe('private query session boundaries', () => {
  it('drops mounted task data on sign-out and fetches fresh data for the next session', async () => {
    const { result } = renderHook(useTasks, { wrapper })
    await waitFor(() => expect(result.current.data).toEqual([taskA]))

    act(() => useAuthStore.getState().clearSession())

    await waitFor(() => expect(result.current.data).toBeUndefined())
    expect(cachedTitles()).not.toContain(taskA.title)
    expect(result.current.fetchStatus).toBe('idle')

    act(() => useAuthStore.getState().setSession({ ...demoSession(), accessToken: 'session-b' }))

    await waitFor(() => expect(result.current.data).toEqual([taskB]))
    expect(cachedTitles()).not.toContain(taskA.title)
  })

  it('isolates a replacement session even while the previous query is still fresh', async () => {
    const { result } = renderHook(useTasks, { wrapper })
    await waitFor(() => expect(result.current.data).toEqual([taskA]))

    act(() => useAuthStore.getState().setSession({ ...demoSession(), accessToken: 'session-b' }))

    await waitFor(() => expect(result.current.data).toEqual([taskB]))
    expect(cachedTitles()).not.toContain(taskA.title)
  })

  it('removes private data when an expiry check invalidates the session', async () => {
    const { result } = renderHook(useTasks, { wrapper })
    await waitFor(() => expect(result.current.data).toEqual([taskA]))

    act(() => {
      useAuthStore.getState().setSession({ ...demoSession(), expiresAt: Date.now() - 1 })
      expect(getActiveSession()).toBeNull()
    })

    await waitFor(() => expect(result.current.data).toBeUndefined())
    expect(cachedTitles()).not.toContain(taskA.title)
  })

  it('removes private data when an API 401 clears the session', async () => {
    const { result } = renderHook(useTasks, { wrapper })
    await waitFor(() => expect(result.current.data).toEqual([taskA]))
    server.use(
      http.get('*/api/tasks', () =>
        HttpResponse.json({ message: 'Sign in is required.' }, { status: 401 }),
      ),
    )

    await act(async () => {
      await expect(listTasks()).rejects.toBeDefined()
    })

    await waitFor(() => expect(result.current.data).toBeUndefined())
    expect(cachedTitles()).not.toContain(taskA.title)
    expect(useAuthStore.getState().session).toBeNull()
  })

  it('does not restore an old query after its response arrives in another session', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    let started = false
    let responded = false
    server.use(
      http.get('*/api/tasks', async ({ request }) => {
        if (request.headers.get('authorization') === 'Bearer session-a') {
          started = true
          await pending
          responded = true
          return HttpResponse.json({ tasks: [taskA] })
        }
        return HttpResponse.json({ tasks: [taskB] })
      }),
    )
    const { result } = renderHook(useTasks, { wrapper })
    await waitFor(() => expect(started).toBe(true))

    act(() => useAuthStore.getState().setSession({ ...demoSession(), accessToken: 'session-b' }))
    await waitFor(() => expect(result.current.data).toEqual([taskB]))
    await act(async () => {
      release()
      await pending
    })
    await waitFor(() => expect(responded).toBe(true))

    expect(result.current.data).toEqual([taskB])
    expect(cachedTitles()).not.toContain(taskA.title)
  })

  it('does not roll back an old mutation into the next session cache', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    let mutationStarted = false
    let readsForB = 0
    server.use(
      http.get('*/api/tasks', ({ request }) => {
        const isA = request.headers.get('authorization') === 'Bearer session-a'
        if (!isA) readsForB += 1
        return HttpResponse.json({ tasks: isA ? [taskA] : [taskB] })
      }),
      http.post('*/api/tasks', async () => {
        mutationStarted = true
        await pending
        return HttpResponse.json({ message: 'Creation failed.' }, { status: 400 })
      }),
    )
    const { result } = renderHook(() => ({ tasks: useTasks(), create: useCreateTask() }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.tasks.data).toEqual([taskA]))
    let mutation = Promise.resolve()
    act(() => {
      mutation = result.current.create.mutateAsync('Optimistic task for A').then(
        () => undefined,
        () => undefined,
      )
    })
    await waitFor(() => expect(mutationStarted).toBe(true))

    act(() => useAuthStore.getState().setSession({ ...demoSession(), accessToken: 'session-b' }))
    await waitFor(() => expect(result.current.tasks.data).toEqual([taskB]))
    await act(async () => {
      release()
      await mutation
    })

    expect(result.current.tasks.data).toEqual([taskB])
    expect(cachedTitles()).not.toContain(taskA.title)
    expect(cachedTitles()).not.toContain('Optimistic task for A')
    expect(readsForB).toBe(1)
  })

  it('does not resume an optimistic write after cancellation changes the session', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    let started = false
    let posts = 0
    server.use(
      http.get('*/api/tasks', async ({ request }) => {
        if (request.headers.get('authorization') === 'Bearer session-a') {
          started = true
          await pending
          return HttpResponse.json({ tasks: [taskA] })
        }
        return HttpResponse.json({ tasks: [taskB] })
      }),
      http.post('*/api/tasks', () => {
        posts += 1
        return HttpResponse.json(taskB, { status: 201 })
      }),
    )
    const { result } = renderHook(() => ({ tasks: useTasks(), create: useCreateTask() }), {
      wrapper,
    })
    await waitFor(() => expect(started).toBe(true))
    let switched = false
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!switched && event.type === 'updated' && event.action.type === 'setState') {
        switched = true
        useAuthStore.getState().setSession({ ...demoSession(), accessToken: 'session-b' })
      }
    })

    try {
      await act(async () => {
        await expect(result.current.create.mutateAsync('Old session input')).rejects.toBeDefined()
      })
      await waitFor(() => expect(result.current.tasks.data).toEqual([taskB]))

      expect(switched).toBe(true)
      expect(posts).toBe(0)
      expect(cachedTitles()).not.toContain('Old session input')
    } finally {
      unsubscribe()
      release()
    }
  })

  it('does not invalidate the next session when an old status mutation settles', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    let started = false
    let readsForB = 0
    server.use(
      http.get('*/api/tasks', ({ request }) => {
        const isA = request.headers.get('authorization') === 'Bearer session-a'
        if (!isA) readsForB += 1
        return HttpResponse.json({ tasks: isA ? [taskA] : [taskB] })
      }),
      http.patch('*/api/tasks/:id', async () => {
        started = true
        await pending
        return HttpResponse.json({ ...taskA, status: 'done' })
      }),
    )
    const { result } = renderHook(() => ({ tasks: useTasks(), update: useSetTaskStatus() }), {
      wrapper,
    })
    await waitFor(() => expect(result.current.tasks.data).toEqual([taskA]))
    let mutation = Promise.resolve()
    act(() => {
      mutation = result.current.update
        .mutateAsync({ id: taskA.id, status: 'done' })
        .then(() => undefined)
    })
    await waitFor(() => expect(started).toBe(true))

    act(() => useAuthStore.getState().setSession({ ...demoSession(), accessToken: 'session-b' }))
    await waitFor(() => expect(result.current.tasks.data).toEqual([taskB]))
    await act(async () => {
      release()
      await mutation
    })

    expect(result.current.tasks.data).toEqual([taskB])
    expect(cachedTitles()).not.toContain(taskA.title)
    expect(readsForB).toBe(1)
  })
})
