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
