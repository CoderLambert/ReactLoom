import { createContext, type ReactNode, useContext, useEffect, useReducer } from 'react'
import { authReducer, initialAuthState } from '@/features/auth/reducer'
import type { LoginInput, Session } from '@/features/auth/schema'
import { signIn as signInRequest, signOut as signOutRequest } from '@/features/auth/service'
import { readToken } from '@/lib/token-store'

type AuthContextValue = {
  status: 'loading' | 'anonymous' | 'authenticated'
  session: Session | null
  signIn: (input: LoginInput) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState)

  useEffect(() => {
    let active = true
    void readToken().then((token) => {
      if (!active) return
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
    })
    return () => {
      active = false
    }
  }, [])

  const value: AuthContextValue = {
    status: state.status,
    session: state.status === 'authenticated' ? state.session : null,
    signIn: async (input) => {
      const session = await signInRequest(input)
      dispatch({ type: 'signed-in', session })
    },
    signOut: async () => {
      await signOutRequest()
      dispatch({ type: 'signed-out' })
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}
