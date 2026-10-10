export type ApiErrorCode =
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'http'
  | 'validation'
  | 'unauthorized'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number | undefined
  readonly details: unknown

  constructor(
    message: string,
    code: ApiErrorCode,
    options?: { status?: number; details?: unknown; cause?: unknown },
  ) {
    super(message, options?.cause === undefined ? undefined : { cause: options.cause })
    this.name = 'ApiError'
    this.code = code
    this.status = options?.status
    this.details = options?.details
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
