import type { QueryClient } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  type RouterHistory,
  redirect,
} from '@tanstack/react-router'
import { type JSX, type LazyExoticComponent, lazy, Suspense } from 'react'
import { Shell } from '@/app/shell'
import { Fallback } from '@/components/errors/fallback'
import { getActiveSession } from '@/features/auth/store'
import { queryClient } from '@/lib/query-client'

const HomePage = lazy(() =>
  import('@/features/home/home-page').then((mod) => ({ default: mod.HomePage })),
)
const LoginPage = lazy(() =>
  import('@/features/auth/login-page').then((mod) => ({ default: mod.LoginPage })),
)
const TasksPage = lazy(() =>
  import('@/features/tasks/tasks-page').then((mod) => ({ default: mod.TasksPage })),
)

export type RouterContext = {
  queryClient: QueryClient
}

function lazyPage(Page: LazyExoticComponent<() => JSX.Element>) {
  return function LazyPage() {
    return (
      <Suspense fallback={<p>…</p>}>
        <Page />
      </Suspense>
    )
  }
}

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Shell,
  errorComponent: ({ error, reset }) => <Fallback error={error} resetErrorBoundary={reset} />,
  notFoundComponent: () => <Fallback error={new Error('That page is not on the loom.')} />,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: lazyPage(HomePage),
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: lazyPage(LoginPage),
})

export type TaskSearch = { status: 'all' | 'open' | 'done' }

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  validateSearch: (search: Record<string, unknown>): TaskSearch => {
    const status = search.status
    if (status === 'open' || status === 'done') return { status }
    return { status: 'all' }
  },
  beforeLoad: () => {
    if (!getActiveSession()) {
      throw redirect({ to: '/login' })
    }
  },
  component: lazyPage(TasksPage),
})

const routeTree = rootRoute.addChildren([indexRoute, loginRoute, tasksRoute])

export function createAppRouter(client: QueryClient, history?: RouterHistory) {
  return createRouter({
    routeTree,
    history,
    context: { queryClient: client },
    defaultPreload: 'intent',
  })
}

export const router = createAppRouter(queryClient)

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
