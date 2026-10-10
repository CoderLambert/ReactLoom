import { create } from 'zustand'
import { type Session, sessionSchema } from '@/features/auth/schema'

const STORAGE_KEY = 'reactloom.session'

function readSession(): Session | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = sessionSchema.parse(JSON.parse(raw))
    if (parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
}

function writeSession(session: Session | null) {
  if (typeof sessionStorage === 'undefined') return
  if (!session) sessionStorage.removeItem(STORAGE_KEY)
  else sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

type AuthState = {
  session: Session | null
  setSession: (session: Session) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  session: readSession(),
  setSession: (session) => {
    writeSession(session)
    set({ session })
  },
  clearSession: () => {
    writeSession(null)
    set({ session: null })
  },
}))
