import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Providers } from '@/app/providers'
import { createAppRouter } from '@/app/router'
import { useAuthStore } from '@/features/auth/store'
import { createAppQueryClient } from '@/lib/query-client'
import { demoSession, demoUser } from '@/mocks/fixtures'
import { server } from '@/mocks/server'

function renderRouter(path: string) {
  const client = createAppQueryClient()
  const router = createAppRouter(client, createMemoryHistory({ initialEntries: [path] }))
  render(
    <Providers client={client}>
      <RouterProvider router={router} />
    </Providers>,
  )
  return { client, router }
}

beforeEach(() => {
  useAuthStore.getState().clearSession()
  server.use(http.get('*/api/tasks', () => HttpResponse.json({ tasks: [] })))
})

afterEach(() => {
  cleanup()
  useAuthStore.getState().clearSession()
})

describe('auth operation session boundaries', () => {
  it('clears local session and private cache before a slow logout response', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    let requestStarted = () => {}
    const started = new Promise<void>((resolve) => {
      requestStarted = resolve
    })
    let authorization: string | null = null
    server.use(
      http.post('*/api/session/logout', async ({ request }) => {
        authorization = request.headers.get('authorization')
        requestStarted()
        await pending
        return new HttpResponse(null, { status: 204 })
      }),
    )

    const old = { ...demoSession(), accessToken: 'slow-logout-session' }
    useAuthStore.getState().setSession(old)
    const user = userEvent.setup()
    const { client, router } = renderRouter('/tasks')
    client.setQueryData(['tasks', 'private'], { tasks: [{ title: 'Private task' }] })

    try {
      await user.click(await screen.findByRole('button', { name: 'Sign out' }))
      await started

      await waitFor(() => expect(router.state.location.pathname).toBe('/'))
      expect(useAuthStore.getState().session).toBeNull()
      expect(sessionStorage.getItem('reactloom.session')).toBeNull()
      expect(client.getQueryData(['tasks', 'private'])).toBeUndefined()
      expect(authorization).toBe('Bearer slow-logout-session')
      expect(
        client
          .getMutationCache()
          .getAll()
          .some((mutation) => mutation.state.status === 'pending'),
      ).toBe(true)
    } finally {
      release()
    }

    await waitFor(() =>
      expect(
        client
          .getMutationCache()
          .getAll()
          .every((mutation) => mutation.state.status !== 'pending'),
      ).toBe(true),
    )
  })

  it('returns home when the logout request itself clears the session with 401', async () => {
    server.use(
      http.post('*/api/session/logout', () =>
        HttpResponse.json({ message: 'Session already expired.' }, { status: 401 }),
      ),
    )
    useAuthStore.getState().setSession(demoSession())
    const user = userEvent.setup()
    const { router } = renderRouter('/tasks')

    await user.click(await screen.findByRole('button', { name: 'Sign out' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(useAuthStore.getState().session).toBeNull()
  })

  it('does not sign out a replacement session when an old logout finishes', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    let started = false
    const replacement = { ...demoSession(), accessToken: 'replacement-session' }
    server.use(
      http.post('*/api/session/logout', async () => {
        started = true
        await pending
        return new HttpResponse(null, { status: 204 })
      }),
      http.post('*/api/session', () => HttpResponse.json(replacement)),
    )
    useAuthStore.getState().setSession({ ...demoSession(), accessToken: 'old-session' })
    const user = userEvent.setup()
    const { client, router } = renderRouter('/tasks')
    await user.click(await screen.findByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(started).toBe(true))
    await act(() => router.navigate({ to: '/login' }))
    await user.type(await screen.findByLabelText('Email'), demoUser.email)
    await user.type(screen.getByLabelText('Password'), demoUser.password)
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(useAuthStore.getState().session).toEqual(replacement))

    release()
    await waitFor(() =>
      expect(
        client
          .getMutationCache()
          .getAll()
          .every((mutation) => mutation.state.status !== 'pending'),
      ).toBe(true),
    )

    expect(useAuthStore.getState().session).toEqual(replacement)
    expect(router.state.location.pathname).toBe('/tasks')
  })

  it.each(['older-first', 'newer-first'])(
    'keeps the newer sign-in intent when responses finish %s',
    async (order) => {
      let releaseOlder = () => {}
      let releaseNewer = () => {}
      const olderPending = new Promise<void>((resolve) => {
        releaseOlder = resolve
      })
      const newerPending = new Promise<void>((resolve) => {
        releaseNewer = resolve
      })
      let olderStarted = false
      let newerStarted = false
      const replacement = { ...demoSession(), accessToken: 'replacement-session' }
      server.use(
        http.post('*/api/session', async ({ request }) => {
          const input: unknown = await request.json()
          if (
            typeof input === 'object' &&
            input !== null &&
            'email' in input &&
            input.email === demoUser.email
          ) {
            olderStarted = true
            await olderPending
            return HttpResponse.json({ ...demoSession(), accessToken: 'old-session' })
          }
          newerStarted = true
          await newerPending
          return HttpResponse.json(replacement)
        }),
      )
      const user = userEvent.setup()
      const { client, router } = renderRouter('/login')
      await user.type(await screen.findByLabelText('Email'), demoUser.email)
      await user.type(screen.getByLabelText('Password'), demoUser.password)
      await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
      await waitFor(() => expect(olderStarted).toBe(true))
      await act(() => router.navigate({ to: '/' }))
      await act(() => router.navigate({ to: '/login' }))
      await user.type(await screen.findByLabelText('Email'), 'new@reactloom.dev')
      await user.type(screen.getByLabelText('Password'), demoUser.password)
      await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
      await waitFor(() => expect(newerStarted).toBe(true))
      if (order === 'older-first') releaseOlder()
      else releaseNewer()
      await waitFor(() =>
        expect(
          client
            .getMutationCache()
            .getAll()
            .filter((mutation) => mutation.state.status === 'pending'),
        ).toHaveLength(1),
      )
      if (order === 'older-first') {
        expect(useAuthStore.getState().session).toBeNull()
        expect(router.state.location.pathname).toBe('/login')
        releaseNewer()
      } else {
        expect(useAuthStore.getState().session).toEqual(replacement)
        releaseOlder()
      }
      await waitFor(() =>
        expect(
          client
            .getMutationCache()
            .getAll()
            .every((mutation) => mutation.state.status !== 'pending'),
        ).toBe(true),
      )

      expect(useAuthStore.getState().session).toEqual(replacement)
      expect(router.state.location.pathname).toBe('/tasks')
    },
  )

  it('keeps a newer failed sign-in from reviving an older successful response', async () => {
    let release = () => {}
    const pending = new Promise<void>((resolve) => {
      release = resolve
    })
    let started = false
    server.use(
      http.post('*/api/session', async ({ request }) => {
        const input: unknown = await request.json()
        if (
          typeof input === 'object' &&
          input !== null &&
          'email' in input &&
          input.email === demoUser.email
        ) {
          started = true
          await pending
          return HttpResponse.json({ ...demoSession(), accessToken: 'old-session' })
        }
        return HttpResponse.json({ message: 'Newer sign-in failed.' }, { status: 400 })
      }),
    )
    const user = userEvent.setup()
    const { client, router } = renderRouter('/login')
    await user.type(await screen.findByLabelText('Email'), demoUser.email)
    await user.type(screen.getByLabelText('Password'), demoUser.password)
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(started).toBe(true))
    await act(() => router.navigate({ to: '/' }))
    await act(() => router.navigate({ to: '/login' }))
    await user.type(await screen.findByLabelText('Email'), 'new@reactloom.dev')
    await user.type(screen.getByLabelText('Password'), demoUser.password)
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Newer sign-in failed.')

    release()
    await waitFor(() =>
      expect(
        client
          .getMutationCache()
          .getAll()
          .every((mutation) => mutation.state.status !== 'pending'),
      ).toBe(true),
    )

    expect(useAuthStore.getState().session).toBeNull()
    expect(router.state.location.pathname).toBe('/login')
    expect(screen.getByRole('alert')).toHaveTextContent('Newer sign-in failed.')
  })

  it.each([204, 401])(
    'ignores an old logout finishing with %s while a newer sign-in is pending',
    async (status) => {
      let releaseLogout = () => {}
      let releaseLogin = () => {}
      const logoutPending = new Promise<void>((resolve) => {
        releaseLogout = resolve
      })
      const loginPending = new Promise<void>((resolve) => {
        releaseLogin = resolve
      })
      let logoutStarted = false
      let loginStarted = false
      const replacement = { ...demoSession(), accessToken: 'replacement-session' }
      server.use(
        http.post('*/api/session/logout', async () => {
          logoutStarted = true
          await logoutPending
          return status === 204
            ? new HttpResponse(null, { status })
            : HttpResponse.json({ message: 'Old session expired.' }, { status })
        }),
        http.post('*/api/session', async () => {
          loginStarted = true
          await loginPending
          return HttpResponse.json(replacement)
        }),
      )
      const initial = { ...demoSession(), accessToken: 'old-session' }
      useAuthStore.getState().setSession(initial)
      const user = userEvent.setup()
      const { client, router } = renderRouter('/tasks')
      await user.click(await screen.findByRole('button', { name: 'Sign out' }))
      await waitFor(() => expect(logoutStarted).toBe(true))
      await act(() => router.navigate({ to: '/login' }))
      await user.type(await screen.findByLabelText('Email'), demoUser.email)
      await user.type(screen.getByLabelText('Password'), demoUser.password)
      await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign in' }))
      await waitFor(() => expect(loginStarted).toBe(true))

      releaseLogout()
      await waitFor(() =>
        expect(
          client
            .getMutationCache()
            .getAll()
            .filter((mutation) => mutation.state.status === 'pending'),
        ).toHaveLength(1),
      )
      expect(useAuthStore.getState().session).toBeNull()
      expect(router.state.location.pathname).toBe('/login')
      releaseLogin()
      await waitFor(() => expect(useAuthStore.getState().session).toEqual(replacement))
      expect(router.state.location.pathname).toBe('/tasks')
    },
  )
})
