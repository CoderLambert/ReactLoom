import { QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { I18nextProvider } from 'react-i18next'
import { Fallback } from '@/components/errors/fallback'
import { i18n } from '@/lib/i18n'
import { queryClient } from '@/lib/query-client'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
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
