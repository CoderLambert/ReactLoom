import { type QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useEffect } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { I18nextProvider } from 'react-i18next'
import { Fallback } from '@/components/errors/fallback'
import { i18n } from '@/lib/i18n'
import { bindSessionQueryCache, queryClient } from '@/lib/query-client'

export function Providers({
  children,
  client = queryClient,
}: {
  children: ReactNode
  client?: QueryClient
}) {
  useEffect(() => bindSessionQueryCache(client), [client])

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <ErrorBoundary
          FallbackComponent={({ error, resetErrorBoundary }) => (
            <Fallback error={error} resetErrorBoundary={resetErrorBoundary} />
          )}
        >
          {children}
        </ErrorBoundary>
      </QueryClientProvider>
    </I18nextProvider>
  )
}
