import { describe, expect, it } from 'vitest'
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
