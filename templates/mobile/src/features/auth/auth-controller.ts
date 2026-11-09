import type { AuthEvent } from './reducer'
import { type LoginInput, type Session, sessionSchema } from './schema'

type AuthDependencies = {
  readSession: () => Promise<Session | null>
  writeSession: (session: Session | null) => Promise<void>
  requestSignIn: (input: LoginInput, signal: AbortSignal) => Promise<Session>
  dispatch: (event: AuthEvent) => void
  subscribeToForeground: (listener: () => void) => () => void
}

// Native and browser timers overflow delays beyond this signed 32-bit bound.
const MAX_EXPIRY_DELAY = 2_147_483_647
const HYDRATION_READ_TIMEOUT_MS = 15_000

// Even if a platform transport ignores AbortSignal, cancelling a superseded login
// must settle the caller; observe the transport's eventual outcome without committing it.
function awaitSignInOrAbort(request: Promise<Session>, signal: AbortSignal): Promise<Session> {
  return new Promise<Session>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener('abort', onAbort)
      reject(new Error('Sign-in request was cancelled.'))
    }
    signal.addEventListener('abort', onAbort, { once: true })
    if (signal.aborted) onAbort()
    void request.then(
      (session) => {
        signal.removeEventListener('abort', onAbort)
        resolve(session)
      },
      (error) => {
        signal.removeEventListener('abort', onAbort)
        reject(error)
      },
    )
  })
}

// Native keychain reads can hang while the OS is locked or its storage service
// is unavailable. Bound startup and observe late outcomes without rehydrating
// a session after the timeout, cancellation or a newer login.
function awaitHydrationOrTimeout(
  request: Promise<Session | null>,
  signal: AbortSignal,
): Promise<Session | null> {
  return new Promise<Session | null>((resolve, reject) => {
    let settled = false
    const complete = (finish: () => void) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      signal.removeEventListener('abort', onAbort)
      finish()
    }
    const onAbort = () => complete(() => reject(new Error('Session hydration was cancelled.')))
    const timeout = setTimeout(
      () => complete(() => reject(new Error('Session storage read timed out.'))),
      HYDRATION_READ_TIMEOUT_MS,
    )
    signal.addEventListener('abort', onAbort, { once: true })
    if (signal.aborted) onAbort()
    void request.then(
      (session) => complete(() => resolve(session)),
      (error) => complete(() => reject(error)),
    )
  })
}

export function createAuthController({
  readSession,
  writeSession,
  requestSignIn,
  dispatch,
  subscribeToForeground,
}: AuthDependencies) {
  let active = false
  let initialized = false
  let generation = 0
  let committedSession: Session | null = null
  let writes = Promise.resolve()
  let expiryTimer: ReturnType<typeof setTimeout> | undefined
  let pendingLogin: AbortController | undefined
  let pendingHydration: AbortController | undefined
  let unsubscribe: (() => void) | undefined
  const current = (operation: number) => active && operation === generation
  const expired = (session: Session) => session.expiresAt <= Date.now()

  function cancelPendingLogin() {
    pendingLogin?.abort()
    pendingLogin = undefined
  }

  function cancelPendingHydration() {
    pendingHydration?.abort()
    pendingHydration = undefined
  }

  function clearExpiry() {
    if (expiryTimer !== undefined) clearTimeout(expiryTimer)
    expiryTimer = undefined
  }

  function storageFailed() {
    initialized = true
    committedSession = null
    clearExpiry()
    if (active) dispatch({ type: 'storage-failed' })
  }

  function scheduleExpiry() {
    clearExpiry()
    if (!active || !committedSession) return
    const expectedSession = committedSession
    expiryTimer = setTimeout(
      () => {
        expiryTimer = undefined
        if (committedSession === expectedSession) void checkExpiry().catch(() => undefined)
      },
      Math.min(Math.max(0, expectedSession.expiresAt - Date.now()), MAX_EXPIRY_DELAY),
    )
  }

  async function checkExpiry() {
    if (!active || !committedSession) return
    if (expired(committedSession)) await invalidateSession(committedSession)
    else scheduleExpiry()
  }

  function persist(session: Session | null, operation: number, commit: () => void) {
    const write = writes.then(async () => {
      // Logout deletion remains required after a newer login or provider cleanup.
      if (session !== null && !current(operation)) return
      if (session && expired(session)) throw new Error('Session has expired. Please sign in again.')
      try {
        await writeSession(session)
        if (session === null) return
        if (!current(operation) || expired(session)) {
          // A write cannot be cancelled. Restore the last committed session before
          // allowing a newer write to run, even if its login request failed.
          const previous = committedSession
          if (previous && expired(previous)) void checkExpiry().catch(() => undefined)
          await writeSession(committedSession)
        } else {
          committedSession = session
          commit()
          scheduleExpiry()
          return
        }
      } catch (error) {
        storageFailed()
        throw error
      }
      if (current(operation)) throw new Error('Session has expired. Please sign in again.')
    })
    writes = write.catch(() => undefined)
    return write
  }

  async function signOut() {
    if (!active) return
    const operation = ++generation
    cancelPendingLogin()
    cancelPendingHydration()
    initialized = true
    committedSession = null
    clearExpiry()
    dispatch({ type: 'signed-out' })
    await persist(null, operation, () => {})
  }

  async function invalidateSession(expectedSession: Session) {
    if (!active || committedSession !== expectedSession) return
    await signOut()
  }

  return {
    async start() {
      active = true
      unsubscribe?.()
      unsubscribe = subscribeToForeground(() => {
        void checkExpiry().catch(() => undefined)
      })
      const operation = ++generation
      cancelPendingHydration()
      if (initialized) {
        await checkExpiry().catch(() => undefined)
        return
      }
      const hydration = new AbortController()
      pendingHydration = hydration
      try {
        const stored = await awaitHydrationOrTimeout(readSession(), hydration.signal)
        if (!current(operation)) return
        initialized = true
        const result = sessionSchema.safeParse(stored)
        const session = result.success && !expired(result.data) ? result.data : null
        committedSession = session
        dispatch({ type: 'hydrated', session })
        if (session) scheduleExpiry()
        else await persist(null, operation, () => {})
      } catch {
        if (current(operation)) storageFailed()
      } finally {
        if (pendingHydration === hydration) pendingHydration = undefined
      }
    },
    stop() {
      active = false
      generation += 1
      cancelPendingLogin()
      cancelPendingHydration()
      clearExpiry()
      unsubscribe?.()
      unsubscribe = undefined
    },
    async signIn(input: LoginInput) {
      if (!active) return
      const operation = ++generation
      cancelPendingLogin()
      cancelPendingHydration()
      const controller = new AbortController()
      pendingLogin = controller
      if (!initialized) {
        initialized = true
        dispatch({ type: 'signed-out' })
      }
      let response: Session
      try {
        response = await awaitSignInOrAbort(
          requestSignIn(input, controller.signal),
          controller.signal,
        )
      } catch (error) {
        // Cancellation from logout, replacement login, or unmount is not a
        // failure of the current sign-in attempt.
        if (!current(operation)) return
        throw error
      } finally {
        if (pendingLogin === controller) pendingLogin = undefined
      }
      if (!current(operation)) return
      const session = sessionSchema.parse(response)
      if (expired(session)) throw new Error('Session has expired. Please sign in again.')
      await persist(session, operation, () => dispatch({ type: 'signed-in', session }))
    },
    signOut,
    invalidateSession,
  }
}
