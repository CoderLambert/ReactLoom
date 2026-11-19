/** Keep opaque server-issued IDs within one WHATWG URL pathname segment. */
export function encodeTaskIdSegment(id: string): string {
  if (id.length === 0 || id === '.' || id === '..') {
    throw new Error('Task ID must identify one non-empty URL path segment.')
  }
  return encodeURIComponent(id)
}
