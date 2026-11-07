import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/features/auth/store'
import { demoSession } from '@/mocks/fixtures'

beforeEach(() => {
  useAuthStore.getState().clearSession()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  useAuthStore.getState().clearSession()
})

describe('session storage denial', () => {
  it('rejects a restored legacy session without a shared revocation nonce', async () => {
    sessionStorage.setItem('reactloom.session', JSON.stringify(demoSession()))
    sessionStorage.removeItem('reactloom.session.id')
    vi.resetModules()

    const { getActiveSession, useAuthStore: restoredStore } = await import('@/features/auth/store')

    expect(getActiveSession()).toBeNull()
    expect(restoredStore.getState().sessionId).toBeNull()
    expect(sessionStorage.getItem('reactloom.session')).toBeNull()
    expect(sessionStorage.getItem('reactloom.session.id')).toBeNull()
  })

  it('preserves a restored session when its revocation nonce is present', async () => {
    const session = demoSession()
    const sessionId = 'a'.repeat(32)
    sessionStorage.setItem('reactloom.session', JSON.stringify(session))
    sessionStorage.setItem('reactloom.session.id', sessionId)
    vi.resetModules()

    const { useAuthStore: restoredStore } = await import('@/features/auth/store')

    expect(restoredStore.getState().session).toEqual(session)
    expect(restoredStore.getState().sessionId).toBe(sessionId)
  })

  it('starts signed out when reading storage is denied', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is denied.', 'SecurityError')
    })
    vi.resetModules()

    const { useAuthStore: restoredStore } = await import('@/features/auth/store')

    expect(restoredStore.getState().session).toBeNull()
  })

  it('starts signed out when accessing storage itself is denied', async () => {
    vi.spyOn(globalThis, 'sessionStorage', 'get').mockImplementation(() => {
      throw new DOMException('Storage is denied.', 'SecurityError')
    })
    vi.resetModules()

    const { useAuthStore: restoredStore } = await import('@/features/auth/store')

    expect(restoredStore.getState().session).toBeNull()
  })

  it('keeps a successful sign-in in memory when persistence fails', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full.', 'QuotaExceededError')
    })
    const session = demoSession()

    expect(() => useAuthStore.getState().setSession(session)).not.toThrow()

    expect(useAuthStore.getState().session).toEqual(session)
  })

  it('invalidates the in-memory session when removing persistence fails', () => {
    useAuthStore.getState().setSession(demoSession())
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Storage is denied.', 'SecurityError')
    })

    expect(() => useAuthStore.getState().clearSession()).not.toThrow()

    expect(useAuthStore.getState().session).toBeNull()
  })
})
