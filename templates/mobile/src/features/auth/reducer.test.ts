import { describe, expect, it } from 'vitest'
import { authReducer, initialAuthState } from './reducer'

const session = {
  accessToken: 'token',
  expiresAt: 1,
  user: { id: 'user-ada', name: 'Ada Loom', email: 'ada@reactloom.dev' },
}

describe('authReducer', () => {
  it('does not let late hydration restore a signed-out session', () => {
    const signedOut = authReducer(initialAuthState, { type: 'signed-out' })
    expect(authReducer(signedOut, { type: 'hydrated', session })).toEqual({
      status: 'anonymous',
      revision: 0,
    })
  })

  it('moves from loading to anonymous or authenticated', () => {
    expect(authReducer(initialAuthState, { type: 'hydrated', session: null })).toEqual({
      status: 'anonymous',
      revision: 0,
    })
    expect(authReducer(initialAuthState, { type: 'hydrated', session })).toEqual({
      status: 'authenticated',
      session,
      revision: 1,
    })
    expect(
      authReducer({ status: 'authenticated', session, revision: 1 }, { type: 'signed-out' }),
    ).toEqual({
      status: 'anonymous',
      revision: 2,
    })
  })
})
