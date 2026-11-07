import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAuthController } from './auth-controller'
import { type AuthEvent, type AuthState, authReducer, initialAuthState } from './reducer'
import type { Session } from './schema'

const input = { email: 'ada@reactloom.dev', password: 'loom-demo' }
const session: Session = {
  accessToken: 'first-token',
  expiresAt: 4_000_000_000_000,
  user: { id: 'user-ada', name: 'Ada Loom', email: input.email },
}
const newerSession: Session = { ...session, accessToken: 'second-token' }

function deferred<T>() {
  const control = {
    resolve: (_value: T) => {},
    reject: (_error: Error) => {},
  }
  const promise = new Promise<T>((resolve, reject) => {
    control.resolve = resolve
    control.reject = reject
  })
  return { promise, ...control }
}

type Dependencies = Parameters<typeof createAuthController>[0]

const controllers: ReturnType<typeof createAuthController>[] = []

function setup(overrides: Partial<Dependencies> = {}) {
  let state: AuthState = initialAuthState
  const events: AuthEvent[] = []
  const storage: { session: Session | null } = { session: null }
  let foreground = () => {}
  let subscribed = false
  const controller = createAuthController({
    readSession: async () => storage.session,
    writeSession: async (value) => {
      storage.session = value
    },
    requestSignIn: async () => session,
    subscribeToForeground: (listener) => {
      foreground = listener
      subscribed = true
      return () => {
        subscribed = false
      }
    },
    dispatch: (event) => {
      events.push(event)
      state = authReducer(state, event)
    },
    ...overrides,
  })
  controllers.push(controller)
  return {
    controller,
    storage,
    events,
    revision: () => state.revision,
    resume: () => {
      if (subscribed) foreground()
    },
    subscribed: () => subscribed,
    state: () => {
      const { revision: _revision, ...value } = state
      return value
    },
  }
}

