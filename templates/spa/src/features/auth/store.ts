import { create } from 'zustand'
import { type Session, sessionSchema } from '@/features/auth/schema'
import { isSessionExpired } from '@/features/auth/session-expiration'

const STORAGE_KEY = 'reactloom.session'

function readSession(): Session | null {
  try {
    if (typeof sessionStorage === 'undefined') return null
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = sessionSchema.parse(JSON.parse(raw))
    if (isSessionExpired(parsed.expiresAt)) {
      writeSession(null)
      return null
    }
    return parsed
  } catch {
    writeSession(null)
    return null
  }
}

function writeSession(session: Session | null) {
  try {
    if (typeof sessionStorage === 'undefined') return
    if (!session) sessionStorage.removeItem(STORAGE_KEY)
    else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Storage can be denied or full; it must not prevent in-memory auth transitions.
  }
}

type AuthState = {
  session: Session | null
  sessionVersion: number
  authOperation: number
  beginAuthOperation: () => number
  setSession: (session: Session) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: readSession(),
  sessionVersion: 0,
  authOperation: 0,
  beginAuthOperation: () => {
    set((state) => ({ authOperation: state.authOperation + 1 }))
    return get().authOperation
  },
  setSession: (session) => {
    writeSession(session)
    set((state) => ({ session, sessionVersion: state.sessionVersion + 1 }))
  },
  clearSession: () => {
    writeSession(null)
    set((state) => ({ session: null, sessionVersion: state.sessionVersion + 1 }))
  },
}))

// Re-check on every protected navigation and HTTP request, not only at startup.
export function getActiveSession(): Session | null {
  const { session, clearSession } = useAuthStore.getState()
  if (session && isSessionExpired(session.expiresAt)) {
    clearSession()
    return null
  }
  return session
}
