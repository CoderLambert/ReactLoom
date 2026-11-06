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
