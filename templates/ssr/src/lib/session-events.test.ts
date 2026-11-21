import { afterEach, expect, it, vi } from 'vitest'
import { broadcastSessionEvent, subscribeSessionEvents } from './session-events'

afterEach(() => {
  vi.unstubAllGlobals()
})

it('does not interrupt session transitions when channel construction is denied', () => {
  vi.stubGlobal(
    'BroadcastChannel',
    class {
      constructor() {
        throw new DOMException('Messaging is denied', 'SecurityError')
      }
    },
  )

  expect(() => broadcastSessionEvent('signed-in')).not.toThrow()
  expect(() => broadcastSessionEvent('signed-out')).not.toThrow()
  expect(() => subscribeSessionEvents(() => undefined)()).not.toThrow()
})

it('closes the channel and does not rethrow when posting fails', () => {
  const close = vi.fn()
  vi.stubGlobal(
    'BroadcastChannel',
    class {
      close = close

      postMessage() {
        throw new Error('Message delivery failed')
      }
    },
  )

  expect(() => broadcastSessionEvent('signed-out')).not.toThrow()
  expect(close).toHaveBeenCalledOnce()
})

it('sends an ephemeral credential-free storage event when BroadcastChannel is denied', () => {
  const handlers = new Set<(event: StorageEvent) => void>()
  let payload = ''
  const storage = {
    setItem: vi.fn((_key: string, value: string) => {
      payload = value
    }),
    removeItem: vi.fn(),
  }
  vi.stubGlobal('window', {
    localStorage: storage,
    addEventListener: (_name: string, handler: (event: StorageEvent) => void) => {
      handlers.add(handler)
    },
    removeEventListener: (_name: string, handler: (event: StorageEvent) => void) => {
      handlers.delete(handler)
    },
  })
  vi.stubGlobal('BroadcastChannel', undefined)

  const listener = vi.fn()
  const unsubscribe = subscribeSessionEvents(listener)
  broadcastSessionEvent('signed-out')

  expect(storage.setItem).toHaveBeenCalledOnce()
  expect(storage.removeItem).toHaveBeenCalledWith('reactloom-session-signal')
  expect(JSON.parse(payload)).toEqual({
    event: 'signed-out',
    id: expect.any(String),
    broadcastSent: false,
  })
  for (const handler of handlers) {
    handler({ key: 'reactloom-session-signal', newValue: payload } as StorageEvent)
  }
  expect(listener).toHaveBeenCalledExactlyOnceWith('signed-out')

  unsubscribe()
  expect(handlers.size).toBe(0)
})

it('avoids dual-channel rechecks, preserves legacy strings, and accepts denied senders', () => {
  const handlers = new Set<(event: StorageEvent) => void>()
  const channels: FakeChannel[] = []

  class FakeChannel {
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null

    constructor() {
      channels.push(this)
    }

    postMessage(data: unknown) {
      for (const channel of channels) {
        if (channel !== this) channel.onmessage?.({ data } as MessageEvent<unknown>)
      }
    }

    close() {
      channels.splice(channels.indexOf(this), 1)
    }
  }

  vi.stubGlobal('BroadcastChannel', FakeChannel)
  vi.stubGlobal('window', {
    localStorage: {
      setItem: (key: string, value: string) => {
        for (const handler of handlers) {
          handler({ key, newValue: value } as StorageEvent)
        }
      },
      removeItem: vi.fn(),
    },
    addEventListener: (_name: string, handler: (event: StorageEvent) => void) => {
      handlers.add(handler)
    },
    removeEventListener: (_name: string, handler: (event: StorageEvent) => void) => {
      handlers.delete(handler)
    },
  })

  const listener = vi.fn()
  const unsubscribe = subscribeSessionEvents(listener)
  broadcastSessionEvent('signed-out')
  expect(listener).toHaveBeenCalledExactlyOnceWith('signed-out')

  // An older tab still sends the original string message.
  channels[0]?.onmessage?.({ data: 'signed-in' } as MessageEvent<unknown>)
  expect(listener).toHaveBeenCalledTimes(2)
  expect(listener).toHaveBeenLastCalledWith('signed-in')

  // A sender that cannot construct its channel must still reach this
  // recipient even though the recipient's channel is available.
  for (const handler of handlers) {
    handler({
      key: 'reactloom-session-signal',
      newValue: JSON.stringify({ event: 'signed-out', id: 'fallback-1', broadcastSent: false }),
    } as StorageEvent)
  }
  expect(listener).toHaveBeenCalledTimes(3)
  expect(listener).toHaveBeenLastCalledWith('signed-out')

  unsubscribe()
  expect(handlers.size).toBe(0)
  expect(channels).toHaveLength(0)
})
