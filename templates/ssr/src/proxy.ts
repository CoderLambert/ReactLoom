import { type NextRequest, NextResponse } from 'next/server'

const publicPaths = new Set(['/', '/login', '/api/session'])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(request.cookies.get('rl_session')?.value)
  const isPublic = publicPaths.has(pathname) || pathname.startsWith('/api/session')

  if (!isPublic && pathname.startsWith('/tasks') && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-request-id', crypto.randomUUID())
  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('x-request-id', requestHeaders.get('x-request-id') ?? '')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.svg).*)'],
}
