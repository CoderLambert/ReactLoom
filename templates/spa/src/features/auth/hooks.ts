import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { login, logout } from '@/features/auth/api'
import { useAuthStore } from '@/features/auth/store'
import { taskKeys } from '@/features/tasks/keys'

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (input: Parameters<typeof login>[0]) => login(input),
    onSuccess: async (session) => {
      setSession(session)
      await navigate({ to: '/tasks', search: { status: 'all' } })
    },
  })
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSettled: async () => {
      clearSession()
      queryClient.removeQueries({ queryKey: taskKeys.all })
      await navigate({ to: '/' })
    },
  })
}
