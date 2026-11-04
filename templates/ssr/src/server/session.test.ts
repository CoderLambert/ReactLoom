import { describe, expect, it } from 'vitest'
import { assertSessionSecretPolicy } from './env'
import { readSessionToken, signSession } from './session-token'

describe('session cookie token', () => {
  it('round-trips a user through a signed token', async () => {
    const token = await signSession({
      id: 'user-ada',
      email: 'ada@reactloom.dev',
      name: 'Ada Loom',
    })
    await expect(readSessionToken(token)).resolves.toEqual({
      id: 'user-ada',
      email: 'ada@reactloom.dev',
      name: 'Ada Loom',
    })
    await expect(readSessionToken(`${token}x`)).resolves.toBeNull()
  })
})

describe('session secret policy', () => {
  const developmentSecret = 'dev-only-reactloom-session-secret-32'

  it('rejects the public fallback in production even with strict mode disabled', () => {
    expect(() => assertSessionSecretPolicy(developmentSecret, 'production', false)).toThrow(
      /SESSION_SECRET/,
    )
  })

  it('rejects the fallback in opt-in strict mode outside production', () => {
    expect(() => assertSessionSecretPolicy(developmentSecret, 'development', true)).toThrow(
      /SESSION_SECRET/,
    )
  })

  it('allows the fallback only for non-strict local development', () => {
    expect(() => assertSessionSecretPolicy(developmentSecret, 'development', false)).not.toThrow()
  })

  it('accepts a non-default secret in production', () => {
    expect(() =>
      assertSessionSecretPolicy('a-non-default-test-secret-32-characters', 'production', false),
    ).not.toThrow()
  })
})
