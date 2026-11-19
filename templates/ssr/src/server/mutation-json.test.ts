import { describe, expect, it } from 'vitest'
import { MAX_MUTATION_JSON_BYTES, readMutationJson } from './mutation-json'

const endpoint = 'https://app.reactloom.test/api/session'

function requestWith(body: BodyInit, headers: HeadersInit = {}) {
  return new Request(endpoint, { method: 'POST', body, headers })
}

describe('bounded mutation JSON parsing', () => {
  it('accepts a valid small payload', async () => {
    await expect(readMutationJson(requestWith('{"title":"test"}'))).resolves.toEqual({
      ok: true,
      data: { title: 'test' },
    })
  })

  it('retains malformed and missing body errors', async () => {
    await expect(readMutationJson(requestWith('{'))).resolves.toEqual({
      ok: false,
      tooLarge: false,
    })
    await expect(readMutationJson(new Request(endpoint, { method: 'POST' }))).resolves.toEqual({
      ok: false,
      tooLarge: false,
    })
  })

  it('rejects oversized Content-Length without consuming the body', async () => {
    const request = requestWith('{"title":"test"}', {
      'content-length': String(MAX_MUTATION_JSON_BYTES + 1),
    })
    await expect(readMutationJson(request)).resolves.toEqual({ ok: false, tooLarge: true })
    expect(request.bodyUsed).toBe(false)
  })

  it('rejects streamed input without Content-Length and cancels the reader', async () => {
    let canceled = false
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_MUTATION_JSON_BYTES + 1))
      },
      cancel() {
        canceled = true
      },
    })
    const request = new Request(endpoint, {
      method: 'POST',
      body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' })
    await expect(readMutationJson(request)).resolves.toEqual({ ok: false, tooLarge: true })
    expect(canceled).toBe(true)
  })

  it(
    'returns an oversized response even if the stream cancellation never settles',
    async () => {
      let cancelCalled = false
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new Uint8Array(MAX_MUTATION_JSON_BYTES + 1))
        },
        cancel() {
          cancelCalled = true
          return new Promise<void>(() => {})
        },
      })
      const request = new Request(endpoint, {
        method: 'POST',
        body,
        duplex: 'half',
      } as RequestInit & { duplex: 'half' })

      await expect(readMutationJson(request)).resolves.toEqual({ ok: false, tooLarge: true })
      expect(cancelCalled).toBe(true)
    },
    3_000,
  )

  it('rejects the actual streamed byte count despite a forged small length', async () => {
    const request = requestWith('"' + 'x'.repeat(MAX_MUTATION_JSON_BYTES) + '"', {
      'content-length': '2',
    })
    await expect(readMutationJson(request)).resolves.toEqual({ ok: false, tooLarge: true })
  })

  it('accepts exactly the maximum number of UTF-8 bytes', async () => {
    const result = await readMutationJson(
      requestWith('"' + 'x'.repeat(MAX_MUTATION_JSON_BYTES - 2) + '"'),
    )
    expect(result.ok).toBe(true)
    if (result.ok) expect((result.data as string).length).toBe(MAX_MUTATION_JSON_BYTES - 2)
  })

  it('rejects malformed UTF-8 before JSON parsing', async () => {
    await expect(readMutationJson(requestWith(new Uint8Array([34, 255, 34])))).resolves.toEqual({
      ok: false,
      tooLarge: false,
    })
  })
})
