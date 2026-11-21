import { ApiError } from '@reactloom/api-client'
import { describe, expect, it } from 'vitest'
import { isUnauthorizedTaskResponse } from './task-auth-error'

describe('task authorization failure detection', () => {
  it('requires re-authentication for expired-cookie task reads and writes', () => {
    expect(
      isUnauthorizedTaskResponse(new ApiError('Sign in required.', 'unauthorized', { status: 401 })),
    ).toBe(true)
  })

  it.each(['network', 'timeout', 'aborted', 'http', 'validation'] as const)(
    'preserves ordinary %s error handling without clearing the session',
    (code) => {
      expect(isUnauthorizedTaskResponse(new ApiError('Request failed.', code))).toBe(false)
    },
  )

  it('ignores non-API errors and malformed error-shaped values', () => {
    expect(isUnauthorizedTaskResponse(new Error('Bad response'))).toBe(false)
    expect(isUnauthorizedTaskResponse({ code: 'unauthorized' })).toBe(false)
    expect(isUnauthorizedTaskResponse(null)).toBe(false)
  })
})
