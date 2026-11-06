import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Providers } from '@/app/providers'
import { createAppRouter } from '@/app/router'
import { isSessionExpired } from '@/features/auth/session-expiration'
import { getActiveSession, useAuthStore } from '@/features/auth/store'
import { listTasks } from '@/features/tasks/api'
import { taskKeys } from '@/features/tasks/keys'
import { i18n } from '@/lib/i18n'
import { createAppQueryClient } from '@/lib/query-client'
import { demoSession } from '@/mocks/fixtures'
import { server } from '@/mocks/server'

const STORAGE_KEY = 'reactloom.session'

class TestLogoutChannel {
  static channels = new Set<TestLogoutChannel>()
  onmessage: ((event: { data: unknown }) => void) | null = null

  constructor(_name: string) {
    TestLogoutChannel.channels.add(this)
  }

  postMessage(data: unknown) {
    for (const channel of TestLogoutChannel.channels) {
      if (channel !== this) channel.onmessage?.({ data })
    }
  }

  close() {
    TestLogoutChannel.channels.delete(this)
  }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  useAuthStore.getState().clearSession()
  vi.unstubAllGlobals()
  TestLogoutChannel.channels.clear()
})

describe('SPA session expiry boundary', () => {
  it('treats the exact expiry instant and non-finite timestamps as expired', () => {
    expect(isSessionExpired(1001, 1000)).toBe(false)
    expect(isSessionExpired(1000, 1000)).toBe(true)
    expect(isSessionExpired(Number.NaN, 1000)).toBe(true)
    expect(isSessionExpired(Number.POSITIVE_INFINITY, 1000)).toBe(true)
  })

  it('invalidates a once-valid session without requiring a page reload', () => {
    const now = Date.now()
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now)
    const session = { ...demoSession(), expiresAt: now + 1000 }
    useAuthStore.getState().setSession(session)

    expect(getActiveSession()).toEqual(session)
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull()

    clock.mockReturnValue(now + 1000)
    expect(getActiveSession()).toBeNull()
    expect(useAuthStore.getState().session).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('redirects an expired in-memory session before rendering the protected task page', async () => {
    useAuthStore.getState().setSession({ ...demoSession(), expiresAt: Date.now() - 1 })
    const client = createAppQueryClient()
    const router = createAppRouter(client, createMemoryHistory({ initialEntries: ['/tasks'] }))

    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </I18nextProvider>,
    )

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Warp board' })).not.toBeInTheDocument()
    expect(useAuthStore.getState().session).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('expires a mounted private task screen while idle and removes the cached data', async () => {
    server.use(
      http.get('*/api/tasks', () =>
        HttpResponse.json({
          tasks: [
            {
              id: 'idle-private-task',
              title: 'Private idle task',
              status: 'open',
              createdAt: '2026-11-04T00:00:00.000Z',
            },
          ],
        }),
      ),
    )
    useAuthStore.getState().setSession({ ...demoSession(), expiresAt: Date.now() + 1_500 })
    const version = useAuthStore.getState().sessionVersion
    const client = createAppQueryClient()
    const router = createAppRouter(client, createMemoryHistory({ initialEntries: ['/tasks'] }))

    render(
      <Providers client={client}>
        <RouterProvider router={router} />
      </Providers>,
    )

    expect(await screen.findByText('Private idle task')).toBeVisible()
    expect(
      await screen.findByRole('heading', { name: 'Sign in' }, { timeout: 4_000 }),
    ).toBeVisible()
    await waitFor(() => expect(screen.queryByText('Private idle task')).not.toBeInTheDocument())
    expect(useAuthStore.getState().session).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(client.getQueryData(taskKeys.list(version))).toBeUndefined()
  })

  it('rechecks a backgrounded task view on focus before its throttled timer fires', async () => {
    server.use(
      http.get('*/api/tasks', () =>
        HttpResponse.json({
          tasks: [
            {
              id: 'resumed-private-task',
              title: 'Resumed private task',
              status: 'open',
              createdAt: '2026-11-04T00:00:00.000Z',
            },
          ],
        }),
      ),
    )
    const now = Date.now()
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now)
    useAuthStore.getState().setSession({ ...demoSession(), expiresAt: now + 3_600_000 })
    const version = useAuthStore.getState().sessionVersion
    const client = createAppQueryClient()
    const router = createAppRouter(client, createMemoryHistory({ initialEntries: ['/tasks'] }))

    render(
      <Providers client={client}>
        <RouterProvider router={router} />
      </Providers>,
    )
    expect(await screen.findByText('Resumed private task')).toBeVisible()

    // Simulate wall-clock time advancing while the scheduled timer is suspended.
    clock.mockReturnValue(now + 3_600_001)
    window.dispatchEvent(new Event('focus'))

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible()
    await waitFor(() => expect(screen.queryByText('Resumed private task')).not.toBeInTheDocument())
    expect(useAuthStore.getState().session).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(client.getQueryData(taskKeys.list(version))).toBeUndefined()
  })

  it('ignores a delayed logout from a previous login but revokes a matching session', async () => {
    vi.stubGlobal('BroadcastChannel', TestLogoutChannel)
    useAuthStore.getState().setSession(demoSession())
    const previousId = useAuthStore.getState().sessionId
    const client = createAppQueryClient()
    const router = createAppRouter(client, createMemoryHistory({ initialEntries: ['/'] }))

    render(
      <Providers client={client}>
        <RouterProvider router={router} />
      </Providers>,
    )

    expect(await screen.findByRole('button', { name: 'Sign out' })).toBeVisible()

    // Replacing the login must revoke other tabs that retained the old nonce.
    const observer = new TestLogoutChannel('reactloom.session-logout')
    const broadcasts: unknown[] = []
    observer.onmessage = ({ data }) => broadcasts.push(data)

    // A newer sign-in must not be revoked by an earlier tab's delayed message.
    act(() => useAuthStore.getState().setSession(demoSession()))
    expect(broadcasts).toContainEqual({ type: 'logout', sessionId: previousId })
    const replacement = useAuthStore.getState().session
    const replacementId = useAuthStore.getState().sessionId
    expect(replacementId).not.toBe(previousId)

    const sender = new TestLogoutChannel('reactloom.session-logout')
    act(() => sender.postMessage({ type: 'logout', sessionId: previousId }))
    expect(useAuthStore.getState().session).toEqual(replacement)
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull()

    // The same mounted Shell must still honor a revocation for its current nonce.
    act(() => sender.postMessage({ type: 'logout', sessionId: replacementId }))
    await waitFor(() => expect(useAuthStore.getState().session).toBeNull())
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    sender.close()
    observer.close()
  })

  it('never attaches an expired bearer token to a task API request', async () => {
    let authorization: string | null | undefined
    server.use(
      http.get('*/api/tasks', ({ request }) => {
        authorization = request.headers.get('authorization')
        return HttpResponse.json({ message: 'Sign in is required.' }, { status: 401 })
      }),
    )
    useAuthStore.getState().setSession({ ...demoSession(), expiresAt: Date.now() - 1 })

    await expect(listTasks()).rejects.toBeDefined()

    expect(authorization).toBeNull()
    expect(useAuthStore.getState().session).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})
