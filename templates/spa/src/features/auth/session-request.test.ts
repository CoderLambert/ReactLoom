import { HttpResponse, http } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { login } from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/store'
import { createTask, listTasks } from '@/features/tasks/api'
import { demoSession, seedTasks } from '@/mocks/fixtures'
import { server } from '@/mocks/server'

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.getState().clearSession()
})

describe('request session identity', () => {
  it('does not forward the current session bearer to public login or revoke it on 401', async () => {
    const existing = { ...demoSession(), accessToken: 'existing-session' }
    useAuthStore.getState().setSession(existing)
    let authorization: string | null | undefined
    server.use(
      http.post('*/api/session', ({ request }) => {
        authorization = request.headers.get('authorization')
        return HttpResponse.json({ message: 'Wrong credentials.' }, { status: 401 })
      }),
    )

    await expect(
      login({ email: 'other@reactloom.dev', password: 'invalid-password' }),
    ).rejects.toMatchObject({ code: 'unauthorized', status: 401 })

    expect(authorization).toBeNull()
    expect(useAuthStore.getState().session).toEqual(existing)
    expect(sessionStorage.getItem('reactloom.session')).toContain('existing-session')
  })

  it('never attaches the previous account bearer to a successful public login', async () => {
    const existing = { ...demoSession(), accessToken: 'existing-session' }
    const next = { ...demoSession(), accessToken: 'next-session' }
    useAuthStore.getState().setSession(existing)
    let authorization: string | null | undefined
    server.use(
      http.post('*/api/session', ({ request }) => {
        authorization = request.headers.get('authorization')
        return HttpResponse.json(next)
      }),
    )

    const result = await login({ email: 'other@reactloom.dev', password: 'valid-password' })

    expect(authorization).toBeNull()
    expect(result).toEqual(next)
    // The request returns the candidate session; only the login hook commits it.
    expect(useAuthStore.getState().session).toEqual(existing)
  })

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
