import type { AuthEvent } from './reducer'
import type { LoginInput, Session } from './schema'

type AuthDependencies = {
  readToken: () => Promise<string | null>
  writeToken: (token: string | null) => Promise<void>
  requestSignIn: (input: LoginInput) => Promise<Session>
  dispatch: (event: AuthEvent) => void
}

export function createAuthController({
  readToken,
  writeToken,
  requestSignIn,
  dispatch,
}: AuthDependencies) {
  let active = false
  let initialized = false
  let generation = 0
  let committedToken: string | null = null
  let writes = Promise.resolve()
  const current = (operation: number) => active && operation === generation
  const storageFailed = () => {
    initialized = true
    committedToken = null
    if (active) dispatch({ type: 'storage-failed' })
  }

  function persist(token: string | null, operation: number, commit: () => void) {
    const write = writes.then(async () => {
      // Logout deletion remains required after a newer login or provider cleanup.
      if (token !== null && !current(operation)) return
      try {
        await writeToken(token)
        if (token === null) return
        if (!current(operation)) {
          // A write cannot be cancelled. Restore the last committed session before
          // allowing a newer write to run, even if its login request failed.
          await writeToken(committedToken)
          return
        }
        committedToken = token
        commit()
      } catch (error) {
        storageFailed()
        throw error
      }
    })
    writes = write.catch(() => undefined)
    return write
  }

  return {
    async start() {
      active = true
      const operation = ++generation
      if (initialized) return
      try {
        const token = await readToken()
        if (!current(operation)) return
        initialized = true
        committedToken = token
        dispatch({
          type: 'hydrated',
          session: token
            ? {
                accessToken: token,
                expiresAt: Date.now() + 60 * 60 * 1000,
                user: { id: 'user-ada', name: 'Ada Loom', email: 'ada@reactloom.dev' },
              }
            : null,
        })
      } catch {
        if (current(operation)) storageFailed()
      }
    },
    stop() {
      active = false
      generation += 1
    },
    async signIn(input: LoginInput) {
      if (!active) return
      const operation = ++generation
      if (!initialized) {
        initialized = true
        dispatch({ type: 'signed-out' })
      }
      const session = await requestSignIn(input)
      if (!current(operation)) return
      await persist(session.accessToken, operation, () => dispatch({ type: 'signed-in', session }))
    },
    async signOut() {
      if (!active) return
      const operation = ++generation
      initialized = true
      committedToken = null
      dispatch({ type: 'signed-out' })
      await persist(null, operation, () => {})
    },
  }
}
