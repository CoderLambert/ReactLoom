import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { normalizeTab } from '../lib/catalog.mjs'
import { Shell } from './shell'

const Home = lazy(() => import('./home'))
const Library = lazy(() => import('./library'))
const root = createRootRoute({
  component: Shell,
  notFoundComponent: () => (
    <section className="empty">
      <h1>没有这个页面</h1>
      <a href="/">返回目录</a>
    </section>
  ),
  errorComponent: ({ error }) => (
    <section role="alert" className="empty">
      <h1>页面加载失败</h1>
      <p>{error instanceof Error ? error.message : '页面遇到了未知错误，请重新加载。'}</p>
      <button type="button" onClick={() => window.location.reload()}>
        重新加载
      </button>
    </section>
  ),
})
const home = createRoute({
  getParentRoute: () => root,
  path: '/',
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s.q === 'string' ? s.q.slice(0, 200) : '',
    group: typeof s.group === 'string' && /^[A-F]$/.test(s.group) ? s.group : 'all',
    only: s.only === 'runnable' ? 'runnable' : '',
  }),
  component: () => (
    <Suspense fallback={<p role="status">正在加载目录…</p>}>
      <Home />
    </Suspense>
  ),
})
const library = createRoute({
  getParentRoute: () => root,
  path: '/libraries/$slug',
  validateSearch: (s: Record<string, unknown>) => ({
    tab: normalizeTab(s.tab),
    example:
      typeof s.example === 'string' && /^[a-z0-9-]{1,60}$/.test(s.example) ? s.example : undefined,
  }),
  component: () => (
    <Suspense fallback={<p role="status">正在加载库详情…</p>}>
      <Library />
    </Suspense>
  ),
})
export const router = createRouter({
  routeTree: root.addChildren([home, library]),
  defaultPreload: false,
  basepath: import.meta.env.BASE_URL,
})
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
