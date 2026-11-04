import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/store'
import { createTask, listTasks } from '@/features/tasks/api'
import { demoSession, seedTasks } from '@/mocks/fixtures'
import { server } from '@/mocks/server'

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.getState().clearSession()
})

describe('request session identity', () => {
  it('keeps the replacement session when an old request returns 401', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    let requestStarted = () => {}
    const started = new Promise<void>((resolve) => {
      requestStarted = resolve
    })
    server.use(
      http.post('*/api/tasks', async () => {
        requestStarted()
        await pending
        return HttpResponse.json({ message: 'Old session expired.' }, { status: 401 })
      }),
    )
    useAuthStore.getState().setSession({ ...demoSession(), accessToken: 'old-session' })
    const request = createTask({ title: 'Old session task' })
    await started
    const replacement = { ...demoSession(), accessToken: 'replacement-session' }
    useAuthStore.getState().setSession(replacement)

    release()
    await expect(request).rejects.toBeDefined()

    expect(useAuthStore.getState().session).toEqual(replacement)
  })

  it('does not adopt another session token while retrying an old request', async () => {
    const authorizations: (string | null)[] = []
    server.use(
      http.get('*/api/tasks', ({ request }) => {
        authorizations.push(request.headers.get('authorization'))
        if (authorizations.length === 1) {
          useAuthStore.getState().setSession({ ...demoSession(), accessToken: 'new-session' })
          return HttpResponse.json(
            { message: 'Try again.' },
            { status: 503, headers: { 'Retry-After': '0' } },
          )
        }
        return HttpResponse.json({ tasks: seedTasks() })
      }),
    )
    useAuthStore.getState().setSession({ ...demoSession(), accessToken: 'old-session' })

    await listTasks()

    expect(authorizations).toEqual(['Bearer old-session', 'Bearer old-session'])
    expect(useAuthStore.getState().session?.accessToken).toBe('new-session')
  })

  it('drops a captured token if it expires before the next retry', async () => {
    const now = Date.now()
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now)
    const authorizations: (string | null)[] = []
    server.use(
      http.get('*/api/tasks', ({ request }) => {
        authorizations.push(request.headers.get('authorization'))
        if (authorizations.length === 1) {
          clock.mockReturnValue(now + 1000)
          return HttpResponse.json(
            { message: 'Try again.' },
            { status: 503, headers: { 'Retry-After': '0' } },
          )
        }
        return HttpResponse.json({ message: 'Sign in is required.' }, { status: 401 })
      }),
    )
    useAuthStore.getState().setSession({ ...demoSession(), expiresAt: now + 1000 })
    const token = useAuthStore.getState().session?.accessToken

    await expect(listTasks()).rejects.toBeDefined()

    expect(authorizations).toEqual([`Bearer ${token}`, null])
    expect(useAuthStore.getState().session).toBeNull()
  })
})
