import { describe, expect, it } from 'vitest'
import { requiredHeaderNames, securityHeaders } from './security-headers'

describe('security headers', () => {
  it('includes the baseline response headers', () => {
    const names = securityHeaders.map((header) => header.key)
    for (const name of requiredHeaderNames) {
      expect(names).toContain(name)
    }
  })
})
