import { ApiError, isApiError } from './errors.js'

export type Schema<T> = {
  parse: (data: unknown) => T
}

export type ApiLogger = {
  debug: (message: string, extra?: Record<string, unknown>) => void
  warn: (message: string, extra?: Record<string, unknown>) => void
}

export type RetryPolicy = {
  attempts: number
  baseDelayMs: number
  maxDelayMs: number
}

export type ApiClientOptions = {
  baseUrl: string
  getAccessToken?: () => string | null | Promise<string | null>
  fetchFn?: typeof fetch
  credentials?: 'include' | 'omit' | 'same-origin'
  defaultTimeoutMs?: number
  retry?: Partial<RetryPolicy>
  onUnauthorized?: () => void
  logger?: ApiLogger
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>
}

export type RequestOptions = {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
  timeoutMs?: number
  retry?: number | false
}

const RETRY_STATUSES = new Set([408, 429, 500, 502, 503, 504])
const IDEMPOTENT = new Set(['GET', 'HEAD'])
const FORBIDDEN_METHODS = new Set(['CONNECT', 'TRACE', 'TRACK'])
const METHOD_TOKEN = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/
const MAX_RETRY_ATTEMPTS = 20
// Node timers lose their intended deadline beyond the signed 32-bit range.
const MAX_TIMER_MS = 2_147_483_647

function validateAttempts(value: number, allowZero = false): number {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1) || value > MAX_RETRY_ATTEMPTS) {
    throw new ApiError(
      `retry attempts must be an integer between ${allowZero ? 0 : 1} and ${MAX_RETRY_ATTEMPTS}.`,
      'validation',
    )
  }
  // Preserve request-level retry: 0 as one attempt (no retry).
  return Math.max(1, value)
}

function validateTimerMs(value: number, label: string, allowZero = false): number {
  if (!Number.isSafeInteger(value) || value < (allowZero ? 0 : 1) || value > MAX_TIMER_MS) {
    throw new ApiError(
      `${label} must be an integer between ${allowZero ? 0 : 1} and ${MAX_TIMER_MS} milliseconds.`,
      'validation',
    )
  }
  return value
}

const noopLogger: ApiLogger = {
  debug: () => undefined,
  warn: () => undefined,
}

function joinUrl(baseUrl: string, path: string): string {
  let base: URL
  let url: URL
  try {
    base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
    const relative = path.startsWith('/') ? path.slice(1) : path
    url = new URL(relative, base)
  } catch (cause) {
    // Malformed caller paths and configuration are input errors, not transport failures.
    throw new ApiError('Request URL is not valid.', 'validation', { cause })
  }

  // URL resolution accepts absolute URLs, which would otherwise send bearer
  // credentials to a caller-supplied host instead of the configured API.
  if (url.origin !== base.origin || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    throw new ApiError('Request URL must stay within the configured API origin.', 'validation')
  }
  return url.toString()
}

function serializeRequestBody(body: unknown): string | undefined {
  if (body === undefined) return undefined
  try {
    const serialized = JSON.stringify(body)
    if (serialized === undefined) {
      throw new TypeError('JSON serialization produced no request body.')
    }
    return serialized
  } catch (cause) {
    throw new ApiError('Request body must be JSON serializable.', 'validation', { cause })
  }
}

function validateRequestMethod(method: string, body: unknown): void {
  // Fetch rejects malformed/forbidden HTTP methods and GET/HEAD request bodies.
  // Report these as caller errors before reading credentials or starting retries.
  if (!METHOD_TOKEN.test(method) || FORBIDDEN_METHODS.has(method)) {
    throw new ApiError('Request method is not valid.', 'validation')
  }
  if (IDEMPOTENT.has(method) && body !== undefined) {
    throw new ApiError('GET and HEAD requests cannot have a body.', 'validation')
  }
}

function createRequestHeaders(init: RequestOptions): Headers {
  try {
    const headers = new Headers(init.headers)
    if (init.body !== undefined && !headers.has('content-type')) {
      headers.set('content-type', 'application/json')
    }
    return headers
  } catch (cause) {
    // Malformed names/values are caller input errors, not retryable network failures.
    throw new ApiError('Request headers are not valid.', 'validation', { cause })
  }
}

function defaultSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(toAbortError(signal))
      return
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(toAbortError(signal))
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

function toAbortError(signal: AbortSignal): ApiError {
  const reason: unknown = signal.reason
  if (isTimeoutReason(reason)) {
    return new ApiError('The request timed out.', 'timeout', { cause: reason })
  }
  return new ApiError('The request was cancelled.', 'aborted', { cause: reason })
}

function readAccessToken(
  getAccessToken: ApiClientOptions['getAccessToken'],
  signal: AbortSignal,
): Promise<string | null | undefined> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort)
      reject(toAbortError(signal))
    }
    if (signal.aborted) {
      onAbort()
      return
    }
    signal.addEventListener('abort', onAbort, { once: true })
    Promise.resolve()
      .then(() => {
        if (signal.aborted) throw toAbortError(signal)
        return getAccessToken?.()
      })
      .then(
        (token) => {
          signal.removeEventListener('abort', onAbort)
          if (signal.aborted) reject(toAbortError(signal))
          else resolve(token)
        },
        (error: unknown) => {
          signal.removeEventListener('abort', onAbort)
          reject(error)
        },
      )
  })
}

async function resolveAccessToken(
  getAccessToken: ApiClientOptions['getAccessToken'],
  signal: AbortSignal,
): Promise<string | null | undefined> {
  try {
    return await readAccessToken(getAccessToken, signal)
  } catch (cause) {
    if (signal.aborted) throw toAbortError(signal)
    // Unexpected credential-store errors are local failures. Retrying a GET
    // must not re-read a broken token provider as if the transport had failed.
    if (isApiError(cause)) throw cause
    throw new ApiError('Access token lookup failed.', 'validation', { cause })
  }
}

function awaitWithAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort)
      reject(toAbortError(signal))
    }
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })

    // Observe late adapter settlements without waiting for them after abort.
    // Native fetch and custom adapters need the same cancellation contract.
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort)
        if (signal.aborted) reject(toAbortError(signal))
        else resolve(value)
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort)
        if (signal.aborted) reject(toAbortError(signal))
        else reject(error)
      },
    )
  })
}

function isTimeoutReason(reason: unknown): boolean {
  return reason instanceof Error && (reason.name === 'TimeoutError' || reason.name === 'AbortError')
    ? reason.name === 'TimeoutError'
    : false
}

function normalizeTransportError(error: unknown, signal: AbortSignal): ApiError {
  if (isApiError(error)) return error
  if (signal.aborted) return toAbortError(signal)
  if (error instanceof Error && error.name === 'TimeoutError') {
    return new ApiError('The request timed out.', 'timeout', { cause: error })
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError('The request was cancelled.', 'aborted', { cause: error })
  }
  return new ApiError('The network request failed.', 'network', { cause: error })
}

function shouldRetry(error: unknown): boolean {
  if (!isApiError(error)) return false
  if (error.code === 'aborted' || error.code === 'validation' || error.code === 'unauthorized') {
    return false
  }
  if (error.code === 'timeout' || error.code === 'network') return true
  return error.code === 'http' && error.status !== undefined && RETRY_STATUSES.has(error.status)
}

function delayFor(attempt: number, policy: RetryPolicy, response?: Response): number {
  const header = response?.headers.get('retry-after')
  if (header) {
    const seconds = Number(header)
    if (Number.isFinite(seconds)) {
      if (seconds >= 0) return Math.ceil(Math.min(policy.maxDelayMs, seconds * 1000))
    } else {
      const retryAt = Date.parse(header)
      if (Number.isFinite(retryAt)) {
        return Math.min(policy.maxDelayMs, Math.max(0, retryAt - Date.now()))
      }
    }
  }
  const exp = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** attempt)
  return Math.round(exp * (0.5 + Math.random() * 0.5))
}

