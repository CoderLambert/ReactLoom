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
| `pnpm storybook` | Storybook on port 6006 |
| `pnpm build-storybook` | Static Storybook build |
| `pnpm build` | Production build and the gzip budget check |

## API client

Feature API modules call `api.request` with a Zod schema and the query `signal`. Mutations pass `retry: false`. GET retries stay inside the client. Handle `ApiError` instead of inspecting raw responses.

## Testing

Dev server loads TanStack Query and Router devtools, React Scan, and vite-plugin-checker (TypeScript errors in the browser). The Vite overlay stays on. `src/components/errors/fallback.tsx` shows a dev-only source-mapped stack, and a project frame opens in the editor. `server.open` opens http://127.0.0.1:4317 unless `CI` is set or `REACTLOOM_OPEN=false`. React Scan is imported from `react-scan` at the top of `src/main.tsx`, before React, and `scan({ enabled: true })` runs when `VITE_DEVTOOLS` is not `false`. `vite build` aliases `react-scan` to `src/lib/devtools-stub.ts`. None of those panels run in production builds. why-did-you-render v10 needs its package as the automatic JSX importSource. Vite 8 injects that import before React, which runs ahead of React Scan, so this template does not load why-did-you-render. React Scan's outline shows the render cause and the props that changed. `pnpm analyze` is `ANALYZE=true vite build` and writes `dist/stats.html` through rollup-plugin-visualizer. Opt into a console props diff with `useWhyDidYouUpdate` from `@reactloom/devtools`. Do not import that hook from `src/main.tsx`. Click-to-source is `code-inspector-plugin` in `vite.config.ts`, and only while `pnpm dev` is running with `VITE_DEVTOOLS` not `false`. `.env.development` turns that on and leaves the editor unset. `scripts/open-in-editor.mjs` opens a Neovim server (`nvim --listen .nvim.sock`), then a running Cursor or VS Code. Hold Option+Shift on macOS, or Alt+Shift on Windows and Linux, then click an element. Saving the file hot-reloads. Source maps stay on (`build.sourcemap` and `css.devSourcemap`). If detection fails, run `nvim --listen .nvim.sock` or set `CODE_EDITOR=cursor` in `.env.local`. Vitest plus Testing Library. MSW must handle every request the screen makes. `VITE_ENABLE_MSW=true` also starts that same `src/mocks/handlers.ts` in the dev server. Storybook 10.6.1 uses `@storybook/react-vite` in `.storybook/main.ts`, with stories for the primitives and the login route, `msw-storybook-addon`, and `@storybook/addon-a11y`. `@axe-core/react` logs in `pnpm dev` while `VITE_DEVTOOLS` is on. Install the axe DevTools browser extension for a manual pass. Playwright signs in as `ada@reactloom.dev` / `loom-demo`, waits for the heading, then runs axe. Run `pnpm test:e2e:setup` before the first end-to-end run. On Linux, `pnpm test:e2e:setup --with-deps` installs system libraries. Production builds alias `msw` and `@axe-core/react` to `src/lib/workflow-stub.ts` unless `STORYBOOK=true`.

## Do

- Keep server state in TanStack Query. Optimistic updates write the query cache and roll back on error.
- Add routes, query keys, and MSW handlers in the same change as a new request.

## Don't

- Do not call `fetch` outside `@reactloom/api-client`.
- Do not put the access token anywhere except the session store.
- Do not commit `.env` or secrets. Commit `.env.example` only.
- Do not finish a change without `pnpm lint`, `pnpm typecheck`, and `pnpm test` in this directory. Run `pnpm test:e2e` when the sign-in or task flow changes.
