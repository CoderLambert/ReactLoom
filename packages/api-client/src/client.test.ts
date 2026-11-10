import { createServer } from 'node:http'
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

  it.each([Number.NaN, Infinity, -Infinity, -1, 1.5, 21])(
    'rejects invalid per-request retry count %s before reading credentials or fetching',
    async (retry) => {
      const getAccessToken = vi.fn(() => 'secret-token')
      const fetchFn = vi.fn(async () => jsonResponse({ ok: true }))
      const client = createApiClient({ baseUrl: 'https://api.test', getAccessToken, fetchFn })

      await expect(client.request('/items', schema, { retry })).rejects.toMatchObject({
        code: 'validation',
      })
      expect(getAccessToken).not.toHaveBeenCalled()
      expect(fetchFn).not.toHaveBeenCalled()
    },
  )

  it.each([Number.NaN, Infinity, -Infinity, -1, 0, 1.5, 2_147_483_648])(
    'rejects invalid request timeout %s before fetching',
    async (timeoutMs) => {
      const fetchFn = vi.fn(async () => jsonResponse({ ok: true }))
      const client = createApiClient({ baseUrl: 'https://api.test', fetchFn })

      await expect(client.request('/items', schema, { timeoutMs })).rejects.toMatchObject({
        code: 'validation',
      })
      expect(fetchFn).not.toHaveBeenCalled()
    },
  )

  it.each([
    ['nonfinite policy attempts', { retry: { attempts: Infinity } }],
    ['fractional policy attempts', { retry: { attempts: 1.5 } }],
    ['too many policy attempts', { retry: { attempts: 21 } }],
    ['negative base delay', { retry: { baseDelayMs: -1 } }],
    ['nonfinite maximum delay', { retry: { maxDelayMs: Number.NaN } }],
    ['oversized maximum delay', { retry: { maxDelayMs: 2_147_483_648 } }],
    ['nonfinite default timeout', { defaultTimeoutMs: Infinity }],
    ['zero default timeout', { defaultTimeoutMs: 0 }],
  ] as const)('rejects invalid client configuration: %s', (_label, invalid) => {
    expect(() => createApiClient({ baseUrl: 'https://api.test', ...invalid })).toThrowError(
      /must be an integer|retry attempts must be an integer/,
    )
  })

  it('retains one attempt for request retry: 0 and permits zero retry delay', async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ message: 'busy' }, 503))
    const client = createApiClient({
      baseUrl: 'https://api.test',
      fetchFn,
      retry: { baseDelayMs: 0, maxDelayMs: 0 },
    })

    await expect(client.request('/items', schema, { retry: 0 })).rejects.toMatchObject({
      code: 'http',
      status: 503,
    })
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

  it.each([
    ['0.0001', 1],
    ['0.0015', 2],
  ])('rounds fractional Retry-After %s up before retry', async (header, expectedMs) => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': header }),
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
    expect(sleep).toHaveBeenCalledWith(expectedMs, expect.any(AbortSignal))
    expect(fetchFn).toHaveBeenCalledTimes(2)
  })

  it('ignores negative Retry-After seconds instead of scheduling a negative delay', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(1)
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': '-5' }),
      )
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
      .mockResolvedValueOnce(
        jsonResponse({ message: 'rate limited' }, 429, { 'retry-after': '30' }),
      )
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

  it.each([false, true])(
    'preserves HTTP 401 when the unauthorized callback throws (logger throws: %s)',
    async (loggerThrows) => {
      const onUnauthorized = vi.fn(() => {
        throw new Error('UI callback failed')
      })
      const warn = vi.fn(() => {
        if (loggerThrows) throw new Error('Logger failed')
      })
      const fetchFn = vi.fn(async () => jsonResponse({ message: 'expired' }, 401))
      const client = createApiClient({
        baseUrl: 'https://api.test',
        fetchFn,
        onUnauthorized,
        logger: { debug: vi.fn(), warn },
        sleep: async () => undefined,
      })

      await expect(client.request('/me', schema)).rejects.toMatchObject({
        code: 'unauthorized',
        status: 401,
        message: 'expired',
      })
      expect(fetchFn).toHaveBeenCalledOnce()
      expect(onUnauthorized).toHaveBeenCalledOnce()
      expect(warn).toHaveBeenCalledOnce()
      expect(warn).toHaveBeenCalledWith('Unauthorized handler failed')
    },
  )

  it.each(['http', 'network'] as const)(
    'retries %s failures even when the diagnostic logger throws',
    async (kind) => {
      const warn = vi.fn(() => {
        throw new Error('logging backend unavailable')
      })
      const fetchFn = vi.fn<typeof fetch>()
      if (kind === 'http') {
        fetchFn.mockResolvedValueOnce(jsonResponse({ message: 'busy' }, 503))
      } else {
        fetchFn.mockRejectedValueOnce(new TypeError('offline'))
      }
      fetchFn.mockResolvedValueOnce(jsonResponse({ ok: true }))
      const client = createApiClient({
        baseUrl: 'https://api.test',
        fetchFn,
        logger: { debug: vi.fn(), warn },
        sleep: async () => undefined,
      })

      await expect(client.request('/items', schema)).resolves.toEqual({ ok: true })
      expect(fetchFn).toHaveBeenCalledTimes(2)
      expect(warn).toHaveBeenCalledOnce()
    },
  )

  it.each(['http', 'network'] as const)(
    'keeps raw URL secrets out of %s retry diagnostics',
    async (kind) => {
      const warn = vi.fn()
      const fetchFn = vi.fn<typeof fetch>()
      if (kind === 'http') {
        fetchFn.mockResolvedValueOnce(jsonResponse({ message: 'busy' }, 503))
      } else {
        fetchFn.mockRejectedValueOnce(new TypeError('offline'))
      }
      fetchFn.mockResolvedValueOnce(jsonResponse({ ok: true }))
      const client = createApiClient({
        baseUrl: 'https://api.test',
        fetchFn,
        logger: { debug: vi.fn(), warn },
        sleep: async () => undefined,
      })
      const path = '/users/private-id?access_token=secret-query#secret-fragment'

      await expect(client.request(path, schema)).resolves.toEqual({ ok: true })
      expect(fetchFn).toHaveBeenCalledTimes(2)
      expect(warn).toHaveBeenCalledOnce()
      const details =
        kind === 'http'
          ? { method: 'GET', status: 503, attempt: 0 }
          : { method: 'GET', code: 'network', attempt: 0 }
      expect(warn).toHaveBeenCalledWith(
        kind === 'http' ? 'Retrying failed request' : 'Retrying transport failure',
        details,
      )
      expect(JSON.stringify(warn.mock.calls)).not.toContain('secret-query')
      expect(JSON.stringify(warn.mock.calls)).not.toContain('private-id')
    },
  )

  it('still classifies malformed JSON on success as validation', async () => {
    const fetchFn = vi.fn(async () => new Response('not-json', { status: 200 }))
    const client = createApiClient({ baseUrl: 'http://api.test', fetchFn })

    await expect(client.request('/items', schema)).rejects.toMatchObject({
      code: 'validation',
      status: 200,
    })
    expect(fetchFn).toHaveBeenCalledOnce()
  })

  it.each([401, 200])(
    'ignores a late %i response when a custom fetch resolves after cancellation',
    async (status) => {
      const controller = new AbortController()
      const onUnauthorized = vi.fn()
      const fetchFn = vi.fn(async () => {
        // This adapter intentionally ignores the abort signal and settles late.
        controller.abort()
        return jsonResponse(status === 401 ? { message: 'expired' } : { ok: true }, status)
      })
      const client = createApiClient({
        baseUrl: 'https://api.test',
        fetchFn,
        onUnauthorized,
      })

      await expect(
        client.request('/items', schema, { signal: controller.signal }),
      ).rejects.toMatchObject({ code: 'aborted' })
      expect(fetchFn).toHaveBeenCalledOnce()
      expect(onUnauthorized).not.toHaveBeenCalled()
    },
  )

  it.each([401, 200])(
    'discards a %i response when the request is cancelled during body reading',
    async (status) => {
      const controller = new AbortController()
      const bodyStarted = deferred<void>()
      const body = deferred<string>()
      const onUnauthorized = vi.fn()
      const parse = vi.fn(schema.parse)
      const responseBody = status === 401 ? { message: 'expired' } : { ok: true }
      const response = jsonResponse(responseBody, status)
      vi.spyOn(response, 'text').mockImplementation(() => {
        bodyStarted.resolve()
        return body.promise
      })
      const fetchFn = vi.fn(async () => response)
      const client = createApiClient({ baseUrl: 'https://api.test', fetchFn, onUnauthorized })

      const pending = client.request('/items', { parse }, { signal: controller.signal })
      await bodyStarted.promise
      controller.abort()
      body.resolve(JSON.stringify(responseBody))

      await expect(pending).rejects.toMatchObject({ code: 'aborted' })
      expect(fetchFn).toHaveBeenCalledOnce()
      expect(onUnauthorized).not.toHaveBeenCalled()
      expect(parse).not.toHaveBeenCalled()
    },
  )

  it('settles immediately on cancellation when a custom fetch never resolves', async () => {
    const controller = new AbortController()
    const started = deferred<void>()
    const lateResponse = deferred<Response>()
    const onUnauthorized = vi.fn()
    const fetchFn = vi.fn(() => {
      started.resolve()
      return lateResponse.promise
    })
    const client = createApiClient({ baseUrl: 'https://api.test', fetchFn, onUnauthorized })
    const pending = client.request('/items', schema, { signal: controller.signal }).then(
      () => 'success',
      (error: unknown) => (isApiError(error) ? error.code : 'unexpected'),
    )

    await started.promise
    controller.abort()
    try {
      expect(
        await Promise.race([
          pending,
          new Promise<string>((resolve) => setImmediate(() => resolve('pending'))),
        ]),
      ).toBe('aborted')
      expect(onUnauthorized).not.toHaveBeenCalled()
    } finally {
      lateResponse.resolve(jsonResponse({ message: 'expired' }, 401))
      await pending
    }
    expect(fetchFn).toHaveBeenCalledOnce()
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it.each([401, 200])(
    'settles immediately on cancellation while a %i response body remains pending',
    async (status) => {
      const controller = new AbortController()
      const started = deferred<void>()
      const lateBody = deferred<string>()
      const onUnauthorized = vi.fn()
      const parse = vi.fn(schema.parse)
      const response = jsonResponse(status === 401 ? { message: 'expired' } : { ok: true }, status)
      vi.spyOn(response, 'text').mockImplementation(() => {
        started.resolve()
        return lateBody.promise
      })
      const fetchFn = vi.fn(async () => response)
      const client = createApiClient({ baseUrl: 'https://api.test', fetchFn, onUnauthorized })
      const pending = client.request('/items', { parse }, { signal: controller.signal }).then(
        () => 'success',
        (error: unknown) => (isApiError(error) ? error.code : 'unexpected'),
      )

      await started.promise
      controller.abort()
      try {
        expect(
          await Promise.race([
            pending,
            new Promise<string>((resolve) => setImmediate(() => resolve('pending'))),
          ]),
        ).toBe('aborted')
        expect(onUnauthorized).not.toHaveBeenCalled()
        expect(parse).not.toHaveBeenCalled()
      } finally {
        lateBody.resolve(JSON.stringify(status === 401 ? { message: 'expired' } : { ok: true }))
        await pending
      }
    },
  )

  it('times out while a custom response body remains pending', async () => {
    const started = deferred<void>()
    const lateBody = deferred<string>()
    const response = jsonResponse({ ok: true })
    vi.spyOn(response, 'text').mockImplementation(() => {
      started.resolve()
      return lateBody.promise
    })
    const client = createApiClient({
      baseUrl: 'https://api.test',
      fetchFn: vi.fn(async () => response),
    })
    const pending = client.request('/items', schema, { retry: false, timeoutMs: 200 }).then(
      () => 'success',
      (error: unknown) => (isApiError(error) ? error.code : 'unexpected'),
    )

    try {
      await started.promise
      expect(
        await Promise.race([
          pending,
          new Promise<string>((resolve) => setTimeout(() => resolve('pending'), 2_000)),
        ]),
      ).toBe('timeout')
    } finally {
      lateBody.resolve(JSON.stringify({ ok: true }))
      await pending
    }
  })

  it.each(['http', 'network'] as const)(
    'cancels non-cooperative retry backoff after %s failure',
    async (kind) => {
      const controller = new AbortController()
      const sleepStarted = deferred<void>()
      const releaseSleep = deferred<void>()
      const sleep = vi.fn((_ms: number, _signal: AbortSignal) => {
        sleepStarted.resolve()
        return releaseSleep.promise
      })
      const fetchFn = vi.fn(async () => {
        if (kind === 'network') throw new Error('offline')
        return jsonResponse({ message: 'temporarily unavailable' }, 503)
      })
      const client = createApiClient({ baseUrl: 'https://api.test', fetchFn, sleep })
      const pending = client.request('/items', schema, { signal: controller.signal }).then(
        () => 'success',
        (error: unknown) => (isApiError(error) ? error.code : 'unexpected'),
      )

      await sleepStarted.promise
      controller.abort()
      try {
        expect(
          await Promise.race([
            pending,
            new Promise<string>((resolve) => setImmediate(() => resolve('pending'))),
          ]),
        ).toBe('aborted')
        expect(fetchFn).toHaveBeenCalledOnce()
      } finally {
        releaseSleep.resolve()
        await pending
      }
      expect(sleep).toHaveBeenCalledOnce()
      expect(sleep).toHaveBeenCalledWith(expect.any(Number), expect.any(AbortSignal))
      expect(sleep.mock.calls[0]?.[1]?.aborted).toBe(true)
    },
  )

  it.each(['http', 'network'] as const)(
    'bounds a stalled %s retry scheduler even without a caller signal',
    async (kind) => {
      const started = deferred<void>()
      const releaseSleep = deferred<void>()
      const sleep = vi.fn((_ms: number, _signal: AbortSignal) => {
        started.resolve()
        // This scheduler intentionally ignores the supplied AbortSignal.
        return releaseSleep.promise
      })
      const fetchFn = vi.fn(async () => {
        if (kind === 'network') throw new Error('offline')
        return jsonResponse({ message: 'temporarily unavailable' }, 503)
      })
      const client = createApiClient({
        baseUrl: 'https://api.test',
        fetchFn,
        sleep,
        defaultTimeoutMs: 200,
        retry: { baseDelayMs: 0, maxDelayMs: 0 },
      })
      const pending = client.request('/items', schema).then(
        () => 'success',
        (error: unknown) => (isApiError(error) ? error.code : 'unexpected'),
      )

      await started.promise
      let timeout: ReturnType<typeof setTimeout> | undefined
      try {
        expect(
          await Promise.race([
            pending,
            new Promise<string>((resolve) => {
              timeout = setTimeout(() => resolve('pending'), 1_000)
            }),
          ]),
        ).toBe('timeout')
        expect(fetchFn).toHaveBeenCalledOnce()
        expect(sleep).toHaveBeenCalledOnce()
        expect(sleep.mock.calls[0]?.[1]?.aborted).toBe(true)
      } finally {
        if (timeout) clearTimeout(timeout)
        releaseSleep.resolve()
        await pending
      }
    },
  )

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

  it('prevents a real cross-origin redirect from making another authenticated request', async () => {
    let destinationHits = 0
    let originHits = 0
    let originAuthorization: string | undefined
    const destination = createServer((_request, response) => {
      destinationHits += 1
      response.writeHead(200, { 'content-type': 'application/json' })
      response.end('{"ok":true}')
    })
    const origin = createServer((request, response) => {
      originHits += 1
      originAuthorization = request.headers.authorization
      const address = destination.address()
      if (!address || typeof address === 'string') {
        response.writeHead(500)
        response.end()
        return
      }
      response.writeHead(307, { location: `http://127.0.0.1:${address.port}/collect` })
      response.end()
    })

    try {
      await new Promise<void>((resolve) => destination.listen(0, '127.0.0.1', resolve))
      await new Promise<void>((resolve) => origin.listen(0, '127.0.0.1', resolve))
      const address = origin.address()
      if (!address || typeof address === 'string') throw new Error('Origin fixture failed to bind')
      const client = createApiClient({
        baseUrl: `http://127.0.0.1:${address.port}`,
        getAccessToken: () => 'private-token',
        credentials: 'include',
      })

      await expect(client.request('/redirect', schema)).rejects.toMatchObject({
        code: 'validation',
        status: 307,
      })
      expect(originHits).toBe(1)
      expect(originAuthorization).toBe('Bearer private-token')
      expect(destinationHits).toBe(0)
    } finally {
      origin.closeAllConnections()
      destination.closeAllConnections()
      await Promise.all(
        [origin, destination]
          .filter((server) => server.listening)
          .map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
      )
    }
  })

  it.each(['opaqueredirect', 'redirected'] as const)(
    'rejects %s results from a custom fetch adapter instead of parsing them',
    async (kind) => {
      const response = jsonResponse({ ok: true })
      if (kind === 'opaqueredirect') {
        Object.defineProperty(response, 'type', { value: 'opaqueredirect' })
      } else {
        Object.defineProperty(response, 'redirected', { value: true })
      }
      const fetchFn = vi.fn(async () => response)
      const parse = vi.fn(schema.parse)
      const client = createApiClient({ baseUrl: 'https://api.test', fetchFn })

      await expect(client.request('/items', { parse })).rejects.toMatchObject({
        code: 'validation',
      })
      expect(fetchFn).toHaveBeenCalledOnce()
      expect(fetchFn).toHaveBeenCalledWith(
        'https://api.test/items',
        expect.objectContaining({ redirect: 'manual' }),
      )
      expect(parse).not.toHaveBeenCalled()
    },
  )

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
