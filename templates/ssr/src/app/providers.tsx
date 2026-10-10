'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lazy, type ReactNode, Suspense, useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n } from '@/lib/i18n'

const showDevtools =
  process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEVTOOLS !== 'false'

const ReactQueryDevtools = showDevtools
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((mod) => ({
        default: mod.ReactQueryDevtools,
      })),
    )
  : null

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  )
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        {children}
        {ReactQueryDevtools ? (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
          </Suspense>
        ) : null}
      </QueryClientProvider>
    </I18nextProvider>
  )
}
