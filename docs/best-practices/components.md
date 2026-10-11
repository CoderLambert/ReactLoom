# Component organization

## Feature folders

A feature owns its schema, its network calls, and its screen. Shared chrome stays outside the feature.

<!-- reactloom:spa -->
`templates/spa/src/features/tasks` is the sample:

| File | Owns |
| --- | --- |
| `schema.ts` | Zod types for a task and the create input |
| `api.ts` | `listTasks`, `createTask`, `setTaskStatus` through the shared client |
| `keys.ts` | TanStack Query keys |
| `hooks.ts` | `useTasks`, `useCreateTask`, `useSetTaskStatus` |
| `tasks-page.tsx` | The screen |

`templates/spa/src/features/auth` follows the same split and adds `store.ts` for the session snapshot. `templates/spa/src/features/home/home-page.tsx` is only a screen, because home has no request of its own.

`templates/spa/src/app` is not a feature. `router.tsx` declares routes, `shell.tsx` is the frame, and `providers.tsx` mounts Query, i18n, and the error boundary.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
This app colocates a route with its `page.tsx` instead of a `src/features` directory.

| Path | Owns |
| --- | --- |
| `templates/ssr/src/app/page.tsx` | Server-rendered home |
| `templates/ssr/src/app/login/page.tsx` | Client login form |
| `templates/ssr/src/app/tasks/page.tsx` | Client task list |
| `templates/ssr/src/app/tasks/loading.tsx` | Route loading UI |
| `templates/ssr/src/app/api/tasks/route.ts` | GET and POST for tasks |
| `templates/ssr/src/server/tasks.ts` | The in-memory task record, imported by server code only |
| `templates/ssr/src/server/session.ts` | Reading the httpOnly session cookie |

Do not import `templates/ssr/src/server` from a client component. Client screens call `getApi()` in `templates/ssr/src/lib/api.ts` and hit the route handlers.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
Screens stay in the Expo Router tree. Logic stays in the feature folder.

| Path | Owns |
| --- | --- |
| `templates/mobile/app/tasks.tsx` | The task screen |
| `templates/mobile/app/login.tsx` | The login screen |
| `templates/mobile/app/index.tsx` | The home screen |
| `templates/mobile/app/_layout.tsx` | Providers and the error boundary |
| `templates/mobile/src/features/tasks/repository.ts` | The in-memory task list |
| `templates/mobile/src/features/auth` | Schema, reducer, service, and context |

The screen calls the repository or `useAuth()`. It does not talk to SecureStore or the API client itself.
<!-- /reactloom:mobile -->

## Colocation

Keep the test, and the story when there is one, next to the screen they cover.

<!-- reactloom:spa -->
`templates/spa/src/features/tasks/tasks.test.tsx` sits beside `tasks-page.tsx`. `templates/spa/src/features/auth/login-page.stories.tsx` sits beside `login-page.tsx`. Shared primitives do the same: `templates/spa/src/components/ui/button.stories.tsx` is next to `button.tsx`.

There is no top-level `__tests__` directory. `templates/spa/src/test/render.tsx` is the shared renderer (router, query client, i18n), not a home for feature tests.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
`templates/ssr/src/server/session.test.ts` and `templates/ssr/src/server/tasks.test.ts` sit next to the modules they cover. `templates/ssr/src/app/login/page.stories.tsx` sits next to the login page. UI stories sit next to `templates/ssr/src/components/ui`.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
`templates/mobile/src/features/tasks/repository.test.ts` and `templates/mobile/src/features/auth/reducer.test.ts` sit next to the module they cover. The Maestro flow is `.maestro/login.yaml` because it drives the built app, not a single module.
<!-- /reactloom:mobile -->

## Shared components and feature components

A component moves to `src/components` when a second feature needs it. Until then it stays in the feature.

<!-- reactloom:spa -->
`templates/spa/src/components/ui` is the shared set: `button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`. `templates/spa/src/components/layout/skip-link.tsx` is shared chrome. The task list markup stays in `templates/spa/src/features/tasks/tasks-page.tsx` because only that screen renders it.

`templates/spa/components.json` maps the shadcn aliases (`ui` to `@/components/ui`, `utils` to `@/lib/utils`). Add a primitive there. Do not put a feature screen under `components/ui`.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
`templates/ssr/src/components/ui` repeats the same primitives (`button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`) for Storybook and login. Route screens stay in `templates/ssr/src/app`. This template has no `components.json`. Copy the `Button` pattern when you add a primitive. Do not point the shadcn CLI at the SPA config.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
`templates/mobile/src/components/errors/fallback.tsx` is the shared error boundary. Task and login markup stay in `templates/mobile/app/tasks.tsx` and `templates/mobile/app/login.tsx`. There is no `components/ui` package and no Tailwind primitive layer.
<!-- /reactloom:mobile -->

## Naming

| Kind | Pattern | Example |
| --- | --- | --- |
| File | kebab-case | `login-page.tsx`, `query-client.ts` |
| Component | PascalCase function | `LoginPage`, `TasksPage`, `Button` |
| Hook | `use` prefix, in `hooks.ts` or a `use-*.ts` file | `useTasks`, `useLogin` |
| Query keys | `<feature>Keys` object | `taskKeys` |
| Schema | `<name>Schema` and a type from `z.infer` | `loginSchema`, `LoginInput` |
| Route file | the framework's name | `page.tsx` on Next, `tasks.tsx` on Expo Router |

<!-- reactloom:spa -->
Pages are named for the screen (`TasksPage` in `tasks-page.tsx`), not `index`. The router in `templates/spa/src/app/router.tsx` is code-based. Do not add a file-route generator beside it.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
App Router files keep Next's names: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`. The default export is the page. A named client child is fine when the page itself must stay a Server Component.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
Expo Router files match the URL: `app/tasks.tsx` is `/tasks`. The default export is the screen. Feature modules use named exports (`createTaskRepository`, `useAuth`).
<!-- /reactloom:mobile -->
