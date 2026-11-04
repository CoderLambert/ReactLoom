import { createApiClient } from '@reactloom/api-client'
import { demoLogin, type LoginInput, type Session, sessionSchema } from '@/features/auth/schema'
import { env } from '@/lib/env'
import { readToken } from '@/lib/token-store'

export async function signIn(input: LoginInput): Promise<Session> {
  if (env.EXPO_PUBLIC_USE_FIXTURES === 'true') {
    if (input.email !== demoLogin.email || input.password !== demoLogin.password) {
      throw new Error('Those credentials were not recognized.')
    }
    const session: Session = {
      accessToken: 'rl-demo-token',
      expiresAt: Date.now() + 60 * 60 * 1000,
      user: { id: 'user-ada', name: 'Ada Loom', email: demoLogin.email },
    }
    return session
  }

  const api = createApiClient({
    baseUrl: env.EXPO_PUBLIC_API_BASE_URL,
    getAccessToken: readToken,
  })
  const session = await api.request('/api/session', sessionSchema, {
    method: 'POST',
    body: input,
    retry: false,
  })
  return session
}
