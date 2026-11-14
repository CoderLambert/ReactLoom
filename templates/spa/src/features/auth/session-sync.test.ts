import { afterEach, describe, expect, it, vi } from 'vitest'
import { publishSessionLogout, subscribeToSessionLogout } from '@/features/auth/session-sync'

const STORAGE_EVENT_KEY = 'reactloom.session-logout-event'

class FakeBroadcastChannel {
  static channels = new Set<FakeBroadcastChannel>()
  static sent: unknown[] = []
  onmessage: ((event: { data: unknown }) => void) | null = null

  constructor(_name: string) {
    FakeBroadcastChannel.channels.add(this)
  }

  postMessage(data: unknown) {
    FakeBroadcastChannel.sent.push(data)
    for (const channel of FakeBroadcastChannel.channels) {
      if (channel !== this) channel.onmessage?.({ data })
    }
  }

  close() {
    FakeBroadcastChannel.channels.delete(this)
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  localStorage.clear()
  FakeBroadcastChannel.channels.clear()
  FakeBroadcastChannel.sent = []
})

describe('cross-tab SPA session revocation', () => {
  it('sends only a session nonce, never a bearer token or identity', () => {
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel)
    const received: string[] = []
    const unsubscribe = subscribeToSessionLogout((id) => received.push(id))

    publishSessionLogout('nonce-123')
    expect(received).toEqual(['nonce-123'])
    expect(FakeBroadcastChannel.sent).toEqual([{ type: 'logout', sessionId: 'nonce-123' }])
    unsubscribe()
    publishSessionLogout('nonce-456')
    expect(received).toEqual(['nonce-123'])
  })

  it('ignores malformed messages and degrades when BroadcastChannel is unavailable', () => {
    vi.stubGlobal('BroadcastChannel', FakeBroadcastChannel)
    const received: string[] = []
    const unsubscribe = subscribeToSessionLogout((id) => received.push(id))
    const sender = new FakeBroadcastChannel('reactloom.session-logout')
    sender.postMessage({ type: 'logout', sessionId: 12 })
    sender.postMessage({ type: 'other', sessionId: 'nonce-123' })
    expect(received).toEqual([])
    unsubscribe()
    sender.close()

    vi.stubGlobal('BroadcastChannel', undefined)
    expect(() => publishSessionLogout('nonce-123')).not.toThrow()
    expect(() => subscribeToSessionLogout(() => undefined)()).not.toThrow()
  })

  it('uses a transient nonce-only storage event when BroadcastChannel is missing', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem')

    publishSessionLogout('previous-session-nonce')
    expect(setItem).toHaveBeenCalledWith(STORAGE_EVENT_KEY, 'previous-session-nonce')
    expect(removeItem).toHaveBeenCalledWith(STORAGE_EVENT_KEY)
    expect(localStorage.getItem(STORAGE_EVENT_KEY)).toBeNull()
  })

  it('accepts storage revocations from other tabs and removes its listener on unmount', () => {
    vi.stubGlobal('BroadcastChannel', undefined)
    const onLogout = vi.fn()
    const unsubscribe = subscribeToSessionLogout(onLogout)
    const send = (key: string, sessionId: string | null) => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key,
          newValue: sessionId,
          storageArea: localStorage,
        }),
      )
    }

    send('unrelated-key', 'old')
    send(STORAGE_EVENT_KEY, null)
    expect(onLogout).not.toHaveBeenCalled()

    send(STORAGE_EVENT_KEY, 'copied-session-nonce')
    expect(onLogout).toHaveBeenCalledWith('copied-session-nonce')
    expect(onLogout).toHaveBeenCalledTimes(1)

    unsubscribe()
    send(STORAGE_EVENT_KEY, 'later-session')
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('keeps the storage fallback active if BroadcastChannel construction throws', () => {
    class DisabledBroadcastChannel {
      constructor() {
        throw new Error('BroadcastChannel disabled')
      }
    }
    vi.stubGlobal('BroadcastChannel', DisabledBroadcastChannel)
    const onLogout = vi.fn()
    const unsubscribe = subscribeToSessionLogout(onLogout)
    expect(() => publishSessionLogout('active-nonce')).not.toThrow()
    expect(localStorage.getItem(STORAGE_EVENT_KEY)).toBeNull()

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: STORAGE_EVENT_KEY,
        newValue: 'active-nonce',
        storageArea: localStorage,
      }),
    )
    expect(onLogout).toHaveBeenCalledWith('active-nonce')
    unsubscribe()
  })
})
