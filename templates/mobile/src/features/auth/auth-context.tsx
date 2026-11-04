import { createContext, type ReactNode, useContext, useEffect, useReducer, useState } from 'react'
import { createAuthController } from '@/features/auth/auth-controller'
import { authReducer, initialAuthState } from '@/features/auth/reducer'
import type { LoginInput, Session } from '@/features/auth/schema'
import { signIn as signInRequest } from '@/features/auth/service'
import { readToken, writeToken } from '@/lib/token-store'

type AuthContextValue = {
  status: 'loading' | 'anonymous' | 'authenticated'
  session: Session | null
  error: string | null
  signIn: (input: LoginInput) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  const [controller] = useState(() =>
    createAuthController({ readToken, writeToken, requestSignIn: signInRequest, dispatch }),
  )

  useEffect(() => {
    void controller.start()
    return () => controller.stop()
  }, [controller])

  const value: AuthContextValue = {
    status: state.status,
    session: state.status === 'authenticated' ? state.session : null,
    error: state.status === 'anonymous' ? (state.error ?? null) : null,
    signIn: controller.signIn,
    signOut: controller.signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
