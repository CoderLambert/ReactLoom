import { createElement } from 'react'

// Translation attributes may override mapped component props.
// This source-owned component forwards only children, never translated attributes.
export function SafeEmphasis({ children }) {
  return createElement('strong', { 'data-testid': 'c18-emphasis' }, children)
}
