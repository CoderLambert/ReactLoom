import { QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, fireEvent, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '@/features/auth/store'
import { useSetTaskStatus } from '@/features/tasks/hooks'
import { taskKeys } from '@/features/tasks/keys'
import type { Task } from '@/features/tasks/schema'
import { createAppQueryClient } from '@/lib/query-client'
import { demoSession, demoUser, seedTasks } from '@/mocks/fixtures'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/render'

async function openBoard() {
  const user = userEvent.setup()
  renderApp('/login')
  await user.type(await screen.findByLabelText('Email'), demoUser.email)
  await user.type(screen.getByLabelText('Password'), demoUser.password)
  await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
  await screen.findByText('Dress the loom')
  return user
}

afterEach(() => {
  cleanup()
  useAuthStore.getState().clearSession()
})

describe('task mutation feedback', () => {
  it('cancels an older task read before a confirmed status change can be overwritten', async () => {
    act(() => useAuthStore.getState().setSession(demoSession()))
    const version = useAuthStore.getState().sessionVersion
    const client = createAppQueryClient()
    const initial = seedTasks()
    client.setQueryData(taskKeys.list(version), { tasks: initial })

    let releaseRead = () => {}
    const staleRead = new Promise<{ tasks: Task[] }>((resolve) => {
      releaseRead = () => resolve({ tasks: initial })
    })
    let markReadStarted = () => {}
    const readStarted = new Promise<void>((resolve) => {
      markReadStarted = resolve
    })
    let wasAborted = false
    server.use(
      http.patch('*/api/tasks/task-1', () =>
        HttpResponse.json({ ...initial[0], status: 'done' }),
      ),
    )

    const { result, unmount } = renderHook(() => useSetTaskStatus(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    })
    const pendingRead = client
      .fetchQuery({
        queryKey: taskKeys.list(version),
        staleTime: 0,
        retry: false,
        queryFn: ({ signal }) => {
          signal.addEventListener(
            'abort',
            () => {
              wasAborted = true
            },
            { once: true },
          )
          markReadStarted()
          return staleRead
        },
      })
      .catch(() => undefined)

    try {
      await readStarted
      await act(async () => {
        await result.current.mutateAsync({ id: 'task-1', status: 'done' })
      })
      expect(wasAborted).toBe(true)
      expect(
        client.getQueryData<{ tasks: Task[] }>(taskKeys.list(version))?.tasks[0]?.status,
      ).toBe('done')

      // Even a transport that ignores AbortSignal cannot commit its stale result.
      releaseRead()
      await pendingRead
      expect(
        client.getQueryData<{ tasks: Task[] }>(taskKeys.list(version))?.tasks[0]?.status,
      ).toBe('done')
    } finally {
      releaseRead()
      await pendingRead
      unmount()
      client.clear()
    }
  })

  it.each([
    { failure: '400', message: 'Choose another title.' },
    { failure: '500', message: 'Creation is unavailable.' },
    { failure: 'network', message: 'The network request failed.' },
  ])(
    'keeps the draft and permits retry after a $failure create failure',
    async ({ failure, message }) => {
      let attempts = 0
      server.use(
        http.post('*/api/tasks', () => {
          attempts += 1
          return failure === 'network'
            ? HttpResponse.error()
            : HttpResponse.json({ message }, { status: Number(failure) })
        }),
      )
      const user = await openBoard()
      const input = screen.getByLabelText('Task title')
      await user.type(input, 'Beat the weft')
      await user.click(screen.getByRole('button', { name: 'Add task' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(input).toHaveValue('Beat the weft')
      expect(screen.queryByText('Beat the weft')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add task' })).toBeEnabled()
      expect(attempts).toBe(1)

      server.resetHandlers()
      await user.click(screen.getByRole('button', { name: 'Add task' }))

      await waitFor(() => expect(input).toHaveValue(''))
      expect(screen.getByText('Beat the weft')).toBeVisible()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    },
  )

  it.each(['Wind the next bobbin', 'Beat the weft'])(
    'keeps the edited draft "%s" even when it matches the submitted title',
    async (nextDraft) => {
      let release = () => {}
      const pending = new Promise<void>((resolve) => {
        release = resolve
      })
      let attempts = 0
      server.use(
        http.post('*/api/tasks', async () => {
          attempts += 1
          await pending
          return HttpResponse.json(
            {
              ...seedTasks()[0],
              id: 'created-task',
              title: 'Beat the weft',
            },
            { status: 201 },
          )
        }),
      )
      const user = await openBoard()
      const input = screen.getByLabelText('Task title')
      await user.type(input, 'Beat the weft')
      await user.click(screen.getByRole('button', { name: 'Add task' }))
      await waitFor(() => expect(attempts).toBe(1))

      try {
        expect(screen.getByRole('button', { name: 'Adding…' })).toBeDisabled()
        expect(input).toBeEnabled()
        const pendingRow = screen.getByText('Beat the weft').closest('li')
        if (!pendingRow) throw new Error('The pending task row is missing.')
        expect(within(pendingRow).getByRole('button', { name: 'Mark done' })).toBeDisabled()
        await user.clear(input)
        await user.type(input, `${nextDraft}{Enter}`)
        expect(attempts).toBe(1)
      } finally {
        release()
      }

      await waitFor(() => expect(screen.getByRole('button', { name: 'Add task' })).toBeEnabled())
      expect(input).toHaveValue(nextDraft)
    },
  )

  it('sends one create request for two valid submissions in the same turn', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    let attempts = 0
    server.use(
      http.post('*/api/tasks', async () => {
        attempts += 1
        await pending
        return HttpResponse.json(
          { ...seedTasks()[0], id: 'created-task', title: 'Beat the weft' },
          { status: 201 },
        )
      }),
    )
    const user = await openBoard()
    const input = screen.getByLabelText('Task title')
    await user.type(input, 'Beat the weft')
    const form = input.closest('form')
    if (!form) throw new Error('The task form is missing.')

    try {
      await act(async () => {
        fireEvent.submit(form)
        fireEvent.submit(form)
      })
      await waitFor(() => expect(attempts).toBe(1))
      expect(screen.getAllByText('Beat the weft')).toHaveLength(1)
    } finally {
      release()
    }

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add task' })).toBeEnabled())
  })

  it('uses the server task ID while the post-create refresh is held and after it fails', async () => {
    let releaseRead = () => {}
    const readPending = new Promise<void>((resolve) => {
      releaseRead = resolve
    })
    let reads = 0
    let created = false
    let saved: Task = {
      id: 'server-created-task',
      title: 'Beat the weft',
      status: 'open',
      createdAt: '2026-11-04T00:00:00.000Z',
    }
    const patched: string[] = []
    server.use(
      http.get('*/api/tasks', async () => {
        reads += 1
        if (reads === 2) {
          await readPending
          return HttpResponse.json({ message: 'Refresh is unavailable.' }, { status: 404 })
        }
        return HttpResponse.json({ tasks: created ? [saved, ...seedTasks()] : seedTasks() })
      }),
      http.post('*/api/tasks', () => {
        created = true
        return HttpResponse.json(saved, { status: 201 })
      }),
      http.patch('*/api/tasks/:id', ({ params }) => {
        if (typeof params.id === 'string') patched.push(params.id)
        if (params.id !== 'server-created-task') {
          return HttpResponse.json({ message: 'Task not found.' }, { status: 404 })
        }
        saved = { ...saved, status: 'done' }
        return HttpResponse.json(saved)
      }),
    )
    const user = await openBoard()
    await user.type(screen.getByLabelText('Task title'), 'Beat the weft')
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    await waitFor(() => expect(reads).toBe(2))

    try {
      const row = screen.getByText('Beat the weft').closest('li')
      if (!row) throw new Error('The created task row is missing.')
      expect(within(row).getByRole('button', { name: 'Mark done' })).toBeEnabled()
    } finally {
      releaseRead()
    }

    expect(await screen.findByRole('alert')).toHaveTextContent('Refresh is unavailable.')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add task' })).toBeEnabled())
    const row = screen.getByText('Beat the weft').closest('li')
    if (!row) throw new Error('The created task row is missing after refresh failure.')
    await user.click(within(row).getByRole('button', { name: 'Mark done' }))

    expect(await screen.findByText('Beat the weft')).toBeVisible()
    await waitFor(() => {
      const savedRow = screen.getByText('Beat the weft').closest('li')
      if (!savedRow) throw new Error('The saved task row is missing.')
      expect(within(savedRow).getByRole('button', { name: 'Reopen' })).toBeEnabled()
    })
    expect(patched).toEqual(['server-created-task'])
    expect(screen.getAllByText('Beat the weft')).toHaveLength(1)
  })

  it('allows the replacement session to submit while its old mutation observer is detached', async () => {
    let releaseOld = () => {}
    let releaseNew = () => {}
    const oldPending = new Promise<void>((resolve) => {
      releaseOld = resolve
    })
    const newPending = new Promise<void>((resolve) => {
      releaseNew = resolve
    })
    let attempts = 0
    const newTask = { ...seedTasks()[0], id: 'replacement-task', title: 'Replacement task' }
    let newCreated = false
    server.use(
      http.get('*/api/tasks', () =>
        HttpResponse.json({ tasks: newCreated ? [newTask, ...seedTasks()] : seedTasks() }),
      ),
      http.post('*/api/tasks', async () => {
        attempts += 1
        if (attempts === 1) {
          await oldPending
          return HttpResponse.json(
            { ...seedTasks()[0], id: 'old-task', title: 'Old task' },
            { status: 201 },
          )
        }
        await newPending
        newCreated = true
        return HttpResponse.json(newTask, { status: 201 })
      }),
    )
    const user = await openBoard()
    const input = screen.getByLabelText('Task title')
    await user.type(input, 'Old task')
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    await waitFor(() => expect(attempts).toBe(1))

    try {
      act(() =>
        useAuthStore
          .getState()
          .setSession({ ...demoSession(), accessToken: 'replacement-session' }),
      )
      await waitFor(() => expect(screen.getByRole('button', { name: 'Add task' })).toBeEnabled())
      await user.clear(input)
      await user.type(input, 'Replacement task')
      await user.click(screen.getByRole('button', { name: 'Add task' }))
      await waitFor(() => expect(attempts).toBe(2))
      await user.clear(input)
      await user.type(input, 'Next draft')
      releaseOld()
    } finally {
      releaseOld()
      releaseNew()
    }

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add task' })).toBeEnabled())
    expect(input).toHaveValue('Next draft')
    expect(screen.getByText('Replacement task')).toBeVisible()
    expect(screen.queryByText('Old task')).not.toBeInTheDocument()
  })

  it('keeps the confirmed status when the post-update task refresh fails', async () => {
    const user = await openBoard()
    let refreshes = 0
    server.use(
      http.patch('*/api/tasks/task-1', () =>
        HttpResponse.json({ ...seedTasks()[0], status: 'done' }),
      ),
      http.get('*/api/tasks', () => {
        refreshes += 1
        return HttpResponse.json({ message: 'Refresh is unavailable.' }, { status: 404 })
      }),
    )

    const row = screen.getByText('Dress the loom').closest('li')
    if (!row) throw new Error('The task row is missing.')
    await user.click(within(row).getByRole('button', { name: 'Mark done' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Refresh is unavailable.')
    expect(refreshes).toBe(1)
    expect(within(row).getByText('done')).toBeVisible()
    expect(within(row).getByRole('button', { name: 'Reopen' })).toBeEnabled()
  })

  it('reports a status failure, preserves the original status, and permits retry without duplicate updates', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    let attempts = 0
    server.use(
      http.patch('*/api/tasks/task-1', async () => {
        attempts += 1
        await pending
        return HttpResponse.json({ message: 'Status could not be saved.' }, { status: 500 })
      }),
    )
    const user = await openBoard()
    const row = screen.getByText('Dress the loom').closest('li')
    if (!row) throw new Error('The task row is missing.')
    const button = within(row).getByRole('button', { name: 'Mark done' })
    await user.click(button)
    await waitFor(() => expect(attempts).toBe(1))

    try {
      expect(button).toBeDisabled()
      await user.click(button)
      expect(attempts).toBe(1)
    } finally {
      release()
    }

    expect(await screen.findByRole('alert')).toHaveTextContent('Status could not be saved.')
    expect(within(row).getByText('open')).toBeVisible()
    expect(within(row).getByRole('button', { name: 'Mark done' })).toBeEnabled()

    server.resetHandlers()
    await user.click(within(row).getByRole('button', { name: 'Mark done' }))

    expect(await within(row).findByRole('button', { name: 'Reopen' })).toBeEnabled()
    expect(within(row).getByText('done')).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps a confirmed status change when an overlapping create rolls back', async () => {
    let releaseCreate = () => {}
    let releaseRead = () => {}
    const createPending = new Promise<void>((resolve) => {
      releaseCreate = resolve
    })
    const readPending = new Promise<void>((resolve) => {
      releaseRead = resolve
    })
    let reads = 0
    let creates = 0
    let tasks = seedTasks()
    server.use(
      http.get('*/api/tasks', async () => {
        reads += 1
        if (reads === 3) await readPending
        return HttpResponse.json({ tasks })
      }),
      http.post('*/api/tasks', async () => {
        creates += 1
        await createPending
        return HttpResponse.json({ message: 'Creation failed.' }, { status: 400 })
      }),
      http.patch('*/api/tasks/task-1', () => {
        tasks = tasks.map((task) => (task.id === 'task-1' ? { ...task, status: 'done' } : task))
        return HttpResponse.json(tasks[0])
      }),
    )
    const user = await openBoard()
    await user.type(screen.getByLabelText('Task title'), 'Beat the weft')
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    await waitFor(() => expect(creates).toBe(1))
    const row = screen.getByText('Dress the loom').closest('li')
    if (!row) throw new Error('The task row is missing.')

    try {
      await user.click(within(row).getByRole('button', { name: 'Mark done' }))
      expect(await within(row).findByRole('button', { name: 'Reopen' })).toBeEnabled()
      releaseCreate()
      await waitFor(() => expect(reads).toBe(3))

      expect(within(row).getByText('done')).toBeVisible()
      expect(within(row).getByRole('button', { name: 'Reopen' })).toBeEnabled()
      expect(screen.queryByText('Beat the weft')).not.toBeInTheDocument()
    } finally {
      releaseCreate()
      releaseRead()
    }

    expect(await screen.findByRole('alert')).toHaveTextContent('Creation failed.')
  })

  it('does not duplicate or overwrite server tasks already refreshed before create success', async () => {
    let releaseCreate = () => {}
    let releaseRead = () => {}
    const createPending = new Promise<void>((resolve) => {
      releaseCreate = resolve
    })
    const readPending = new Promise<void>((resolve) => {
      releaseRead = resolve
    })
    let reads = 0
    let creates = 0
    let tasks = seedTasks()
    const saved: Task = {
      id: 'server-created-task',
      title: 'Beat the weft',
      status: 'open',
      createdAt: '2026-11-04T00:00:00.000Z',
    }
    server.use(
      http.get('*/api/tasks', async () => {
        reads += 1
        if (reads === 3) await readPending
        return HttpResponse.json({ tasks })
      }),
      http.post('*/api/tasks', async () => {
        creates += 1
        await createPending
        return HttpResponse.json(saved, { status: 201 })
      }),
      http.patch('*/api/tasks/task-1', () => {
        tasks = [
          { ...saved, status: 'done' },
          ...tasks.map((task): Task => (task.id === 'task-1' ? { ...task, status: 'done' } : task)),
        ]
        return HttpResponse.json(tasks.find((task) => task.id === 'task-1'))
      }),
    )
    const user = await openBoard()
    await user.type(screen.getByLabelText('Task title'), 'Beat the weft')
    await user.click(screen.getByRole('button', { name: 'Add task' }))
    await waitFor(() => expect(creates).toBe(1))
    const row = screen.getByText('Dress the loom').closest('li')
    if (!row) throw new Error('The original task row is missing.')

    try {
      await user.click(within(row).getByRole('button', { name: 'Mark done' }))
      expect(await within(row).findByRole('button', { name: 'Reopen' })).toBeEnabled()
      releaseCreate()
      await waitFor(() => expect(reads).toBe(3))

      expect(screen.getAllByText('Beat the weft')).toHaveLength(1)
      const createdRow = screen.getByText('Beat the weft').closest('li')
      if (!createdRow) throw new Error('The server task row is missing.')
      expect(within(createdRow).getByRole('button', { name: 'Reopen' })).toBeEnabled()
      expect(within(row).getByRole('button', { name: 'Reopen' })).toBeEnabled()
    } finally {
      releaseCreate()
      releaseRead()
    }

    await waitFor(() => expect(screen.getByRole('button', { name: 'Add task' })).toBeEnabled())
  })
})
