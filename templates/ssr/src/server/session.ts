import { cookies } from 'next/headers'
import { readSessionToken, SESSION_COOKIE, type SessionUser } from '@/server/session-token'

export async function readRequestSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  return readSessionToken(token)
}
