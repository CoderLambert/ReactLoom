import { create } from 'zustand'
import { type Session, sessionSchema } from '@/features/auth/schema'
import { isSessionExpired } from '@/features/auth/session-expiration'
import { publishSessionLogout } from '@/features/auth/session-sync'

const STORAGE_KEY = 'reactloom.session'
const SESSION_ID_KEY = 'reactloom.session.id'

function newSessionId() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

type StoredSession = { session: Session | null; sessionId: string | null }

function readSession(): StoredSession {
  const empty = { session: null, sessionId: null }
  try {
    if (typeof sessionStorage === 'undefined') return empty
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed = sessionSchema.parse(JSON.parse(raw))
    if (isSessionExpired(parsed.expiresAt)) {
      writeSession(null)
      return empty
    }
    const sessionId = sessionStorage.getItem(SESSION_ID_KEY) || newSessionId()
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)
    return { session: parsed, sessionId }
  } catch {
    writeSession(null)
    return empty
  }
}

function writeSession(session: Session | null, sessionId: string | null = null) {
  try {
    if (typeof sessionStorage === 'undefined') return
    if (!session) {
      sessionStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(SESSION_ID_KEY)
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      if (sessionId) sessionStorage.setItem(SESSION_ID_KEY, sessionId)
    }
  } catch {
    // Storage can be denied or full; it must not prevent in-memory auth transitions.
  }
}

type AuthState = {
  session: Session | null
  sessionId: string | null
  sessionVersion: number
  authOperation: number
  beginAuthOperation: () => number
  setSession: (session: Session) => void
  clearSession: (options?: { broadcast?: boolean }) => void
}

const restored = readSession()

export const useAuthStore = create<AuthState>((set, get) => ({
  session: restored.session,
  sessionId: restored.sessionId,
  sessionVersion: 0,
  authOperation: 0,
  beginAuthOperation: () => {
    set((state) => ({ authOperation: state.authOperation + 1 }))
    return get().authOperation
  },
  setSession: (session) => {
    const previousSessionId = get().sessionId
    const sessionId = newSessionId()
    writeSession(session, sessionId)
    set((state) => ({ session, sessionId, sessionVersion: state.sessionVersion + 1 }))
    // Switching accounts revokes copied tabs bound to the previous session.
    // Publish after the new nonce is active so this tab cannot revoke itself.
    if (previousSessionId) publishSessionLogout(previousSessionId)
  },
  clearSession: (options) => {
    const sessionId = get().sessionId
    writeSession(null)
    set((state) => ({ session: null, sessionId: null, sessionVersion: state.sessionVersion + 1 }))
    if (sessionId && options?.broadcast !== false) publishSessionLogout(sessionId)
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
