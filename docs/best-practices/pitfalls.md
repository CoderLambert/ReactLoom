# Common pitfalls

Each one is a mistake this repo is already set up to avoid. The fix is the pattern in the file named here.

## Copying server data into the client store

The task list is server state. A second copy goes stale the moment a mutation settles.

<!-- reactloom:spa -->
**Fix.** Read tasks from `useTasks` in `templates/spa/src/features/tasks/hooks.ts`. Keep `templates/spa/src/features/auth/store.ts` to the session, and `templates/spa/src/lib/theme.ts` to the theme. Logout already drops the list with `queryClient.removeQueries({ queryKey: taskKeys.all })`.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
**Fix.** Read tasks from the `useQuery` in `templates/ssr/src/app/tasks/page.tsx`. Do not add a Zustand store for the list. The session is the cookie in `templates/ssr/src/server/session.ts`, not client state.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
**Fix.** Leave fixture tasks in `templates/mobile/src/features/tasks/repository.ts`. Leave the session in the auth reducer. When a screen starts calling the API, put the response in `useQuery`, not on `useAuth()`.
<!-- /reactloom:mobile -->

## Treating the URL filter as a new query

<!-- reactloom:spa -->
The status chip writes `?status=` through the router. `useTasks` still calls `taskKeys.list()` with no status, and the page filters `tasks.data` in render.

**Fix.** Keep that split. Pass a status into `taskKeys.list(status)` only when the server must return a smaller list. Invalidating `taskKeys.all` still covers both shapes.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
`/tasks` has no status search param. Adding `useState` for a filter duplicates state the URL could hold.

**Fix.** Filter the cached `tasks.data` in render for a local chip. Use a search param if Back should restore it. Keep the query key `['tasks']` until the server filter is real.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
The task screen has no URL filter.

**Fix.** Filter `repository.list()` in render, or add an Expo Router search param. Do not add a second `useState` that copies the filter and the list.
<!-- /reactloom:mobile -->

## Sending the optimistic id to the server

<!-- reactloom:spa -->
`useCreateTask` inserts `tmp-${crypto.randomUUID()}`. That id is local until `invalidateQueries` replaces the row. `setTaskStatus` would 404 if it patched a temp id that the server never stored.

**Fix.** Leave the rollback and the invalidate in `templates/spa/src/features/tasks/hooks.ts`. Do not call `setTaskStatus` with an id that starts with `tmp-` unless you are sure the create request has finished. The settle handler is what swaps in the server id.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
The tasks page does not insert a temporary row. The title is cleared in the submit handler before the request finishes, which is fine because the input is local state, not the cache.

**Fix.** If you add `onMutate`, snapshot `['tasks']`, and invalidate on settle so the temporary id disappears. Do not PATCH that id.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
`createTaskRepository` assigns `task-${tasks.length + 1}`. That id never leaves the device.

**Fix.** Keep using the id the repository returns. If you later POST the task, ignore that local id and use the id in the response.
<!-- /reactloom:mobile -->

## A module-level QueryClient on the server

<!-- reactloom:spa -->
The SPA client in `templates/spa/src/lib/query-client.ts` is a module singleton. That is safe because this app has no server render. Do not import that singleton into a server runtime.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
A `QueryClient` created at module scope is reused across requests. One user's tasks can appear for the next user.

**Fix.** Keep the `useState(() => new QueryClient(...))` in `templates/ssr/src/app/providers.tsx`. Do not hoist it. This template also does not call `HydrationBoundary`. See [Data fetching](data-fetching.md).
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
`templates/mobile/app/_layout.tsx` creates the client inside `useState`. Leave it there so a fast refresh does not share a half-cleared cache with the next mount in a surprising way, and so a future server render cannot pick up a singleton.
<!-- /reactloom:mobile -->

## Reading the session with a hook during a redirect

<!-- reactloom:spa -->
`beforeLoad` in `templates/spa/src/app/router.tsx` cannot call `useAuthStore()`.

**Fix.** Keep `useAuthStore.getState().session`. The store is filled from `sessionStorage` when the module loads, so the snapshot exists before the first paint.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
Client code cannot read the httpOnly cookie, and a Server Component should not invent a token prop to pass down.

**Fix.** Guard in `templates/ssr/src/proxy.ts` and in the route handlers with `readRequestSession()`. The browser sends the cookie because `getApi()` sets `credentials: 'include'`.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
`readToken()` is async. The first paint is `loading` until the context dispatches `hydrated`.

**Fix.** Use `useAuth().status` in the screen. Do not read SecureStore from the component body during render.
<!-- /reactloom:mobile -->

## Repeating a validation rule in the submit handler

<!-- reactloom:spa -->
Login and create-task both use `standardSchemaResolver` and the Zod schema. The submit handler receives typed values.

**Fix.** Add the rule on `loginSchema` or `createTaskSchema`. Render `form.formState.errors`. Keep `isApiError` for the request, which is a different failure from a field error.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
Login uses the resolver. The task form checks `title.trim().length < 3` itself, and `templates/ssr/src/app/api/tasks/route.ts` checks the same minimum with Zod.

