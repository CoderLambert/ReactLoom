import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { createAppRouter } from '@/app/router'
import { useAuthStore } from '@/features/auth/store'
import { i18n } from '@/lib/i18n'
import { createAppQueryClient } from '@/lib/query-client'

export function renderApp(path = '/') {
  useAuthStore.setState({ session: null })
  const client = createAppQueryClient()
  const router = createAppRouter(client, createMemoryHistory({ initialEntries: [path] }))
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}
