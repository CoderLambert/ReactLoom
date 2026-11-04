import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApiClient } from './client.js'
import { isApiError } from './errors.js'

const schema = {
  parse: (data: unknown) => {
    if (typeof data === 'object' && data !== null && 'ok' in data && data.ok === true) {
      return data as { ok: true }
    }
    throw new Error('bad payload')
  },
}

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

describe('createApiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('normalizes HTTP errors and does not retry POST by default', async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ message: 'nope' }, 500))
    const client = createApiClient({ baseUrl: 'http://api.test', fetchFn })

    await expect(
      client.request('/items', schema, { method: 'POST', body: { name: 'warp' } }),
    ).rejects.toMatchObject({ code: 'http', status: 500, message: 'nope' })
    expect(fetchFn).toHaveBeenCalledOnce()
  })

  it('retries idempotent requests and then succeeds', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ message: 'busy' }, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const client = createApiClient({
      baseUrl: 'http://api.test/',
      fetchFn,
      retry: { baseDelayMs: 1, maxDelayMs: 2 },
      sleep: async () => undefined,
    })

    await expect(client.request('/items', schema)).resolves.toEqual({ ok: true })
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('honors HTTP-date Retry-After on rate-limited responses', async () => {
    const now = Date.parse('2026-11-04T16:00:00.000Z')
    vi.spyOn(Date, 'now').mockReturnValue(now)
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ message: 'rate limited' }, 429, {
          'retry-after': new Date(now + 45_000).toUTCString(),
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const sleep = vi.fn(async () => undefined)
    const client = createApiClient({
      baseUrl: 'https://api.test',
      fetchFn,
      sleep,
      retry: { maxDelayMs: 120_000 },
    })

    await expect(client.request('/items', schema)).resolves.toEqual({ ok: true })
    expect(sleep).toHaveBeenCalledOnce()
    expect(sleep).toHaveBeenCalledWith(45_000, expect.any(AbortSignal))
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('ignores negative Retry-After seconds instead of scheduling a negative delay', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(1)
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': '-5' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const sleep = vi.fn(async () => undefined)
    const client = createApiClient({
      baseUrl: 'https://api.test',
      fetchFn,
      sleep,
      retry: { baseDelayMs: 200, maxDelayMs: 120_000 },
    })

    await expect(client.request('/items', schema)).resolves.toEqual({ ok: true })
    expect(sleep).toHaveBeenCalledWith(200, expect.any(AbortSignal))
  })

  it('caps numeric Retry-After seconds to the configured maximum', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': '30' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const sleep = vi.fn(async () => undefined)
    const client = createApiClient({
      baseUrl: 'https://api.test',
      fetchFn,
      sleep,
      retry: { maxDelayMs: 1_000 },
    })

    await expect(client.request('/items', schema)).resolves.toEqual({ ok: true })
    expect(sleep).toHaveBeenCalledWith(1_000, expect.any(AbortSignal))
  })

  it('retries a 503 with a non-JSON upstream error body', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response('<html>upstream unavailable</html>', {
          status: 503,
          headers: { 'content-type': 'text/html' },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetchFn,
      sleep: async () => undefined,
    })

    await expect(client.request('/items', schema)).resolves.toEqual({ ok: true })
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('retains the unauthorized code for a non-JSON 401 body', async () => {
    const onUnauthorized = vi.fn()
    const fetchFn = vi.fn(async () => new Response('login required', { status: 401 }))
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetchFn,
      onUnauthorized,
    })

    await expect(client.request('/me', schema)).rejects.toMatchObject({
      code: 'unauthorized',
      status: 401,
    })
    expect(onUnauthorized).toHaveBeenCalledOnce()
    expect(fetchFn).toHaveBeenCalledOnce()
  })

  it('still classifies malformed JSON on success as validation', async () => {
    const fetchFn = vi.fn(async () => new Response('not-json', { status: 200 }))
    const client = createApiClient({ baseUrl: 'http://api.test', fetchFn })

    await expect(client.request('/items', schema)).rejects.toMatchObject({
      code: 'validation',
      status: 200,
    })
    expect(fetchFn).toHaveBeenCalledOnce()
  })

  it('cancels when the caller aborts', async () => {
    const controller = new AbortController()
    const fetchFn = vi.fn((_input: string | Request | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        const fail = () => {
          const error = new Error('aborted')
          error.name = 'AbortError'
          reject(error)
        }
        if (init?.signal?.aborted) {
          fail()
          return
        }
        init?.signal?.addEventListener('abort', fail, { once: true })
      })
    })
    const client = createApiClient({ baseUrl: 'http://api.test', fetchFn })
    const pending = client.request('/items', schema, { signal: controller.signal })
    controller.abort()
    await expect(pending).rejects.toSatisfy(
      (error: unknown) => isApiError(error) && error.code === 'aborted',
    )
  })

  it('turns a schema mismatch into a validation error', async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ ok: false }))
    const client = createApiClient({ baseUrl: 'http://api.test', fetchFn })
    await expect(client.request('/items', schema)).rejects.toMatchObject({ code: 'validation' })
  })

  it('sends the bearer token and reports unauthorized responses', async () => {
    const onUnauthorized = vi.fn()
    const fetchFn = vi.fn(async (_input: string | Request | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      expect(headers.get('authorization')).toBe('Bearer token-1')
      return jsonResponse({ message: 'expired' }, 401)
    })
    const client = createApiClient({
      baseUrl: 'http://api.test',
      fetchFn,
      getAccessToken: () => 'token-1',
      onUnauthorized,
    })

    await expect(client.request('/me', schema)).rejects.toMatchObject({ code: 'unauthorized' })
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it.each([
    'https://outside.test/collect',
    'http://api.test/collect',
    'data:text/plain,unexpected',
  ])('rejects API paths escaping the configured origin: %s', async (path) => {
    const getAccessToken = vi.fn(() => 'secret-token')
    const fetchFn = vi.fn(async () => jsonResponse({ ok: true }))
    const client = createApiClient({
      baseUrl: 'https://api.test/v1',
      getAccessToken,
      fetchFn,
    })

    await expect(client.request(path, schema)).rejects.toMatchObject({ code: 'validation' })
    expect(getAccessToken).not.toHaveBeenCalled()
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('permits an absolute URL on the configured origin', async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ ok: true }))
    const client = createApiClient({ baseUrl: 'https://api.test/v1', fetchFn })

    await expect(client.request('https://api.test/v1/items', schema)).resolves.toEqual({
      ok: true,
    })
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.test/v1/items',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('does not read credentials or fetch when already cancelled', async () => {
    const controller = new AbortController()
    controller.abort()
    const getAccessToken = vi.fn(() => 'token')
    const fetchFn = vi.fn(async () => jsonResponse({ ok: true }))
    const client = createApiClient({ baseUrl: 'http://api.test', getAccessToken, fetchFn })

    await expect(
      client.request('/items', schema, { signal: controller.signal, retry: false }),
    ).rejects.toMatchObject({ code: 'aborted' })
    expect(getAccessToken).not.toHaveBeenCalled()
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('cancels while credentials are still loading and never sends a late token', async () => {
    const controller = new AbortController()
    const token = deferred<string | null>()
    const started = deferred<void>()
    const fetchFn = vi.fn(async () => jsonResponse({ ok: true }))
    const client = createApiClient({
      baseUrl: 'http://api.test',
      getAccessToken: () => {
        started.resolve()
        return token.promise
      },
      fetchFn,
    })
    const pending = client.request('/items', schema, { signal: controller.signal, retry: false })
    const outcome = pending.then(
      () => 'success',
      (error: unknown) => (isApiError(error) ? error.code : 'unexpected'),
    )
    await started.promise
    controller.abort()
    try {
      expect(
        await Promise.race([
          outcome,
          new Promise((resolve) => setImmediate(() => resolve('pending'))),
        ]),
      ).toBe('aborted')
    } finally {
      token.resolve('late-token')
      await outcome
    }
    expect(fetchFn).not.toHaveBeenCalled()
  })

  it('times out stalled credential loading before sending a request', async () => {
    const token = deferred<string | null>()
    const fetchFn = vi.fn(async () => jsonResponse({ ok: true }))
    const client = createApiClient({
      baseUrl: 'http://api.test',
      getAccessToken: () => token.promise,
      fetchFn,
    })
    const outcome = client.request('/items', schema, { timeoutMs: 5, retry: false }).then(
      () => 'success',
      (error: unknown) => (isApiError(error) ? error.code : 'unexpected'),
    )
    const deadline = setTimeout(() => token.resolve('late-token'), 100)
    try {
      expect(await outcome).toBe('timeout')
      expect(fetchFn).not.toHaveBeenCalled()
    } finally {
      clearTimeout(deadline)
      token.resolve(null)
    }
  })
})
