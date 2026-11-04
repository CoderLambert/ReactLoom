import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Providers } from '@/app/providers'
import { createAppRouter } from '@/app/router'
import { isSessionExpired } from '@/features/auth/session-expiration'
import { getActiveSession, useAuthStore } from '@/features/auth/store'
import { listTasks } from '@/features/tasks/api'
import { i18n } from '@/lib/i18n'
import { createAppQueryClient } from '@/lib/query-client'
import { taskKeys } from '@/features/tasks/keys'
import { demoSession } from '@/mocks/fixtures'
import { server } from '@/mocks/server'

const STORAGE_KEY = 'reactloom.session'

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.getState().clearSession()
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
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible()
    expect(screen.queryByText('Private idle task')).not.toBeInTheDocument()
    expect(useAuthStore.getState().session).toBeNull()
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    expect(client.getQueryData(taskKeys.list(version))).toBeUndefined()
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
