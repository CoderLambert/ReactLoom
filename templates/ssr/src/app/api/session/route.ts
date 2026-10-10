import { NextResponse } from 'next/server'
import * as z from 'zod'
import { readRequestSession } from '@/server/session'
import { SESSION_COOKIE, sessionCookieOptions, signSession } from '@/server/session-token'
import { authenticate } from '@/server/tasks'

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ message: 'Enter a valid email and password.' }, { status: 400 })
  }
  const user = authenticate(parsed.data.email, parsed.data.password)
  if (!user) {
    return NextResponse.json({ message: 'Those credentials were not recognized.' }, { status: 401 })
  }
  const token = await signSession(user)
  const response = NextResponse.json({ user })
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions())
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 })
  return response
}

export async function GET() {
  const user = await readRequestSession()
  if (!user) return NextResponse.json({ message: 'Sign in is required.' }, { status: 401 })
  return NextResponse.json({ user })
}
