# Data fetching

Network calls go through `@reactloom/api-client`. Feature code passes a Zod schema. The client checks the body, retries idempotent failures, and throws `ApiError`.

The implementation is `packages/api-client/src/client.ts`. `createApiClient` takes `baseUrl`, an optional `getAccessToken`, `credentials`, and `onUnauthorized`. `request(path, schema, options)` parses the JSON with the schema. GET and HEAD retry on timeout, network errors, and 408, 429, 500, 502, 503, and 504. POST does not retry unless the caller asks. Pass `retry: false` on mutations. Pass the query `signal` so a cancelled query aborts the fetch.

`isApiError` from the same package is how screens tell a failed request from an unexpected throw. See [ADR 0004](../adr/0004-api-client.md).

## API client

<!-- reactloom:spa -->
`templates/spa/src/lib/api.ts` builds one client. `baseUrl` is `env.VITE_API_BASE_URL`. `getAccessToken` reads the Zustand session. `onUnauthorized` clears that session.

Feature functions live next to the feature. `templates/spa/src/features/tasks/api.ts` exports `listTasks`, `createTask`, and `setTaskStatus`. Each one calls `api.request` with the matching schema. `createTask` parses the input with `createTaskSchema` before the request and sets `retry: false`.

Hooks call those functions. Components do not call `api.request`.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
`templates/ssr/src/lib/api.ts` exports `getApi()`. The client uses `window.location.origin` and `credentials: 'include'`. There is no `getAccessToken`. The browser sends the `rl_session` cookie. Route handlers in `templates/ssr/src/app/api` read that cookie with `readRequestSession()` and return JSON.

Call `getApi()` from client components and hooks. Do not create another client in a page, and do not import the server session module into client code.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
With `EXPO_PUBLIC_USE_FIXTURES=true` (the default), login never hits the network. `templates/mobile/src/features/auth/service.ts` checks the fixture account and stores a demo token.

With fixtures off, `signIn` builds a client from `EXPO_PUBLIC_API_BASE_URL` and `readToken`, then `api.request('/api/session', sessionSchema, ...)`. Build that client at the call site that needs it. The task screen does not. It uses `templates/mobile/src/features/tasks/repository.ts`.
<!-- /reactloom:mobile -->

## Query keys

Keys are arrays. Invalidate the prefix you mean to refresh, not a one-off string copied into a component.

<!-- reactloom:spa -->
`templates/spa/src/features/tasks/keys.ts`:

```ts
export const taskKeys = {
  all: ['tasks'] as const,
  list: (status: 'all' | TaskStatus = 'all') => [...taskKeys.all, 'list', status] as const,
}
```

`useTasks` uses `taskKeys.list()`. Mutations cancel and invalidate `taskKeys.all`, so every list under `['tasks']` refreshes. Logout removes `taskKeys.all` in `templates/spa/src/features/auth/hooks.ts`.

The status chip in the URL is not part of the key the page uses. `list()` defaults to `'all'`. The factory's `status` argument is there when a request must be filtered on the server. Passing it from the chip would fetch three lists for one screen.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
`templates/ssr/src/app/tasks/page.tsx` uses the inline key `['tasks']` for both `useQuery` and `invalidateQueries`. That is enough while the page has one query.

When a second query appears (a detail view, a different filter that hits the server), introduce a `taskKeys` object in a module next to the page and invalidate `taskKeys.all`. Do not add another raw `['tasks']` string in the new file.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
The sample task screen does not use a query key. The list is `repository.list()` copied into React state.

A `useQuery` added later should use a key array owned by the feature, the same shape as a `taskKeys` object, and should invalidate that prefix after `repository` is no longer the source of truth. Do not invent a key for data that still lives in the repository.
<!-- /reactloom:mobile -->

## Mutations

A mutation function calls the feature API. `onSuccess` and `onSettled` update caches or navigation. The component calls `mutate` or `mutateAsync` and reads `isPending`.

<!-- reactloom:spa -->
`useCreateTask` and `useSetTaskStatus` live in `templates/spa/src/features/tasks/hooks.ts`. Status updates invalidate `taskKeys.all` on settle. They do not write the cache themselves.

