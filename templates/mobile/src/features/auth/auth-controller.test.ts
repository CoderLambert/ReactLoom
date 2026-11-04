import { describe, expect, it } from 'vitest'
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

function setup(overrides: Partial<Dependencies> = {}) {
  let state: AuthState = initialAuthState
  const events: AuthEvent[] = []
  const storage: { token: string | null } = { token: null }
  const controller = createAuthController({
    readToken: async () => storage.token,
    writeToken: async (token) => {
      storage.token = token
    },
    requestSignIn: async () => session,
    dispatch: (event) => {
      events.push(event)
      state = authReducer(state, event)
    },
    ...overrides,
  })
  return { controller, storage, events, state: () => state }
}

describe('auth controller', () => {
  it('settles anonymous if login fails while hydration is pending', async () => {
    const read = deferred<string | null>()
    const app = setup({
      readToken: () => read.promise,
      requestSignIn: async () => {
        throw new Error('Credentials rejected')
      },
    })
    const hydration = app.controller.start()
    await expect(app.controller.signIn(input)).rejects.toThrow('Credentials rejected')
    read.resolve('old-token')
    await hydration
    expect(app.state()).toEqual({ status: 'anonymous' })
  })

  it('settles anonymous when session storage cannot be read', async () => {
    const app = setup({
      readToken: async () => {
        throw new Error('Keychain unavailable')
      },
    })
    await app.controller.start()
    expect(app.state()).toEqual({ status: 'anonymous', error: 'Session storage is unavailable.' })
  })

  it('ignores hydration that completes after sign out', async () => {
    const read = deferred<string | null>()
    const app = setup({ readToken: () => read.promise })
    const hydration = app.controller.start()
    await app.controller.signOut()
    read.resolve('old-token')
    await hydration
    expect(app.state()).toEqual({ status: 'anonymous' })
    expect(app.storage.token).toBeNull()
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
    expect(app.storage.token).toBeNull()
  })

  it('clears a hydrated token when a newer login fails before logout starts writing', async () => {
    const app = setup({
      requestSignIn: async () => {
        throw new Error('Credentials rejected')
      },
    })
    app.storage.token = 'old-token'
    await app.controller.start()
    const logout = app.controller.signOut()
    const login = app.controller.signIn(input)
    await expect(login).rejects.toThrow('Credentials rejected')
    await logout
    expect(app.storage.token).toBeNull()
    expect(app.state()).toEqual({ status: 'anonymous' })
    const restarted = setup({ readToken: async () => app.storage.token })
    await restarted.controller.start()
    expect(restarted.state()).toEqual({ status: 'anonymous' })
  })

  it('completes queued logout deletion after provider cleanup', async () => {
    const app = setup()
    app.storage.token = 'old-token'
    await app.controller.start()
    const logout = app.controller.signOut()
    app.controller.stop()
    const beforeDeletion = [...app.events]
    await logout
    expect(app.storage.token).toBeNull()
    expect(app.events).toEqual(beforeDeletion)
  })

  it('deletes the old token before persisting a successful newer login', async () => {
    let persisted: string | null = 'old-token'
    const writes: (string | null)[] = []
    const app = setup({
      readToken: async () => persisted,
      requestSignIn: async () => newerSession,
      writeToken: async (token) => {
        persisted = token
        writes.push(persisted)
      },
    })
    await app.controller.start()
    const logout = app.controller.signOut()
    const login = app.controller.signIn(input)
    await Promise.all([logout, login])
    expect(writes).toEqual([null, 'second-token'])
    expect(persisted).toBe('second-token')
    expect(app.state()).toEqual({ status: 'authenticated', session: newerSession })
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
    expect(app.storage.token).toBe('second-token')
  })

  it('clears a login write already in progress before sign out completes', async () => {
    const started = deferred<void>()
    const finish = deferred<void>()
    let persisted: string | null = null
    const app = setup({
      writeToken: async (token) => {
        if (token === 'first-token') {
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
    let persisted: string | null = null
    let requests = 0
    const app = setup({
      requestSignIn: async () => {
        if (++requests === 1) return session
        throw new Error('Credentials rejected')
      },
      writeToken: async (token) => {
        if (token === 'first-token') {
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
    expect(app.storage.token).toBeNull()
  })

  it('rolls back a pending login write after provider cleanup', async () => {
    const started = deferred<void>()
    const finish = deferred<void>()
    let persisted: string | null = null
    const app = setup({
      writeToken: async (token) => {
        if (token === 'first-token') {
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
    const first = deferred<string | null>()
    const second = deferred<string | null>()
    let reads = 0
    const app = setup({ readToken: () => (++reads === 1 ? first.promise : second.promise) })
    const oldSetup = app.controller.start()
    app.controller.stop()
    const newSetup = app.controller.start()
    first.resolve('old-token')
    await oldSetup
    expect(app.state()).toEqual({ status: 'loading' })
    second.resolve(null)
    await newSetup
    expect(app.state()).toEqual({ status: 'anonymous' })
  })

  it('clears the in-memory session and rejects when token deletion fails', async () => {
    const app = setup({
      writeToken: async (token) => {
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
      writeToken: async () => {
        throw new Error('Keychain unavailable')
      },
    })
    await app.controller.start()
    await expect(app.controller.signIn(input)).rejects.toThrow('Keychain unavailable')
    expect(app.state()).toEqual({ status: 'anonymous', error: 'Session storage is unavailable.' })
  })
})
