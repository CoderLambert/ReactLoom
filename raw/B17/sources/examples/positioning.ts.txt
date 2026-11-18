import { flip, offset, shift } from '@floating-ui/react'

// A deliberate local boundary in the basic experiment; other scenes use the viewport.
export function createPositionMiddleware(boundary?: Element) {
  const collision = { padding: 12, ...(boundary ? { boundary } : {}) }
  return [offset(10), flip({ ...collision, flipAlignment: false }), shift(collision)]
}
