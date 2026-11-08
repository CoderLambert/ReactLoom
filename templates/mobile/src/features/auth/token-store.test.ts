import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readSession, readToken, writeSession } from '../../lib/token-store'
import { createAuthController } from './auth-controller'
import { type AuthState, authReducer, initialAuthState } from './reducer'
import type { Session } from './schema'

const native = vi.hoisted(() => ({
  platform: { OS: 'web' },
  values: new Map<string, string>(),
  deleteError: null as Error | null,
  setError: null as Error | null,
}))

vi.mock('react-native', () => ({ Platform: native.platform }))
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (key: string) => native.values.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    if (native.setError) throw native.setError
    native.values.set(key, value)
  },
  deleteItemAsync: async (key: string) => {
    if (native.deleteError) throw native.deleteError
    native.values.delete(key)
  },
}))

const session: Session = {
  accessToken: 'server-token',
  expiresAt: 3_000_000_000_000,
  user: { id: 'user-lin', name: 'Lin Chen', email: 'lin@example.com' },
}
const key = 'reactloom.session'
const values = new Map<string, string>()

describe('session storage', () => {
  beforeEach(() => {
    values.clear()
    native.values.clear()
    native.deleteError = null
    native.setError = null
    native.platform.OS = 'web'
    vi.useFakeTimers()
    vi.setSystemTime(1_000)
    vi.stubGlobal('localStorage', {
      getItem: (name: string) => values.get(name) ?? null,
      setItem: (name: string, value: string) => {
        values.set(name, value)
      },
      removeItem: (name: string) => {
        values.delete(name)
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('round trips the complete server session in a versioned record on web', async () => {
    await writeSession(session)
    expect(JSON.parse(values.get(key) ?? 'null')).toEqual({ version: 1, session })
    expect(await readSession()).toEqual(session)
    expect(await readToken()).toBe('server-token')
    await writeSession(null)
    expect(values.has(key)).toBe(false)
    expect(await readSession()).toBeNull()
  })

  it('tombstones a web session when deletion is blocked, including after restart', async () => {
    await writeSession(session)
    vi.stubGlobal('localStorage', {
      getItem: (name: string) => values.get(name) ?? null,
      setItem: (name: string, value: string) => {
        values.set(name, value)
      },
      removeItem: () => {
        throw new Error('Web storage deletion blocked')
      },
    })

    let state: AuthState = initialAuthState
    const createController = () =>
      createAuthController({
        readSession,
        writeSession,
        requestSignIn: async () => session,
        subscribeToForeground: () => () => {},
        dispatch: (event) => {
          state = authReducer(state, event)
        },
      })

    const controller = createController()
    await controller.start()
    await expect(controller.signOut()).resolves.toBeUndefined()
    controller.stop()
    expect(values.get(key)).toBe('{"version":1,"session":null}')
    expect(await readToken()).toBeNull()

    state = initialAuthState
    const restarted = createController()
    await restarted.start()
    expect(state).toEqual({ status: 'anonymous', revision: 0 })
    restarted.stop()
  })

  it('reports web storage failure if neither removal nor overwrite works', async () => {
    await writeSession(session)
    vi.stubGlobal('localStorage', {
      getItem: (name: string) => values.get(name) ?? null,
      setItem: () => {
        throw new Error('Web storage write blocked')
      },
      removeItem: () => {
        throw new Error('Web storage deletion blocked')
      },
    })
    await expect(writeSession(null)).rejects.toThrow('Web storage deletion blocked')
    expect(values.get(key)).toContain('server-token')
  })

  it('deletes a legacy token during hydration and requires login', async () => {
    values.set(key, 'legacy-token')
    let state: AuthState = initialAuthState
    const controller = createAuthController({
      readSession,
      writeSession,
      requestSignIn: async () => session,
      subscribeToForeground: () => () => {},
      dispatch: (event) => {
        state = authReducer(state, event)
      },
    })
    await controller.start()
    expect(state).toEqual({ status: 'anonymous', revision: 0 })
    expect(values.has(key)).toBe(false)
    controller.stop()
  })

  it('round trips and removes the same record across the SecureStore boundary', async () => {
    native.platform.OS = 'ios'
    await writeSession(session)
    expect(JSON.parse(native.values.get(key) ?? 'null')).toEqual({ version: 1, session })
    expect(await readSession()).toEqual(session)
    expect(await readToken()).toBe('server-token')
    expect(values.has(key)).toBe(false)
    await writeSession(null)
    expect(native.values.has(key)).toBe(false)
  })

  it('tombstones the native session when SecureStore deletion fails', async () => {
    native.platform.OS = 'ios'
    await writeSession(session)
    native.deleteError = new Error('Keychain delete blocked')
    let state: AuthState = initialAuthState
    const createController = () =>
      createAuthController({
        readSession,
        writeSession,
        requestSignIn: async () => session,
        subscribeToForeground: () => () => {},
        dispatch: (event) => {
          state = authReducer(state, event)
        },
      })

    const controller = createController()
    await controller.start()
    await expect(controller.signOut()).resolves.toBeUndefined()
    controller.stop()
    expect(native.values.get(key)).toBe('{"version":1,"session":null}')
    expect(await readToken()).toBeNull()

    native.deleteError = null
    state = initialAuthState
    const restarted = createController()
    await restarted.start()
    expect(state).toEqual({ status: 'anonymous', revision: 0 })
    expect(native.values.has(key)).toBe(false)
    restarted.stop()
  })

  it('reports a native storage failure if neither deletion nor overwrite succeeds', async () => {
    native.platform.OS = 'android'
    await writeSession(session)
    native.deleteError = new Error('Keychain delete blocked')
    native.setError = new Error('Keychain write blocked')

    await expect(writeSession(null)).rejects.toThrow('Keychain delete blocked')
    expect(native.values.get(key)).toContain('server-token')
  })

  it.each([
    ['legacy bare token', 'legacy-token'],
    ['invalid JSON', '{'],
    ['unversioned session', JSON.stringify(session)],
    ['unknown version', JSON.stringify({ version: 2, session })],
    ['extra record field', JSON.stringify({ version: 1, session, other: true })],
    [
      'missing identity',
      JSON.stringify({ version: 1, session: { accessToken: 'token', expiresAt: 3_000 } }),
    ],
    [
      'extra session field',
      JSON.stringify({ version: 1, session: { ...session, refreshToken: 'unknown' } }),
    ],
    [
      'non-finite expiry',
      '{"version":1,"session":{"accessToken":"token","expiresAt":1e400,"user":{"id":"lin","name":"Lin","email":"lin@example.com"}}}',
    ],
    ['expired session', JSON.stringify({ version: 1, session: { ...session, expiresAt: 1_000 } })],
  ])('rejects %s without returning a bearer token', async (_label, value) => {
    values.set(key, value)
    expect(await readSession()).toBeNull()
    expect(await readToken()).toBeNull()
  })

  it('stops returning the stored token at the exact original server expiration', async () => {
    await writeSession({ ...session, expiresAt: 2_000 })
    vi.setSystemTime(2_000)
    expect(await readSession()).toBeNull()
    expect(await readToken()).toBeNull()
  })

  it('propagates blocked web storage reads and writes', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('Storage blocked')
      },
      setItem: () => {
        throw new Error('Storage blocked')
      },
      removeItem: () => {
        throw new Error('Storage blocked')
      },
    })
    await expect(readSession()).rejects.toThrow('Storage blocked')
    await expect(writeSession(session)).rejects.toThrow('Storage blocked')
    await expect(writeSession(null)).rejects.toThrow('Storage blocked')
  })

  it('rejects malformed session writes rather than persisting unusable data', async () => {
    await expect(writeSession({ ...session, expiresAt: Number.NaN })).rejects.toThrow()
    expect(values.has(key)).toBe(false)
  })
})
