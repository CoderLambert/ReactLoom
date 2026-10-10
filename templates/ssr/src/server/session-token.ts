import { jwtVerify, SignJWT } from 'jose'
import { assertProductionSecret, env } from '@/server/env'

export const SESSION_COOKIE = 'rl_session'

export type SessionUser = {
  id: string
  email: string
  name: string
}

const secretKey = () => new TextEncoder().encode(env.SESSION_SECRET)

export async function signSession(user: SessionUser): Promise<string> {
  assertProductionSecret()
  return new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey())
}

export async function readSessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey())
    if (!payload.sub || typeof payload.email !== 'string' || typeof payload.name !== 'string')
      return null
    return { id: payload.sub, email: payload.email, name: payload.name }
  } catch {
    return null
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  }
}
