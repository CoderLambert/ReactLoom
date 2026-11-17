// Cookie mutations accept the app's exact origin, not sibling subdomains.
export function mutationRequestError(request: Request, expectsJson = false): Response | null {
  const origin = request.headers.get('origin')
  const site = request.headers.get('sec-fetch-site')
  const forbidden = () => Response.json({ message: 'Untrusted request origin.' }, { status: 403 })

  if (site === 'cross-site' || (site === 'same-site' && origin === null)) return forbidden()

  if (origin !== null) {
    try {
      const source = new URL(origin)
      const target = new URL(request.url)
      const host = request.headers.get('host')
      if (host !== null && (!host || /[/\\?#@,\s]/.test(host))) return forbidden()
      // Next may expose its bind address in request.url. Host is the HTTP target;
      // forwarded-host is deliberately ignored because a client can supply it.
      const targetOrigin =
        host === null ? target.origin : new URL(`${target.protocol}//${host}`).origin
      if (
        (source.protocol !== 'https:' && source.protocol !== 'http:') ||
        origin !== source.origin ||
        source.origin !== targetOrigin
      ) {
        return forbidden()
      }
    } catch {
      return forbidden()
    }
  }

  // Trusted non-browser clients may omit Origin; browser forms cannot send JSON.
  if (expectsJson) {
    const mediaType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
    if (mediaType !== 'application/json') {
      return Response.json({ message: 'Send an application/json body.' }, { status: 415 })
    }
  }
  return null
}

// A task write initiated under an older tab's verified identity must not run
// under a replacement cookie. Clients without this opt-in header keep the
// existing API contract; the SSR task UI always sends it.
export const EXPECTED_TASK_OWNER_HEADER = 'x-reactloom-expected-task-owner'

export function taskMutationSessionError(
  request: Request,
  authenticatedUserId: string,
): Response | null {
  const expectedOwner = request.headers.get(EXPECTED_TASK_OWNER_HEADER)
  if (expectedOwner === null || expectedOwner === authenticatedUserId) return null
  return Response.json(
    { message: 'The signed-in account changed. Please sign in again.' },
    { status: 409, headers: { 'Cache-Control': 'private, no-store' } },
  )
}

// Opt-in, identity-bound sign-out: do not expire the cookie of a user who
// replaced the initiating tab's session. An absent current session is already
// signed out; do not send a stale Set-Cookie that could erase a newer login.
export const EXPECTED_SESSION_OWNER_HEADER = 'x-reactloom-expected-session-owner'

export function sessionLogoutDecision(
  request: Request,
  authenticatedUserId: string | null,
): 'logout' | 'already-signed-out' | 'changed-account' {
  const expectedOwner = request.headers.get(EXPECTED_SESSION_OWNER_HEADER)
  if (expectedOwner === null) return 'logout' // Retain legacy API callers.
  if (authenticatedUserId === null) return 'already-signed-out'
  return expectedOwner === authenticatedUserId ? 'logout' : 'changed-account'
}
