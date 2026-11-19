import { describe, expect, it } from 'vitest'
import { readMutationJson } from './mutation-json'

const endpoint = 'https://app.reactloom.test/api/session'

function requestFromStream(stream: ReadableStream<Uint8Array>) {
  return new Request(endpoint, {
    method: 'POST',
    body: stream,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' })
}

describe('bounded mutation JSON streaming duration', () => {
  it('times out a partial JSON stream even when its cancellation never settles', async () => {
    let canceled = false
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{'))
      },
      cancel() {
        canceled = true
        return new Promise<void>(() => {})
      },
    })

    await expect(readMutationJson(requestFromStream(body), 25)).resolves.toEqual({
      ok: false,
      tooLarge: false,
      timedOut: true,
    })
    expect(canceled).toBe(true)
  })

  it('uses an absolute deadline rather than resetting it for every incoming chunk', async () => {
    let writer: ReadableStreamDefaultController<Uint8Array> | undefined
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        writer = controller
        controller.enqueue(new TextEncoder().encode('{'))
      },
    })
    const request = requestFromStream(body)
    const result = readMutationJson(request, 60)
    const interval = setInterval(() => {
      try {
        writer?.enqueue(new TextEncoder().encode(' '))
      } catch {
        // The reader may have been cancelled by the deadline.
      }
    }, 10)
    try {
      await expect(result).resolves.toEqual({ ok: false, tooLarge: false, timedOut: true })
    } finally {
      clearInterval(interval)
    }
  })

  it('handles a rejected stream cancellation without changing the 408 decision', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{'))
      },
      cancel() {
        return Promise.reject(new Error('cancel failed'))
      },
    })
    await expect(readMutationJson(requestFromStream(body), 25)).resolves.toEqual({
      ok: false,
      tooLarge: false,
      timedOut: true,
    })
  })
})
