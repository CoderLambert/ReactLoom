import { afterEach, describe, expect, it, vi } from 'vitest'
import { publishSessionLogout, subscribeToSessionLogout } from '@/features/auth/session-sync'

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
  vi.unstubAllGlobals()
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
})
