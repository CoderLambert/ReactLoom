import * as z from 'zod'
import { mutationRequestError } from '@/server/mutation-request'
import { privateJson } from '@/server/private-response'
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
  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
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
  const response = privateJson({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  return response
}

export async function GET() {
  const user = await readRequestSession()
  if (!user) return privateJson({ message: 'Sign in is required.' }, 401)
  return privateJson({ user })
}