`useLogin` in `templates/spa/src/features/auth/hooks.ts` stores the session and navigates to `/tasks` on success. `useLogout` clears the session, removes task queries, and navigates home on settle, including when the request fails. The token must not stay after a failed logout.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
The create mutation in `templates/ssr/src/app/tasks/page.tsx` posts through `getApi()` with `retry: false` and invalidates `['tasks']` on settle. Login is not a mutation hook. `templates/ssr/src/app/login/page.tsx` awaits `getApi().request` inside `handleSubmit`. Either style is fine. Keep the pending and error UI on that one call, and do not fire a second request from an effect.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
`signIn` and `signOut` on the auth context are async functions, not `useMutation` hooks. The login screen awaits `auth.signIn` from the form submit handler. The task screen calls `repository.create` and then `setTasks(repository.list())`.

Use `useMutation` when the work is a real request that should expose `isPending` and rollback. The fixture repository does not need it.
<!-- /reactloom:mobile -->

## Optimistic updates

Update the cache in `onMutate`, roll it back in `onError`, and refetch in `onSettled`. The temporary row must be obvious and must not be sent to the server as an id.

<!-- reactloom:spa -->
`useCreateTask` in `templates/spa/src/features/tasks/hooks.ts` does this:

1. `cancelQueries` on `taskKeys.all` so a slower list response cannot overwrite the optimistic row.
2. Snapshot `taskKeys.list()` into `context.previous`.
3. Insert a task whose id is `tmp-${crypto.randomUUID()}` and whose status is `open`.
4. On error, write `context.previous` back.
5. On settle, `invalidateQueries` on `taskKeys.all` so the temp id is replaced by the server row.

`useSetTaskStatus` does not do this. It waits for the refetch. Add an optimistic patch only when the wait is visible, and include the same rollback.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
The tasks page does not update the cache before the response. `onSettled` invalidates `['tasks']`, and the list refetches. Add `onMutate` only if that gap is a problem. Snapshot the previous `['tasks']` data, and do not reuse a temporary id as the server id.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
The repository updates its array inside `create`, and the screen copies `repository.list()` into state. That is a local write, not an optimistic server update. There is no rollback, because there is no request.

If fixtures are off and a mutation posts to the API, snapshot the previous list and restore it when the request throws. Do not leave a row that only existed in the repository.
<!-- /reactloom:mobile -->

## Prefetching

<!-- reactloom:spa -->
`createAppRouter` in `templates/spa/src/app/router.tsx` sets `defaultPreload: 'intent'`. Hovering a link preloads that route's module. The pages are `lazy()` imports, so the preload is the point of the split.

Nothing in this template calls `prefetchQuery` or `ensureQueryData`. Intent preload does not fill the task cache. The list still loads when `TasksPage` mounts. Add `prefetchQuery` in a loader only when the screen should render with data already in the cache, and use `taskKeys` so the preload and `useTasks` share a key.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
There is no query prefetch. `templates/ssr/src/app/tasks/loading.tsx` is the App Router loading boundary for the route's server work. The task query starts in the browser after the client page hydrates. Do not add a `prefetchQuery` in a module scope on the server. That client would be shared across requests. Prefetch inside the request, then hand the result to the client. The next section is that handoff, and this template does not do it yet.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
Nothing prefetches. Expo Router loads the screen module when you navigate. The repository is already in memory. A future `useQuery` should prefetch in the layout only when the next screen needs the cache warm, using the same key the screen will use.
<!-- /reactloom:mobile -->

<!-- reactloom:ssr -->
## SSR hydration

This template renders the shell on the server and loads tasks in the browser. It does not pass a dehydrated TanStack Query cache into `HydrationBoundary`.

What actually happens:

- `templates/ssr/src/app/layout.tsx` is a Server Component. It renders the skip link, the header, and the `<main>` around `children`.
- `templates/ssr/src/app/page.tsx` is a Server Component. Its HTML is the home page. It does not call `getApi()` or Query.
- `templates/ssr/src/app/providers.tsx` is a client component. `useState(() => new QueryClient(...))` creates the cache on the client. The provider does not take a `dehydratedState` prop.
- `templates/ssr/src/app/tasks/page.tsx` is marked `'use client'`. `useQuery` runs after hydration, so the first HTML for `/tasks` does not include the task rows. `tasks.isPending` is the loading state.
- `templates/ssr/src/server/session.ts` reads the cookie with `cookies()` from `next/headers`. That runs in route handlers and other server code. The JWT stays httpOnly. `getApi()` sends it with `credentials: 'include'`.

`dehydrate` and `HydrationBoundary` are not imported anywhere. Adding them means prefetching inside one request and passing that state into `Providers`. Keep the `useState` client for queries that still fetch in the browser. Do not switch `Providers` to a module-level `QueryClient` to make hydration "easier". That shares cache entries between users.
<!-- /reactloom:ssr -->
