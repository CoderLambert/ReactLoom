import { afterEach, describe, expect, it, vi } from 'vitest'
import { readToken } from '../../lib/token-store'
import { type Session } from './schema'
import { signIn } from './service'

vi.mock('../../lib/env', () => ({
  env: {
    EXPO_PUBLIC_USE_FIXTURES: 'false',
    EXPO_PUBLIC_API_BASE_URL: 'https://api.example.test',
  },
}))
vi.mock('../../lib/token-store', () => ({
  readToken: vi.fn(async () => 'previous-account-token'),
}))

const input = { email: 'ada@reactloom.dev', password: 'loom-demo' }

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('sign-in credential isolation', () => {
  it('does not send the previous session token or ambient cookies to a new login', async () => {
    const session: Session = {
      accessToken: 'new-account-token',
      expiresAt: 4_000_000_000_000,
      user: { id: 'ada', name: 'Ada', email: input.email },
    }
    const fetchMock = vi.fn(async (_url: unknown, _init?: RequestInit) =>
      new Response(JSON.stringify(session), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const controller = new AbortController()
    await expect(signIn(input, controller.signal)).resolves.toEqual(session)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, request] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.example.test/api/session')
    expect(request?.method).toBe('POST')
    expect(request?.body).toBe(JSON.stringify(input))
    expect(request?.credentials).toBe('omit')
    expect(new Headers(request?.headers).has('authorization')).toBe(false)
    expect(readToken).not.toHaveBeenCalled()
    expect(request?.signal?.aborted).toBe(false)
    controller.abort()
    expect(request?.signal?.aborted).toBe(true)
  })
})
