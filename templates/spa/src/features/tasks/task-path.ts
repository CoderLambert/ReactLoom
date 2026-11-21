// A server-issued task ID is an opaque URL path segment, not a path or query.
// WHATWG URL resolution also normalizes bare '.' and '..' segments.
export function taskResourcePath(id: string): string {
  if (!id || id === '.' || id === '..') {
    throw new Error('Invalid task ID.')
  }
  return `/api/tasks/${encodeURIComponent(id)}`
}
