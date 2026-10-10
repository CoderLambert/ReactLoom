import { type LoginInput, loginSchema, sessionSchema } from '@/features/auth/schema'
import { api } from '@/lib/api'

export function login(input: LoginInput, signal?: AbortSignal) {
  return api.request('/api/session', sessionSchema, {
    method: 'POST',
    body: loginSchema.parse(input),
    signal,
    retry: false,
  })
}

export function logout(signal?: AbortSignal) {
  return api.request(
    '/api/session/logout',
    { parse: () => null },
    { method: 'POST', signal, retry: false },
  )
}
