// A 401 from a task request invalidates its cookie authorization, even if
// TanStack Query retains a previously successful, private task response.
export function isUnauthorizedTaskResponse(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'unauthorized'
}
