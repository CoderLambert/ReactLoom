import type { Meta, StoryObj } from '@storybook/react-vite'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { useMemo } from 'react'
import { I18nextProvider } from 'react-i18next'
import { createAppRouter } from '@/app/router'
import { i18n } from '@/lib/i18n'
import { createAppQueryClient } from '@/lib/query-client'

function LoginRoute() {
  const client = useMemo(() => createAppQueryClient(), [])
  const router = useMemo(
    () => createAppRouter(client, createMemoryHistory({ initialEntries: ['/login'] })),
    [client],
  )
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </I18nextProvider>
  )
}

const meta = {
  title: 'Features/Login',
  component: LoginRoute,
} satisfies Meta<typeof LoginRoute>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
