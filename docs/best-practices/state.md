# State management

Put each kind of state in the place that already owns it. Do not copy the same value into a second store.

| Kind | Where it lives | Use it for |
| --- | --- | --- |
| Server state | TanStack Query | Anything the API (or the fixture behind the API) can refetch |
| URL state | The router | Filters and screens the user can share or bookmark |
| Form state | React Hook Form | Field values, validation, and submit status for one form |
| Client store | The smallest store already in this template | A session snapshot or a preference that is not on the server |

If a value is in the query cache, do not also write it to the client store. If a value is in the URL, do not also keep a `useState` copy for the same filter.

## Server state

TanStack Query owns data that can be stale, refetched, or rolled back.

<!-- reactloom:spa -->
`useTasks` in `templates/spa/src/features/tasks/hooks.ts` is the list. The query function receives React Query's `signal` and passes it to `listTasks`. `select` returns `data.tasks` so the screen maps tasks, not the envelope.

Defaults live in `templates/spa/src/lib/query-client.ts`: `staleTime` 30 seconds, `gcTime` five minutes, no refetch on window focus, and retries skipped for abort, validation, unauthorized, 403, and 404. Mutations do not retry.

The task array is not stored anywhere else. `templates/spa/src/features/auth/store.ts` holds the session only.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
`templates/ssr/src/app/providers.tsx` creates the `QueryClient` inside `useState`. That keeps one cache for the browser session. A module-level client would be shared across requests on the server.

`templates/ssr/src/app/tasks/page.tsx` loads the list with `useQuery` and query key `['tasks']`. The home page does not use Query. It is a Server Component and reads no client cache.

Defaults on that client are `staleTime` 30 seconds, one retry, and no refetch on window focus.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
`templates/mobile/app/_layout.tsx` mounts a `QueryClientProvider`. The sample task screen does not call `useQuery`. `templates/mobile/app/tasks.tsx` reads `createTaskRepository()` into `useState`, because fixture tasks never leave the device.

When `EXPO_PUBLIC_USE_FIXTURES` is `false`, `templates/mobile/src/features/auth/service.ts` calls `@reactloom/api-client` from the auth service. A screen that needs refetchable server data should use `useQuery` against that client. Do not park that response on the auth reducer.
<!-- /reactloom:mobile -->

## URL state

A filter belongs in the URL when Back should restore it.

<!-- reactloom:spa -->
`templates/spa/src/app/router.tsx` types the `/tasks` search as `{ status: 'all' | 'open' | 'done' }`. `validateSearch` falls back to `all`. `TasksPage` reads it with `useSearch({ from: '/tasks' })` and writes it with `<Link search={{ status: filter }}>`.

The search value filters the already loaded list in the component. It does not change `taskKeys.list()`. One request fills the cache. The three chips only change what is rendered.

`beforeLoad` on `/tasks` reads `useAuthStore.getState().session` and redirects to `/login`. Use `getState()` there. A hook does not run inside `beforeLoad`.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
This template does not put a task filter in the URL. `/tasks` is the whole list. Navigation uses `next/link` and `router.push` from `templates/ssr/src/app/login/page.tsx`. Add a search param on the page when a filter must survive refresh, and read it from Next's search params. Do not add a second copy in `useState`.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
Expo Router owns the URL. `templates/mobile/app/login.tsx` moves to the next screen with `useRouter()` after a successful sign-in. The task list is not filtered by a search param. Add a route param or search param when a filter must survive leaving the screen, and keep the fixture array in the repository.
<!-- /reactloom:mobile -->

## Form state

React Hook Form holds field values. The schema is the source of the rules. The submit handler sends the parsed values. It does not re-implement them.

<!-- reactloom:spa -->
`templates/spa/src/features/auth/login-page.tsx` uses `useForm<LoginInput>` with `standardSchemaResolver(loginSchema)`. `loginSchema` in `templates/spa/src/features/auth/schema.ts` is `z.email()` and a password of at least 8 characters. Errors render from `form.formState.errors`. The pending flag is `login.isPending` from the mutation, not a separate `useState`.

`templates/spa/src/features/tasks/tasks-page.tsx` uses the same resolver with `createTaskSchema`. On success it calls `form.reset()`.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
`templates/ssr/src/app/login/page.tsx` uses `useForm` and `standardSchemaResolver` with a Zod schema (email, password at least 8 characters). Submit calls `getApi().request` and `router.push('/tasks')`.

The task form in `templates/ssr/src/app/tasks/page.tsx` is local `useState` and checks `title.trim().length < 3` in the submit handler. The route handler repeats that minimum in Zod. Prefer the login page's resolver when you add another field, so the rule lives in one schema.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
`templates/mobile/app/login.tsx` uses `useForm<LoginInput>`, `standardSchemaResolver(loginSchema)`, and `Controller` around each `TextInput`. `loginSchema` is in `templates/mobile/src/features/auth/schema.ts`. React Native inputs are not registered with `form.register`. Use `Controller`.

The task title in `templates/mobile/app/tasks.tsx` is `useState` plus a length check, matching the small fixture form. A form with more than one field should use the login screen's resolver.
<!-- /reactloom:mobile -->

## Client store

The client store is for data that is not server state, not a URL, and not a form.

<!-- reactloom:spa -->
Zustand is used twice, and both stores are small.

`templates/spa/src/lib/theme.ts` stores `theme` and `toggle`. `templates/spa/src/app/shell.tsx` subscribes with selectors (`useTheme((state) => state.theme)`) and toggles `document.documentElement` class `dark`.

`templates/spa/src/features/auth/store.ts` stores the session and writes it to `sessionStorage`. The API client reads the access token with `useAuthStore.getState()` in `templates/spa/src/lib/api.ts`. Login writes the session in `useLogin`. Logout clears it and removes the task queries.

Do not add the task list, the form draft, or the status filter to either store.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
This template does not use Zustand. The session is the httpOnly cookie read in `templates/ssr/src/server/session.ts`. The browser does not keep a token. Theme is not a client store. Query cache and React Hook Form cover the client state that exists.

Add Zustand only for a preference that must survive navigation and is not a cookie, a search param, or a query. Do not store the task list there.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
There is no Zustand store. Auth is a reducer plus context.

`templates/mobile/src/features/auth/reducer.ts` holds `loading`, `anonymous`, or `authenticated`. `templates/mobile/src/features/auth/auth-context.tsx` hydrates from `readToken()` in `templates/mobile/src/lib/token-store.ts` and exposes `useAuth()`. Native tokens use `expo-secure-store`. Web export uses `localStorage`.

The task repository is a module singleton, not a global store. Do not move tasks onto the auth reducer.
<!-- /reactloom:mobile -->