**Fix.** For a new field, follow `templates/ssr/src/app/login/page.tsx`: one schema, `standardSchemaResolver`, errors from `form.formState`. Leave the route-handler schema. The server still has to reject a bad request.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
Login uses `Controller` and `loginSchema`. The task screen repeats `next.length < 3`.

**Fix.** A multi-field form should follow `templates/mobile/app/login.tsx`. React Native `TextInput` does not support `form.register`. Keep `Controller`.
<!-- /reactloom:mobile -->

## Importing a dev tool into the production graph

<!-- reactloom:spa -->
`vite build` 会把 React Scan、三个 TanStack devtools 包、`msw/browser`、`msw/http`、`msw/node` 和 `@axe-core/react` 指向空桩。不要给 `msw` 写裸 alias；它会前缀匹配 `msw/browser`，并把 `/browser` 错接到桩路径后面。

**Fix.** React Scan 必须先于 React 从 `templates/spa/src/main.tsx` 导入；统一面板通过 `src/lib/react-scan-controller.ts` 控制扫描，`VITE_REACT_SCAN` 控制初始状态。面板由 `VITE_DEVTOOLS` 控制。MSW 从 `templates/spa/src/mocks` 导入，alias 必须写具体子路径。
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
The same subpath aliases exist on the Next config. `NEXT_PUBLIC_ENABLE_MSW` stays off for the default dev server and for Playwright.

**Fix.** Start the browser worker only from the existing dev check. Do not turn that flag on for `pnpm test:e2e`. Do not import `react-scan` except through `templates/ssr/src/app/react-scan.tsx`.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
MSW, Storybook, `@axe-core/react`, and React Scan are not installed. `templates/mobile/index.js` imports `templates/mobile/src/lib/wdyr.js` first, and that file loads why-did-you-render only in development.

**Fix.** Do not add those web packages to make the dev menu look like the SPA. Fixture mode is `EXPO_PUBLIC_USE_FIXTURES`. The axe DevTools browser extension covers the web preview.
<!-- /reactloom:mobile -->

## Styling past the template

<!-- reactloom:spa -->
A hex in a feature component drifts from `@theme`. A `className` string on `Button` that repeats `bg-ink` fights the variant.

**Fix.** Use the token utilities (`bg-ink`, `text-linen`, `text-copper`). Pass `variant` on `Button`. Merge extras with `cn` inside the primitive, which `templates/spa/src/components/ui/button.tsx` already does. Toggle dark mode through `useTheme`, which sets the `dark` class the `@custom-variant` expects.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
`dark:` on the ghost button does nothing. This CSS file never sets `.dark`, and it has no `@custom-variant dark`.

**Fix.** Stay on the light tokens in `templates/ssr/src/styles/globals.css`. Add the variant and the `.dark` block before you depend on `dark:`. Do not copy `components.json` from another app. This template does not have one.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
A `className` or a Tailwind import will not style a `View`.

**Fix.** Keep styles in the screen's object or in `StyleSheet.create`, as `templates/mobile/src/components/errors/fallback.tsx` does. Reuse the linen and ink values already on `templates/mobile/app/tasks.tsx` (`#f4f0e6`, `#1c1915`).
<!-- /reactloom:mobile -->

## Raising the bundle budget instead of splitting the import

<!-- reactloom:spa -->
`templates/spa/scripts/check-bundle-budget.mjs` fails above 550 KiB total gzip or 280 KiB for the largest chunk.

**Fix.** Open `dist/stats.html` from `pnpm analyze`. Lazy-load the route the way `templates/spa/src/app/router.tsx` already does. Do not bump the numbers for a devtool or a static import of every page.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
`templates/ssr/scripts/check-bundle-budget.mjs` fails above 900 KiB of client JavaScript gzip.

**Fix.** Open `.next/diagnostics/analyze`. Move server-only code under `templates/ssr/src/server`. Do not import it from a `'use client'` page.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
There is no gzip script to raise. A heavy dependency still shows up in Expo Atlas (`.expo/atlas.jsonl` from `pnpm analyze`).

**Fix.** Keep web-only devtools out of `package.json`. Load why-did-you-render only from `templates/mobile/src/lib/wdyr.js`, imported by `templates/mobile/index.js`.
<!-- /reactloom:mobile -->

## Assuming React Compiler will clean up renders

Nothing in this repo enables React Compiler.

**Fix.** Leave render logic as plain components, which is what the screens do now. <!-- reactloom:spa -->Use React Scan's outline in `templates/spa/src/main.tsx` to see the props that changed.<!-- /reactloom:spa --><!-- reactloom:ssr -->Use React Scan's outline from `templates/ssr/src/app/react-scan.tsx` on client components.<!-- /reactloom:ssr --><!-- reactloom:mobile -->Read the why-did-you-render log that starts in `templates/mobile/src/lib/wdyr.js`.<!-- /reactloom:mobile --> Add `useMemo` only after that signal says the render is the problem. See [Performance](performance.md).
