import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { Providers } from '@/app/providers'
import { createAppRouter } from '@/app/router'
import { useAuthStore } from '@/features/auth/store'
import { createAppQueryClient } from '@/lib/query-client'

export function renderApp(path = '/') {
  useAuthStore.getState().clearSession()
  const client = createAppQueryClient()
  const router = createAppRouter(client, createMemoryHistory({ initialEntries: [path] }))
  return render(
    <Providers client={client}>
      <RouterProvider router={router} />
    </Providers>,
  )
}
