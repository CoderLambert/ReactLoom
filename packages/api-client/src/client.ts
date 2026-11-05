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

const noopLogger: ApiLogger = {
  debug: () => undefined,
  warn: () => undefined,
}

function joinUrl(baseUrl: string, path: string): string {
  const base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`)
  const relative = path.startsWith('/') ? path.slice(1) : path
  const url = new URL(relative, base)

  // URL resolution accepts absolute URLs, which would otherwise send bearer
  // credentials to a caller-supplied host instead of the configured API.
  if (url.origin !== base.origin || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
    throw new ApiError('Request URL must stay within the configured API origin.', 'validation')
  }
  return url.toString()
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
      if (seconds >= 0) return Math.min(policy.maxDelayMs, seconds * 1000)
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

async function readBody(response: Response, allowPlainText = false): Promise<unknown> {
  if (response.status === 204) return null
  const text = await response.text()
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
  const policy: RetryPolicy = {
    attempts: options.retry?.attempts ?? 3,
    baseDelayMs: options.retry?.baseDelayMs ?? 200,
    maxDelayMs: options.retry?.maxDelayMs ?? 2_000,
  }

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
          ? Math.max(1, init.retry)
          : IDEMPOTENT.has(method)
            ? policy.attempts
            : 1

    let lastError: ApiError | undefined
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const timeoutSignal = AbortSignal.timeout(init.timeoutMs ?? options.defaultTimeoutMs ?? 8_000)
      const signals = [timeoutSignal, init.signal].filter((signal): signal is AbortSignal =>
        Boolean(signal),
      )
      const signal = signals.length === 1 ? signals[0] : AbortSignal.any(signals)
      if (!signal) {
        throw new ApiError('Failed to create a request signal.', 'aborted')
      }

      const url = joinUrl(options.baseUrl, path)
      try {
        const token = await readAccessToken(options.getAccessToken, signal)
        if (signal.aborted) throw toAbortError(signal)
        const headers = new Headers(init.headers)
        if (init.body !== undefined && !headers.has('content-type')) {
          headers.set('content-type', 'application/json')
        }
        if (token) headers.set('authorization', `Bearer ${token}`)

        const response = await fetchFn(url, {
          method,
          headers,
          body: init.body === undefined ? undefined : JSON.stringify(init.body),
          signal,
          credentials: options.credentials ?? 'same-origin',
        })

        // Custom fetch adapters may settle after cancellation. Never let a stale
        // response trigger onUnauthorized or resolve as a successful request.
        if (signal.aborted) throw toAbortError(signal)

        if (response.status === 401) {
          options.onUnauthorized?.()
          const details = await readBody(response, true)
          throw new ApiError(messageFromDetails(details, 'Sign in is required.'), 'unauthorized', {
            status: 401,
            details,
          })
        }

        if (!response.ok) {
          const details = await readBody(response, true)
          const error = new ApiError(
            messageFromDetails(details, `Request failed with status ${response.status}.`),
            'http',
            { status: response.status, details },
          )
          if (attempt < attempts - 1 && shouldRetry(error)) {
            logger.warn('Retrying failed request', {
              path,
              method,
              status: response.status,
              attempt,
            })
            await sleep(
              delayFor(attempt, policy, response),
              init.signal ?? new AbortController().signal,
            )
            lastError = error
            continue
          }
          throw error
        }

        const payload = await readBody(response)
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
        if (attempt < attempts - 1 && shouldRetry(normalized)) {
          logger.warn('Retrying transport failure', {
            path,
            method,
            code: normalized.code,
            attempt,
          })
          await sleep(delayFor(attempt, policy), init.signal ?? new AbortController().signal)
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
