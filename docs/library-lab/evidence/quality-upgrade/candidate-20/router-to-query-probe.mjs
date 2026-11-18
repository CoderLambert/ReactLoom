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
  validateSearch: (s) => ({
    tab: ['docs', 'demo'].includes(s.tab) ? s.tab : 'docs',
    example: typeof s.example === 'string' ? s.example : undefined,
  }),
})
const router = createRouter({
  routeTree: root.addChildren([library]),
  history: createMemoryHistory({
    initialEntries: ['/libraries/nuqs?tab=demo&example=business&host_probe=kept'],
  }),
})
await router.load()
for (const [name, options] of [
  [
    'nuqs2.10.1-to-string',
    { from: '/', to: '/libraries/nuqs?tab=demo&example=business&host_probe=kept&ll_c19_page=2' },
  ],
  [
    'structured-search',
    {
      to: '/libraries/$slug',
      params: { slug: 'nuqs' },
      search: (prev) => ({ ...prev, ll_c19_page: '2' }),
    },
  ],
  [
    'href-navigation-build',
    { href: '/libraries/nuqs?tab=demo&example=business&host_probe=kept&ll_c19_page=2' },
  ],
])
  console.log(name, JSON.stringify(router.buildLocation(options)))
