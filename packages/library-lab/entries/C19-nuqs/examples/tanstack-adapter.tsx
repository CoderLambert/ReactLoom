import { useLocation, useRouter, useRouterState } from '@tanstack/react-router'
import {
  renderQueryString,
  unstable_createAdapterProvider,
  type unstable_UpdateUrlFunction,
} from 'nuqs/adapters/custom'
import { NuqsAdapter as BaseNuqsAdapter } from 'nuqs/adapters/tanstack-router'
import { type ComponentProps, startTransition, useCallback, useMemo, useRef } from 'react'

// Example-owned compatibility integration for nuqs 2.10.1 + the installed Router.
// Public custom-provider API: no imports from nuqs private context/reset/queue chunks.
function useCompatibleAdapter(watchKeys: string[]) {
  const { pathname, hash, search } = useLocation()
  const resolvedPathname = useRouterState({
    select: (state) => state.resolvedLocation?.pathname ?? state.location.pathname,
  })
  const { navigate } = useRouter()
  const committed = useRef({ pathname, search })
  const stablePath = pathname === resolvedPathname
  if (stablePath) committed.current = { pathname, search }
  // Keep an outgoing view on its own search while another pathname is resolving.
  const activeSearch =
    !stablePath && committed.current.pathname !== pathname ? committed.current.search : search
  const searchParams = useMemo(() => {
    const pairs: [string, string][] = []
    for (const [key, value] of Object.entries(activeSearch)) {
      if (!watchKeys.includes(key)) continue
      if (Array.isArray(value)) for (const item of value) pairs.push([key, String(item)])
      else
        pairs.push([
          key,
          typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value),
        ])
    }
    return new URLSearchParams(pairs)
  }, [activeSearch, watchKeys])
  const updateUrl = useCallback<unstable_UpdateUrlFunction>(
    (search, options) => {
      // `to` is a pathname/template here. `href` uses the Router's own
      // parseHref/parseSearch, preserving numeric search and repeated values.
      const href = `${pathname}${renderQueryString(search)}${hash ? `#${hash}` : ''}`
      startTransition(() => {
        void navigate({
          href,
          replace: options.history === 'replace',
          resetScroll: options.scroll,
          state: (previous) => previous,
        })
      })
    },
    [pathname, hash, navigate],
  )
  return { searchParams, updateUrl, rateLimitFactor: 1 }
}
const CompatibleProvider = unstable_createAdapterProvider(useCompatibleAdapter)

export function TanStackNuqsAdapter({
  children,
  ...options
}: ComponentProps<typeof BaseNuqsAdapter>) {
  // The real SDK outer adapter still mounts its HistorySpy: Back/Forward/GO
  // resets pending queues, and SDK effect cleanup removes its history subscription.
  // Both providers receive the same public defaults/processUrlSearchParams options.
  return (
    <BaseNuqsAdapter {...options}>
      <CompatibleProvider {...options}>{children}</CompatibleProvider>
    </BaseNuqsAdapter>
  )
}
