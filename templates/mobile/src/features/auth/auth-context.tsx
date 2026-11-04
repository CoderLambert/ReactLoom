import { createContext, type ReactNode, useContext, useEffect, useReducer, useState } from 'react'
import { subscribeToForeground } from '@/features/auth/app-state'
import { createAuthController } from '@/features/auth/auth-controller'
import { authReducer, initialAuthState } from '@/features/auth/reducer'
import type { LoginInput, Session } from '@/features/auth/schema'
import { signIn as signInRequest } from '@/features/auth/service'
import { readSession, writeSession } from '@/lib/token-store'

type AuthContextValue = {
  status: 'loading' | 'anonymous' | 'authenticated'
  session: Session | null
  revision: number
  error: string | null
  signIn: (input: LoginInput) => Promise<void>
  signOut: () => Promise<void>
  invalidateSession: (expectedSession: Session) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  const [controller] = useState(() =>
    createAuthController({
      readSession,
      writeSession,
      requestSignIn: signInRequest,
      dispatch,
      subscribeToForeground,
    }),
  )

  useEffect(() => {
    void controller.start()
    return () => controller.stop()
  }, [controller])

  const value: AuthContextValue = {
    status: state.status,
    session: state.status === 'authenticated' ? state.session : null,
    revision: state.revision,
    error: state.status === 'anonymous' ? (state.error ?? null) : null,
    signIn: controller.signIn,
    signOut: controller.signOut,
    invalidateSession: controller.invalidateSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
