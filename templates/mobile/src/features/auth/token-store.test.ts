import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readSession, readToken, writeSession } from '../../lib/token-store'
import { createAuthController } from './auth-controller'
import { type AuthState, authReducer, initialAuthState } from './reducer'
import type { Session } from './schema'

const native = vi.hoisted(() => ({
  platform: { OS: 'web' },
  values: new Map<string, string>(),
}))

vi.mock('react-native', () => ({ Platform: native.platform }))
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (key: string) => native.values.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => {
    native.values.set(key, value)
  },
  deleteItemAsync: async (key: string) => {
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