describe('auth controller', () => {
  afterEach(() => {
    for (const controller of controllers) controller.stop()
    controllers.length = 0
    vi.useRealTimers()
  })

  it('restores the stored server identity and exact expiration', async () => {
    const storedSession: Session = {
      accessToken: 'server-token',
      expiresAt: 3_000_000_000_000,
      user: { id: 'user-lin', name: 'Lin Chen', email: 'lin@example.com' },
    }
    const app = setup()
    app.storage.session = storedSession
    await app.controller.start()
    expect(app.state()).toEqual({ status: 'authenticated', session: storedSession })
  })

  it('invalidates a committed session at its server expiration while the app stays open', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    const app = setup({ requestSignIn: async () => ({ ...session, expiresAt: 2_000 }) })
    await app.controller.start()
    await app.controller.signIn(input)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.storage.session).toBeNull()
  })

  it('deletes expired hydration without briefly authenticating', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(session.expiresAt)
    const app = setup()
    app.storage.session = session
    await app.controller.start()
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.events.some((event) => event.type === 'hydrated' && event.session !== null)).toBe(
      false,
    )
    expect(app.storage.session).toBeNull()
  })

  it('checks expiry on foreground resume when background timers did not fire', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    const app = setup({ requestSignIn: async () => ({ ...session, expiresAt: 2_000 }) })
    await app.controller.start()
    await app.controller.signIn(input)
    vi.setSystemTime(3_000)
    app.resume()
    await vi.runAllTimersAsync()
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.storage.session).toBeNull()
  })

  it('bounds long expiration delays without expiring early or polling', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    const distantSession = { ...session, expiresAt: 1_000 + 2_147_483_647 + 500 }
    const app = setup({ requestSignIn: async () => distantSession })
    await app.controller.start()
    await app.controller.signIn(input)
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(2_147_483_647)
    expect(app.state()).toEqual({ status: 'authenticated', session: distantSession })
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(500)
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('removes expiry resources on cleanup and rechecks on StrictMode setup', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    const app = setup({ requestSignIn: async () => ({ ...session, expiresAt: 2_000 }) })
    await app.controller.start()
    await app.controller.signIn(input)
    app.controller.stop()
    expect(vi.getTimerCount()).toBe(0)
    expect(app.subscribed()).toBe(false)
    vi.setSystemTime(3_000)
    await app.controller.start()
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.storage.session).toBeNull()
  })

  it('settles a restarted provider to a storage error when expiry deletion fails', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    let deletionFails = false
    const app = setup({
      requestSignIn: async () => ({ ...session, expiresAt: 2_000 }),
      writeSession: async (value) => {
        if (value === null && deletionFails) throw new Error('Keychain unavailable')
        app.storage.session = value
      },
    })
    await app.controller.start()
    await app.controller.signIn(input)
    app.controller.stop()
    vi.setSystemTime(2_000)
    deletionFails = true
    await expect(app.controller.start()).resolves.toBeUndefined()
    expect(app.state()).toEqual({ status: 'anonymous', error: 'Session storage is unavailable.' })
  })

  it('does not let stale hydration deletion clear a successful newer login', async () => {
    const read = deferred<Session | null>()
    const app = setup({ readSession: () => read.promise })
    const hydration = app.controller.start()
    await app.controller.signIn(input)
    read.resolve(null)
    await hydration
    expect(app.storage.session).toEqual(session)
    expect(app.state()).toEqual({ status: 'authenticated', session })
  })

  it('ignores a previous session 401 after a new session is committed', async () => {
    let nextSession = session
    const app = setup({ requestSignIn: async () => nextSession })
    await app.controller.start()
    await app.controller.signIn(input)
    const captured = app.state()
    if (captured.status !== 'authenticated') throw new Error('Expected authenticated session')
    nextSession = newerSession
    await app.controller.signIn(input)
    await app.controller.invalidateSession(captured.session)
    expect(app.state()).toEqual({ status: 'authenticated', session: newerSession })
    expect(app.storage.session).toEqual(newerSession)
    expect(app.revision()).toBe(2)
  })

  it('invalidates only the captured current Session reference and advances its revision', async () => {
    const app = setup()
    await app.controller.start()
    expect(app.revision()).toBe(0)
    await app.controller.signIn(input)
    const captured = app.state()
    if (captured.status !== 'authenticated') throw new Error('Expected authenticated session')
    await app.controller.invalidateSession({ ...captured.session })
    expect(app.revision()).toBe(1)
    await app.controller.invalidateSession(captured.session)
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.storage.session).toBeNull()
    expect(app.revision()).toBe(2)
    await app.controller.signOut()
    expect(app.revision()).toBe(2)
  })

  it('rejects expired login responses without persisting or authenticating', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(2_000)
    const app = setup({ requestSignIn: async () => ({ ...session, expiresAt: 2_000 }) })
    await app.controller.start()
    await expect(app.controller.signIn(input)).rejects.toThrow('expired')
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.storage.session).toBeNull()
  })

  it('does not commit a session that expired during its storage write', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    const started = deferred<void>()
    const finish = deferred<void>()
    const app = setup({
      requestSignIn: async () => ({ ...session, expiresAt: 2_000 }),
      writeSession: async (value) => {
        if (value) {
          started.resolve()
          await finish.promise
        }
        app.storage.session = value
      },
    })
    await app.controller.start()
    const login = app.controller.signIn(input)
    const rejected = expect(login).rejects.toThrow('expired')
    await started.promise
    vi.setSystemTime(2_000)
    finish.resolve()
    await rejected
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.storage.session).toBeNull()
  })

  it('settles anonymous if login fails while hydration is pending', async () => {
    const read = deferred<Session | null>()
    const app = setup({
      readSession: () => read.promise,
      requestSignIn: async () => {
        throw new Error('Credentials rejected')
      },
    })
    const hydration = app.controller.start()
    await expect(app.controller.signIn(input)).rejects.toThrow('Credentials rejected')
    read.resolve(session)
    await hydration
    expect(app.state()).toEqual({ status: 'anonymous' })
  })

  it('settles anonymous when session storage cannot be read', async () => {
    const app = setup({
      readSession: async () => {
        throw new Error('Keychain unavailable')
      },
    })
    await app.controller.start()
    expect(app.state()).toEqual({ status: 'anonymous', error: 'Session storage is unavailable.' })
  })

  it('ignores hydration that completes after sign out', async () => {
    const read = deferred<Session | null>()
    const app = setup({ readSession: () => read.promise })
    const hydration = app.controller.start()
    await app.controller.signOut()
    read.resolve(session)
    await hydration
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.storage.session).toBeNull()
  })

  it('ignores a login response that completes after sign out', async () => {
    const response = deferred<Session>()
    const app = setup({ requestSignIn: () => response.promise })
    await app.controller.start()
    const login = app.controller.signIn(input)
    await app.controller.signOut()
    response.resolve(session)
    await login
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.storage.session).toBeNull()
  })

  it('clears a hydrated token when a newer login fails before logout starts writing', async () => {
    const app = setup({
      requestSignIn: async () => {
        throw new Error('Credentials rejected')
      },
    })
    app.storage.session = session
    await app.controller.start()
    const logout = app.controller.signOut()
    const login = app.controller.signIn(input)
    await expect(login).rejects.toThrow('Credentials rejected')
    await logout
    expect(app.storage.session).toBeNull()
    expect(app.state()).toEqual({ status: 'anonymous' })
    const restarted = setup({ readSession: async () => app.storage.session })
    await restarted.controller.start()
    expect(restarted.state()).toEqual({ status: 'anonymous' })
  })

  it('completes queued logout deletion after provider cleanup', async () => {
    const app = setup()
    app.storage.session = session
    await app.controller.start()
    const logout = app.controller.signOut()
    app.controller.stop()
    const beforeDeletion = [...app.events]
    await logout
    expect(app.storage.session).toBeNull()
    expect(app.events).toEqual(beforeDeletion)
  })

  it('deletes the old token before persisting a successful newer login', async () => {
    let persisted: Session | null = session
    const writes: (Session | null)[] = []
    const app = setup({
      readSession: async () => persisted,
      requestSignIn: async () => newerSession,
      writeSession: async (token) => {
        persisted = token
        writes.push(persisted)
      },
    })
    await app.controller.start()
    const logout = app.controller.signOut()
    const login = app.controller.signIn(input)
    await Promise.all([logout, login])
    expect(writes).toEqual([null, newerSession])
    expect(persisted).toEqual(newerSession)
    expect(app.state()).toEqual({ status: 'authenticated', session: newerSession })
  })

  it('aborts an in-flight login on sign-out and ignores its obsolete rejection', async () => {
    let aborted = false
    const app = setup({
      requestSignIn: (_input, signal) =>
        new Promise<Session>((_resolve, reject) => {
          signal.addEventListener(
            'abort',
            () => {
              aborted = true
              reject(new Error('Request aborted'))
            },
            { once: true },
          )
        }),
    })
    await app.controller.start()
    const pending = app.controller.signIn(input)
    await app.controller.signOut()
    await expect(pending).resolves.toBeUndefined()
    expect(aborted).toBe(true)
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.storage.session).toBeNull()
  })

  it('settles logout even when a sign-in transport ignores its abort signal', async () => {
    const stalled = deferred<Session>()
    let loginSignal: AbortSignal | undefined
    const app = setup({
      requestSignIn: (_input, signal) => {
        loginSignal = signal
        return stalled.promise
      },
    })
    await app.controller.start()
    const pending = app.controller.signIn(input)
    await app.controller.signOut()

    // The underlying promise has not resolved or rejected. The caller must
    // nonetheless finish, and a late rejection must not resurrect the session.
    await expect(pending).resolves.toBeUndefined()
    expect(loginSignal?.aborted).toBe(true)
    stalled.reject(new Error('Late transport failure'))
    await Promise.resolve()
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.storage.session).toBeNull()
  })

  it('settles the superseded sign-in before its transport completes', async () => {
    const stalled = deferred<Session>()
    let requests = 0
    let oldSignal: AbortSignal | undefined
    const app = setup({
      requestSignIn: (_input, signal) => {
        if (++requests === 1) {
          oldSignal = signal
          return stalled.promise
        }
        return Promise.resolve(newerSession)
      },
    })
    await app.controller.start()
    const previous = app.controller.signIn(input)
    const current = app.controller.signIn(input)

    await expect(previous).resolves.toBeUndefined()
    await current
    expect(oldSignal?.aborted).toBe(true)
    expect(app.storage.session).toEqual(newerSession)
    stalled.resolve(session)
    await Promise.resolve()
    expect(app.state()).toEqual({ status: 'authenticated', session: newerSession })
  })

  it('aborts a superseded login without losing the newer session', async () => {
    let calls = 0
    let firstSignal: AbortSignal | undefined
    const app = setup({
      requestSignIn: (_input, signal) => {
        if (++calls === 2) return Promise.resolve(newerSession)
        firstSignal = signal
        return new Promise<Session>((_resolve, reject) => {
          signal.addEventListener('abort', () => reject(new Error('Request aborted')), {
            once: true,
          })
        })
      },
    })
    await app.controller.start()
    const previous = app.controller.signIn(input)
    const latest = app.controller.signIn(input)
    await Promise.all([previous, latest])
    expect(firstSignal?.aborted).toBe(true)
    expect(app.storage.session).toEqual(newerSession)
    expect(app.state()).toEqual({ status: 'authenticated', session: newerSession })
  })

  it('aborts a pending login when the auth provider is stopped', async () => {
    let signal: AbortSignal | undefined
    const app = setup({
      requestSignIn: (_input, requestSignal) => {
        signal = requestSignal
        return new Promise<Session>((_resolve, reject) => {
          requestSignal.addEventListener('abort', () => reject(new Error('Request aborted')), {
            once: true,
          })
        })
      },
    })
    await app.controller.start()
    const pending = app.controller.signIn(input)
    app.controller.stop()
    await expect(pending).resolves.toBeUndefined()
    expect(signal?.aborted).toBe(true)
    expect(app.storage.session).toBeNull()
  })

  it('commits only the latest login when responses arrive out of order', async () => {
    const first = deferred<Session>()
    const second = deferred<Session>()
    let requests = 0
    const app = setup({ requestSignIn: () => (++requests === 1 ? first.promise : second.promise) })
    await app.controller.start()
    const olderLogin = app.controller.signIn(input)
    const newerLogin = app.controller.signIn(input)
    second.resolve(newerSession)
    await newerLogin
    first.resolve(session)
    await olderLogin
    expect(app.state()).toEqual({ status: 'authenticated', session: newerSession })
    expect(app.storage.session).toEqual(newerSession)
  })

  it('clears a login write already in progress before sign out completes', async () => {
    const started = deferred<void>()
    const finish = deferred<void>()
    let persisted: Session | null = null
    const app = setup({
      writeSession: async (token) => {
        if (token?.accessToken === 'first-token') {
          started.resolve()
          await finish.promise
        }
        persisted = token
      },
    })
    await app.controller.start()
    const login = app.controller.signIn(input)
    await started.promise
    const logout = app.controller.signOut()
    expect(app.state()).toEqual({ status: 'anonymous' })
    finish.resolve()
    await Promise.all([login, logout])
    expect(persisted).toBeNull()
    expect(app.state()).toEqual({ status: 'anonymous' })
  })

  it('rolls back a stale write when a newer login fails before persisting', async () => {
    const started = deferred<void>()
    const finish = deferred<void>()
    let persisted: Session | null = null
    let requests = 0
    const app = setup({
      requestSignIn: async () => {
        if (++requests === 1) return session
        throw new Error('Credentials rejected')
      },
      writeSession: async (token) => {
        if (token?.accessToken === 'first-token') {
          started.resolve()
          await finish.promise
        }
        persisted = token
      },
    })
    await app.controller.start()
    const olderLogin = app.controller.signIn(input)
    await started.promise
    await expect(app.controller.signIn(input)).rejects.toThrow('Credentials rejected')
    finish.resolve()
    await olderLogin
    expect(persisted).toBeNull()
    expect(app.state()).toEqual({ status: 'anonymous' })
  })

  it('restores the complete previously committed session after a stale replacement write', async () => {
    const original: Session = {
      accessToken: 'lin-token',
      expiresAt: 3_000_000_000_000,
      user: { id: 'lin', name: 'Lin Chen', email: 'lin@example.com' },
    }
    const started = deferred<void>()
    const finish = deferred<void>()
    let requests = 0
    const app = setup({
      requestSignIn: async () => {
        if (++requests === 1) return session
        throw new Error('Credentials rejected')
      },
      writeSession: async (value) => {
        if (value?.accessToken === 'first-token') {
          started.resolve()
          await finish.promise
        }
        app.storage.session = value
      },
    })
    app.storage.session = original
    await app.controller.start()
    const olderLogin = app.controller.signIn(input)
    await started.promise
    await expect(app.controller.signIn(input)).rejects.toThrow('Credentials rejected')
    finish.resolve()
    await olderLogin
    expect(app.storage.session).toEqual(original)
    expect(app.state()).toEqual({ status: 'authenticated', session: original })
    expect(app.revision()).toBe(1)
  })

  it('ignores a pending login response after provider cleanup', async () => {
    const response = deferred<Session>()
    const app = setup({ requestSignIn: () => response.promise })
    await app.controller.start()
    const login = app.controller.signIn(input)
    const beforeCleanup = [...app.events]
    app.controller.stop()
    response.resolve(session)
    await login
    expect(app.events).toEqual(beforeCleanup)
    expect(app.storage.session).toBeNull()
  })

  it('rolls back a pending login write after provider cleanup', async () => {
    const started = deferred<void>()
    const finish = deferred<void>()
    let persisted: Session | null = null
    const app = setup({
      writeSession: async (token) => {
        if (token?.accessToken === 'first-token') {
          started.resolve()
          await finish.promise
        }
        persisted = token
      },
    })
    await app.controller.start()
    const login = app.controller.signIn(input)
    await started.promise
    const beforeCleanup = [...app.events]
    app.controller.stop()
    finish.resolve()
    await login
    expect(persisted).toBeNull()
    expect(app.events).toEqual(beforeCleanup)
  })

  it('allows StrictMode setup after cleanup without accepting the previous read', async () => {
    const first = deferred<Session | null>()
    const second = deferred<Session | null>()
    let reads = 0
    const app = setup({ readSession: () => (++reads === 1 ? first.promise : second.promise) })
    const oldSetup = app.controller.start()
    app.controller.stop()
    const newSetup = app.controller.start()
    first.resolve(session)
    await oldSetup
    expect(app.state()).toEqual({ status: 'loading' })
    second.resolve(null)
    await newSetup
    expect(app.state()).toEqual({ status: 'anonymous' })
  })

  it('clears the in-memory session and rejects when token deletion fails', async () => {
    const app = setup({
      writeSession: async (token) => {
        if (token === null) throw new Error('Keychain unavailable')
      },
    })
    await app.controller.start()
    await app.controller.signIn(input)
    await expect(app.controller.signOut()).rejects.toThrow('Keychain unavailable')
    expect(app.state()).toEqual({ status: 'anonymous', error: 'Session storage is unavailable.' })
  })

  it('does not authenticate when token persistence fails', async () => {
    const app = setup({
      writeSession: async () => {
        throw new Error('Keychain unavailable')
      },
    })
    await app.controller.start()
    await expect(app.controller.signIn(input)).rejects.toThrow('Keychain unavailable')
    expect(app.state()).toEqual({ status: 'anonymous', error: 'Session storage is unavailable.' })
  })
})
