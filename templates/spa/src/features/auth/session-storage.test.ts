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

  it('cannot restore signed-out credentials when deletion is denied but overwriting works', async () => {
    useAuthStore.getState().setSession(demoSession())
    expect(sessionStorage.getItem('reactloom.session')).not.toBeNull()
    expect(sessionStorage.getItem('reactloom.session.id')).not.toBeNull()
    const originalRemoveItem = Storage.prototype.removeItem
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
      this: Storage,
      key: string,
    ) {
      if (this === sessionStorage) {
        throw new DOMException('Storage deletion is denied.', 'SecurityError')
      }
      return originalRemoveItem.call(this, key)
    })

    expect(() => useAuthStore.getState().clearSession()).not.toThrow()
    expect(useAuthStore.getState().session).toBeNull()
    expect(sessionStorage.getItem('reactloom.session')).toBe('')
    expect(sessionStorage.getItem('reactloom.session.id')).toBe('')

    vi.restoreAllMocks()
    vi.resetModules()
    const { useAuthStore: restoredStore } = await import('@/features/auth/store')
    expect(restoredStore.getState().session).toBeNull()
    expect(restoredStore.getState().sessionId).toBeNull()
  })


  it.each(['reactloom.session', 'reactloom.session.id'])(
    'does not restore partial credentials when a replacement write to %s fails',
    async (deniedKey) => {
      useAuthStore.getState().setSession(demoSession())
      const oldId = useAuthStore.getState().sessionId
      const replacement = { ...demoSession(), accessToken: 'replacement-token' }
      const originalSetItem = Storage.prototype.setItem
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
        this: Storage,
        key: string,
        value: string,
      ) {
        if (this === sessionStorage && key === deniedKey) {
          throw new DOMException('Session write denied.', 'QuotaExceededError')
        }
        return originalSetItem.call(this, key, value)
      })

      expect(() => useAuthStore.getState().setSession(replacement)).not.toThrow()
      expect(useAuthStore.getState().session).toEqual(replacement)
      expect(useAuthStore.getState().sessionId).not.toBe(oldId)
      expect(sessionStorage.getItem('reactloom.session')).toBeNull()
      expect(sessionStorage.getItem('reactloom.session.id')).toBeNull()

      vi.restoreAllMocks()
      vi.resetModules()
      const { useAuthStore: restoredStore } = await import('@/features/auth/store')
      expect(restoredStore.getState().session).toBeNull()
    },
  )

  it('invalidates a replacement when storage silently drops the rotated nonce', () => {
    useAuthStore.getState().setSession(demoSession())
    const previousNonce = sessionStorage.getItem('reactloom.session.id')
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key: string,
      value: string,
    ) {
      if (this === sessionStorage && key === 'reactloom.session.id') return
      return originalSetItem.call(this, key, value)
    })

    const replacement = { ...demoSession(), accessToken: 'replacement-token' }
    useAuthStore.getState().setSession(replacement)

    expect(useAuthStore.getState().session).toEqual(replacement)
    expect(useAuthStore.getState().sessionId).not.toBe(previousNonce)
    expect(sessionStorage.getItem('reactloom.session')).toBeNull()
    expect(sessionStorage.getItem('reactloom.session.id')).toBeNull()
  })
})
