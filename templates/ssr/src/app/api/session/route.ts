import * as z from 'zod'
import {
  EXPECTED_SESSION_OWNER_HEADER,
  mutationRequestError,
  sessionLogoutDecision,
} from '@/server/mutation-request'
import { privateJson } from '@/server/private-response'
import { readMutationJson } from '@/server/mutation-json'
import { readRequestSession } from '@/server/session'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/server/session-token'
import { authenticate } from '@/server/tasks'

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  const error = mutationRequestError(request, true)
  if (error) return error
  const body = await readMutationJson(request)
  if (!body.ok && body.tooLarge) {
    return privateJson({ message: 'Request body is too large.' }, 413)
  }
  const parsed = loginSchema.safeParse(body.ok ? body.data : null)
  if (!parsed.success) {
    return privateJson({ message: 'Enter a valid email and password.' }, 400)
  }
  const user = authenticate(parsed.data.email, parsed.data.password)
  if (!user) {
    return privateJson({ message: 'Those credentials were not recognized.' }, 401)
  }
  const token = await signSession(user)
  const response = privateJson({ user })
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
  return response
}

export async function DELETE(request: Request) {
  const error = mutationRequestError(request)
  if (error) return error
  if (request.headers.has(EXPECTED_SESSION_OWNER_HEADER)) {
    const user = await readRequestSession()
    const decision = sessionLogoutDecision(request, user?.id ?? null)
    if (decision === 'changed-account') {
      return privateJson({ message: 'The signed-in account changed. Sign out again to confirm.' }, 409)
    }
    // No session was authenticated when this request arrived. Sending an
    // expiry Set-Cookie could erase a newer login completed in another tab.
    if (decision === 'already-signed-out') return privateJson({ ok: true })
  }
  const response = privateJson({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  return response
}

export async function GET() {
  const user = await readRequestSession()
  if (!user) return privateJson({ message: 'Sign in is required.' }, 401)
  return privateJson({ user })
}
