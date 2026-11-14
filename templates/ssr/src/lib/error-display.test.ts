import { describe, expect, it } from 'vitest'
import { errorMessageForDisplay, GENERIC_ERROR_MESSAGE } from './error-display'

describe('error boundary message privacy', () => {
  const sensitive = new Error('Session request failed: Authorization Bearer super-secret-token')

  it('does not display the original client error message in production', () => {
    const message = errorMessageForDisplay(sensitive, 'production')
    expect(message).toBe(GENERIC_ERROR_MESSAGE)
    expect(message).not.toContain('super-secret-token')
  })

  it('never stringifies a thrown object in the production UI', () => {
    const unsafe = { toString: () => 'session-token=private' }
    expect(errorMessageForDisplay(unsafe, 'production')).toBe(GENERIC_ERROR_MESSAGE)
  })

  it('keeps diagnostic detail available outside production', () => {
    expect(errorMessageForDisplay(sensitive, 'development')).toBe(sensitive.message)
  })

  it('uses a safe fallback for non-Error throws even in development', () => {
    expect(errorMessageForDisplay(null, 'development')).toBe(GENERIC_ERROR_MESSAGE)
    expect(errorMessageForDisplay({ secret: 'private' }, 'development')).toBe(
      GENERIC_ERROR_MESSAGE,
    )
  })
})
