import { describe, expect, it, vi } from 'vitest'
import { type Session, sessionSchema } from './schema'
import { signIn } from './service'

const request = vi.hoisted(() => vi.fn())

vi.mock('@reactloom/api-client', () => ({
  createApiClient: () => ({ request }),
}))
vi.mock('../../lib/env', () => ({
  env: {
    EXPO_PUBLIC_USE_FIXTURES: 'false',
    EXPO_PUBLIC_API_BASE_URL: 'https://api.example.test',
  },
}))

describe('HTTP sign-in', () => {
  it('forwards the caller cancellation signal and disables retries for POST', async () => {
    const session: Session = {
      accessToken: 'token',
      expiresAt: 4_000_000_000_000,
      user: { id: 'ada', name: 'Ada', email: 'ada@reactloom.dev' },
    }
    request.mockResolvedValueOnce(session)
    const controller = new AbortController()
    const input = { email: 'ada@reactloom.dev', password: 'loom-demo' }

    await expect(signIn(input, controller.signal)).resolves.toEqual(session)
    expect(request).toHaveBeenCalledWith('/api/session', sessionSchema, {
      method: 'POST',
      body: input,
      retry: false,
      signal: controller.signal,
    })
  })
})
