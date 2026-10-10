# SPA template

Agents that walk the directory tree also read any `AGENTS.md` closer to the repository root.

This directory is the Vite SPA, package `@reactloom/template-spa`. Generated projects keep this file as their root instructions.

## Stack

Vite, React 19, TanStack Router, and TanStack Query. The route tree is code-based in `templates/spa/src/app/router.tsx` so typechecking does not wait on a file-route generator. Page components are lazy. Authenticated routes redirect in `beforeLoad` using the Zustand session snapshot, which is restored from `sessionStorage` synchronously.

Tailwind CSS v4 and the shadcn aliases in `templates/spa/components.json` style the UI. `cn` lives in `templates/spa/src/lib/utils.ts`.

## Layout

Paths below are from the repository root.

- `templates/spa/src/app` holds the router, shell, and providers.
- `templates/spa/src/features/<name>` holds `schema.ts`, `api.ts`, `keys.ts`, `hooks.ts`, and the screen.
- `templates/spa/src/components` holds shared UI.
- `templates/spa/src/lib/api.ts` creates the `@reactloom/api-client` instance. The package source is `packages/api-client` at the repository root.
- `templates/spa/src/mocks` holds MSW handlers and fixtures.
- `templates/spa/src/test/render.tsx` renders a screen with the router, query client, and i18n provider.

## Commands

From this directory:

| Command | What it does |
| --- | --- |
| `pnpm dev` | Vite on port 4317 |
| `pnpm lint` | Biome |
| `pnpm typecheck` | `tsc` |
| `pnpm test` | Vitest |
| `pnpm test:coverage` | Vitest with the v8 coverage report |
| `pnpm test:ui` | Vitest browser UI |
| `pnpm test:e2e:setup` | Install Playwright Chromium |
| `pnpm test:e2e` | Playwright |
| `pnpm build` | Production build and the gzip budget check |

## API client

Feature API modules call `api.request` with a Zod schema and the query `signal`. Mutations pass `retry: false`. GET retries stay inside the client. Handle `ApiError` instead of inspecting raw responses.

## Testing

Dev server loads TanStack Query and Router devtools, React Scan, and vite-plugin-checker (TypeScript errors in the browser). None of those run in production builds. Click-to-source is `code-inspector-plugin` in `vite.config.ts`, and only while `pnpm dev` is running with `VITE_DEVTOOLS` not `false`. Hold Option+Shift on macOS, or Alt+Shift on Windows and Linux, then click an element. Source maps stay on (`build.sourcemap` and `css.devSourcemap`). Set `CODE_EDITOR`, `LAUNCH_EDITOR`, or `REACT_EDITOR` in `.env.local`. Vitest plus Testing Library. MSW must handle every request the screen makes. Playwright signs in as `ada@reactloom.dev` / `loom-demo`, waits for the heading, then runs axe. Run `pnpm test:e2e:setup` before the first end-to-end run. On Linux, `pnpm test:e2e:setup --with-deps` installs system libraries.

## Do

- Keep server state in TanStack Query. Optimistic updates write the query cache and roll back on error.
- Add routes, query keys, and MSW handlers in the same change as a new request.

## Don't

- Do not call `fetch` outside `@reactloom/api-client`.
- Do not put the access token anywhere except the session store.
- Do not commit `.env` or secrets. Commit `.env.example` only.
- Do not finish a change without `pnpm lint`, `pnpm typecheck`, and `pnpm test` in this directory. Run `pnpm test:e2e` when the sign-in or task flow changes.
