// Actual public Router memory model; no DOM or browser result claimed.
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'

const root = createRootRoute()
const library = createRoute({
  getParentRoute: () => root,
  path: '/libraries/$slug',
  validateSearch: (value) => ({
    tab: value.tab === 'demo' ? 'demo' : 'docs',
    example: typeof value.example === 'string' ? value.example : undefined,
  }),
})
const router = createRouter({
  routeTree: root.addChildren([library]),
  history: createMemoryHistory({
    initialEntries: ['/libraries/nuqs?tab=demo&example=advanced&host=a&host=b#anchor'],
  }),
})
await router.load()
const expected = '/libraries/nuqs?tab=demo&example=advanced&host=a&host=b&ll_c19_page=2#anchor'
for (const [name, options] of [
  ['to-string', { to: expected }],
  ['href', { href: expected, state: (previous) => previous }],
]) {
  const location = router.buildLocation(options)
  const parsed = new URL(location.href, 'https://fixture.invalid')
  console.log(
    JSON.stringify({
      name,
      pathname: location.pathname,
      href: location.href,
      search: location.search,
      rawHostValues: parsed.searchParams.getAll('host'),
      hash: location.hash,
    }),
  )
}