async function readBody(
  response: Response,
  signal: AbortSignal,
  allowPlainText = false,
): Promise<unknown> {
  if (response.status === 204) return null
  const text = await awaitWithAbort(response.text(), signal)
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch (cause) {
    // HTTP error bodies can be plain text or proxy-generated HTML. Preserve
    // the original status/code instead of misclassifying them as validation.
    if (allowPlainText) return text
    throw new ApiError('The response was not valid JSON.', 'validation', {
      status: response.status,
      details: text,
      cause,
    })
  }
}

async function readHttpErrorBody(response: Response, signal: AbortSignal): Promise<unknown> {
  try {
    return await readBody(response, signal, true)
  } catch {
    // The received HTTP status is authoritative even if an optional error
    // body stream fails. Explicit cancellation and timeout still take priority.
    if (signal.aborted) throw toAbortError(signal)
    return null
  }
}

function messageFromDetails(details: unknown, fallback: string): string {
  if (typeof details === 'object' && details !== null && 'message' in details) {
    const message = details.message
    if (typeof message === 'string' && message.length > 0) return message
  }
  return fallback
}

export function createApiClient(options: ApiClientOptions) {
  const fetchFn =
    options.fetchFn ??
    ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) =>
      globalThis.fetch(input, init))
  const logger = options.logger ?? noopLogger
  const sleep = options.sleep ?? defaultSleep
  // Diagnostic hooks must not change retries or replace the original API error.
  function warnRetry(message: string, extra: Record<string, unknown>): void {
    try {
      // Async loggers are valid implementations of void-returning callbacks.
      // Observe rejected promises without delaying the request/retry.
      const completion: unknown = logger.warn(message, extra)
      void Promise.resolve(completion).catch(() => undefined)
    } catch {
      // Application-provided loggers are best-effort observers.
    }
  }
  function warnUnauthorizedHandlerFailure(): void {
    try {
      const completion: unknown = logger.warn('Unauthorized handler failed')
      void Promise.resolve(completion).catch(() => undefined)
    } catch {
      // Diagnostics must never override the original unauthorized result.
    }
  }
  // Even without a caller signal, a noncooperative retry scheduler must not
  // keep the request pending forever. Allow the delay plus one attempt timeout.
  function waitForRetry(ms: number, signal: AbortSignal, timeoutMs: number): Promise<void> {
    const deadline = AbortSignal.timeout(Math.min(MAX_TIMER_MS, ms + timeoutMs))
    const retryWaitSignal = AbortSignal.any([signal, deadline])
    return awaitWithAbort(
      Promise.resolve().then(() => {
        if (retryWaitSignal.aborted) throw toAbortError(retryWaitSignal)
        return sleep(ms, retryWaitSignal)
      }),
      retryWaitSignal,
    )
  }

  const policy: RetryPolicy = {
    attempts: validateAttempts(options.retry?.attempts ?? 3),
    baseDelayMs: validateTimerMs(options.retry?.baseDelayMs ?? 200, 'baseDelayMs', true),
    maxDelayMs: validateTimerMs(options.retry?.maxDelayMs ?? 2_000, 'maxDelayMs', true),
  }
  const defaultTimeoutMs = validateTimerMs(options.defaultTimeoutMs ?? 8_000, 'defaultTimeoutMs')

  async function request<T>(
    path: string,
    schema: Schema<T>,
    init: RequestOptions = {},
  ): Promise<T> {
    const method = (init.method ?? 'GET').toUpperCase()
    const attempts =
      init.retry === false
        ? 1
        : typeof init.retry === 'number'
          ? validateAttempts(init.retry, true)
          : IDEMPOTENT.has(method)
            ? policy.attempts
            : 1
    const timeoutMs = validateTimerMs(init.timeoutMs ?? defaultTimeoutMs, 'timeoutMs')

    const retrySignal = init.signal ?? new AbortController().signal
    if (retrySignal.aborted) throw toAbortError(retrySignal)
    validateRequestMethod(method, init.body)
    const serializedBody = serializeRequestBody(init.body)
    const requestHeaders = createRequestHeaders(init)
    let lastError: ApiError | undefined
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const timeoutSignal = AbortSignal.timeout(timeoutMs)
      const signals = [timeoutSignal, init.signal].filter((signal): signal is AbortSignal =>
        Boolean(signal),
      )
      const signal = signals.length === 1 ? signals[0] : AbortSignal.any(signals)
      if (!signal) {
        throw new ApiError('Failed to create a request signal.', 'aborted')
      }

      const url = joinUrl(options.baseUrl, path)
      let waitingForRetry = false
      try {
        const token = await resolveAccessToken(options.getAccessToken, signal)
        if (signal.aborted) throw toAbortError(signal)
        const headers = new Headers(requestHeaders)
        if (token) {
          try {
            headers.set('authorization', `Bearer ${token}`)
          } catch (cause) {
            throw new ApiError('Access token is not a valid header value.', 'validation', { cause })
          }
        }

        const response = await awaitWithAbort(
          fetchFn(url, {
            method,
            headers,
            body: serializedBody,
            signal,
            credentials: options.credentials ?? 'same-origin',
            // A redirect is a new network request. Never let Fetch automatically
            // forward authenticated requests (or ambient cookies) to its target.
            redirect: 'manual',
          }),
          signal,
        )

        // Custom fetch adapters may settle after cancellation. Never let a stale
        // response trigger onUnauthorized or resolve as a successful request.
        if (signal.aborted) throw toAbortError(signal)

        // Browsers expose manual redirects as opaque responses; Node and some
        // adapters expose the 3xx status. Reject both, and also reject adapters
        // that ignored redirect: 'manual' and followed a redirect anyway.
        if (
          response.type === 'opaqueredirect' ||
          response.redirected ||
          (response.status >= 300 && response.status < 400)
        ) {
          throw new ApiError('API redirects are not allowed.', 'validation', {
            status: response.status,
          })
        }

        if (response.status === 401) {
          const details = await readHttpErrorBody(response, signal)
          // A custom fetch adapter may finish the headers before the body.
          // Do not invalidate a newer session if cancellation wins the body read.
          if (signal.aborted) throw toAbortError(signal)
          try {
            // Async functions are assignable to void-returning callbacks.
            // Observe their rejections without waiting to report the 401.
            const completion: unknown = options.onUnauthorized?.()
            void Promise.resolve(completion).catch(warnUnauthorizedHandlerFailure)
          } catch {
            warnUnauthorizedHandlerFailure()
          }
          throw new ApiError(messageFromDetails(details, 'Sign in is required.'), 'unauthorized', {
            status: 401,
            details,
          })
        }

        if (!response.ok) {
          const details = await readHttpErrorBody(response, signal)
          if (signal.aborted) throw toAbortError(signal)
          const error = new ApiError(
            messageFromDetails(details, `Request failed with status ${response.status}.`),
            'http',
            { status: response.status, details },
          )
          if (attempt < attempts - 1 && shouldRetry(error)) {
            warnRetry('Retrying failed request', {
              method,
              status: response.status,
              attempt,
            })
            waitingForRetry = true
            await waitForRetry(delayFor(attempt, policy, response), retrySignal, timeoutMs)
            waitingForRetry = false
            lastError = error
            continue
          }
          throw error
        }

        const payload = await readBody(response, signal)
        if (signal.aborted) throw toAbortError(signal)
        try {
          return schema.parse(payload)
        } catch (cause) {
          throw new ApiError('The response did not match the expected shape.', 'validation', {
            status: response.status,
            details: cause,
            cause,
          })
        }
      } catch (error) {
        const normalized = normalizeTransportError(error, signal)
        // A failed backoff is not another failed transport request to retry.
        if (waitingForRetry) throw normalized
        if (attempt < attempts - 1 && shouldRetry(normalized)) {
          warnRetry('Retrying transport failure', {
            method,
            code: normalized.code,
            attempt,
          })
          await waitForRetry(delayFor(attempt, policy), retrySignal, timeoutMs)
          lastError = normalized
          continue
        }
        throw normalized
      }
    }

    throw lastError ?? new ApiError('The request failed.', 'network')
  }

  return { request }
}

export type ApiClient = ReturnType<typeof createApiClient>
