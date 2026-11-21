import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { login, logout } from '@/features/auth/api'
import { getActiveSession, useAuthStore } from '@/features/auth/store'

function beginAuthOperation() {
  getActiveSession()
  const operation = useAuthStore.getState().beginAuthOperation()
  return { operation, version: useAuthStore.getState().sessionVersion }
}

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (input: Parameters<typeof login>[0]) => login(input),
    onMutate: beginAuthOperation,
    onSuccess: async (session, _input, attempt) => {
      const current = useAuthStore.getState()
      if (
        current.authOperation !== attempt?.operation ||
        current.sessionVersion !== attempt.version
      )
        return
      setSession(session)
      await navigate({ to: '/tasks', search: { status: 'all' } })
    },
  })
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => {
      // Capture the current token for server revocation before clearing it.
      // A slow or failed logout request must never keep private data visible.
      const request = logout()
      clearSession()
      void navigate({ to: '/' })
      return request
    },
    // Invalidate older sign-in attempts even when server logout is delayed.
    onMutate: beginAuthOperation,
  })
}
