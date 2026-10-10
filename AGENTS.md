# ReactLoom

This file is the source of truth for coding agents. Tool-specific files point here or add glob-scoped rules. A nearer `AGENTS.md` under `templates/` adds rules for that template and wins when the two disagree.

## Architecture

ReactLoom is a pnpm workspace. Templates are developed in-tree and copied by `create-reactloom` into standalone projects. Shared code lives in `packages/`. The CLI copies only what that template's `template.json` lists, so a generated app does not stay coupled to this git repo and does not receive other templates' files.

| Path | Role |
| --- | --- |
| `packages/api-client` | Framework-free HTTP client (`@reactloom/api-client`) |
| `packages/create-reactloom` | Init CLI |
| `packages/tsconfig` | Shared TypeScript presets |
| `templates/spa` | Vite SPA |
| `templates/ssr` | Next.js App Router app, plus Docker |
| `templates/mobile` | Expo app |
| `docs/adr` | Architecture decisions |

TypeScript is `strict` (7.0.2). React is 19.3.0 on web. Expo SDK 57 pins React 19.2.3, so the mobile template stays on that peer. Biome formats and lints. `tsc` typechecks. Changesets version `@reactloom/api-client` and `create-reactloom`. Templates are not published.

## How the templates differ

| | SPA | SSR | Mobile |
| --- | --- | --- | --- |
| Package | `@reactloom/template-spa` | `@reactloom/template-ssr` | `@reactloom/template-mobile` |
| Runtime | Vite 8 | Next.js 16 App Router | Expo SDK 57, Expo Router |
| Routing | Code-based TanStack Router tree in `templates/spa/src/app/router.tsx`. Routes are lazy. File-based generation is not used, so `tsc` does not depend on a generate step. | App Router files under `templates/ssr/src/app`. `templates/ssr/src/proxy.ts` is the request interceptor (`middleware.ts` is the old convention). | File routes under `templates/mobile/app`. |
| Server state | TanStack Query | TanStack Query inside the client `Providers` boundary | TanStack Query |
| Client state | Zustand for theme and the session snapshot only | Cookie session. No Zustand store. | Auth reducer plus secure storage |
| Session | Access token in `sessionStorage`, read synchronously so the router guard does not race a hydration effect | `jose` HS256 JWT in the `rl_session` httpOnly cookie. `REACTLOOM_STRICT_SECRETS=true` refuses the documented development secret. | `expo-secure-store` on native, `localStorage` on web export |
| HTTP auth | Bearer token from the auth store | `credentials: 'include'` so the cookie is sent. The browser does not read the token. | Bearer token from the token store |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite`, shadcn-style `components.json` | Tailwind CSS v4 via `@tailwindcss/postcss` | React Native styles |
| Env prefix | `VITE_` | `NEXT_PUBLIC_` for client values. `SESSION_SECRET` is server-only. | `EXPO_PUBLIC_` |
| Tests | Vitest, Testing Library, MSW, Playwright + axe | Vitest, Playwright + axe | Vitest. Maestro flow is not run in CI. |

The fixture account on every template is `ada@reactloom.dev` / `loom-demo`. It is local demo data.

## Commands

From the repository root:

| Command | What it does |
| --- | --- |
| `pnpm dev:spa` | SPA on port 4317 |
| `pnpm dev:ssr` | SSR on port 4318 |
| `pnpm dev:mobile` | Expo dev server |
| `pnpm lint` | Biome check |
| `pnpm typecheck` | `tsc` in every package |
| `pnpm test` | Unit and integration tests |
| `pnpm test:e2e:setup` | Install Playwright Chromium for SPA and SSR |
| `pnpm test:e2e` | Playwright for SPA and SSR |
| `pnpm build` | Library, both web apps, and Expo web export |
| `pnpm exec create-reactloom` | Scaffold an app in the current directory |
| `pnpm create-reactloom` | Same CLI, rebuilding it first |

`create-reactloom` is a root devDependency, so `pnpm exec create-reactloom` works from the repository root. The generated app is created in that current directory, or at the path you pass (`../outside/web`). It is not created inside `packages/create-reactloom`. `pnpm create` is pnpm's built-in initializer and does not run this CLI.

Template choice is still the interactive prompt or `--template spa|ssr|mobile`. What gets copied is `templates/<id>/template.json`:

| Field | Selects |
| --- | --- |
| `packages.api-client` | `packages/api-client` when `true` |
| `packages.tsconfig` | Preset filenames. The copied package exports only these. SPA is `base.json`, `react.json`, `vite.json`, `node.json` (not `next.json` or `expo.json`). SSR swaps in `next.json`. Mobile swaps in `expo.json`. Every template that copies the API client lists `node.json`. |
| `configs` | Repo-root files: `.npmrc`, `.editorconfig`, `biome.json`, `lefthook.yml`, `commitlint.config.mjs`, `.changeset/config.json`, `.changeset/README.md`, `renovate.json` |
| `ci` | The template's own `.github/workflows/ci.yml`. The monorepo workflow is not copied. |
| `docker` | `true` only for SSR, which keeps `Dockerfile` |
| `ai.pointers` | `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/mcp.json` |
| `ai.rules` | That template's Cursor rules only (`general` plus `spa`, `ssr`, or `mobile`, plus `testing`) |
| `docs` | ADRs 0003, 0004, 0005, and 0006. ADR 0001 and 0002 stay in this repo. |

To add a shared file to a template, put its repo-root path (or preset filename) in that template's `template.json`. A file that lives only in the template directory is copied with the template; do not list it under `configs`. Include every tsconfig preset the new preset extends. Listing Biome, Lefthook, Commitlint, or Changesets also adds that tool's devDependency from the root `package.json`, and Lefthook is written to `onlyBuiltDependencies`. Leaving a tool out removes its devDependency and the `lint`, `changeset`, or `version-packages` script that would call it. Nest, Next, Expo, and Vite dependencies and scripts are removed when that framework's preset is not listed. Do not give an SPA a Nest config, `next.json`, or `expo.json`.

Inside a template directory, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` run for that package. SPA and SSR also have `pnpm test:e2e:setup` and `pnpm test:e2e`.

Before the first Playwright run, install browsers with `pnpm test:e2e:setup`. On Linux, use `pnpm test:e2e:setup --with-deps` so system libraries are installed too. pnpm 10 skips dependency build scripts unless they are listed. `pnpm-workspace.yaml` sets `onlyBuiltDependencies` to `lefthook`, so install registers the git hooks. Trust another package by adding it there or by running `pnpm approve-builds`.

Node is 22.14 or newer (`.nvmrc` is `22`). The package manager is pnpm 10.33.3. Use pnpm, including `pnpm exec`, for every install and script.

## Directory conventions

SPA source:

```
templates/spa/src/
├── app/           # router, shell, providers
├── features/      # one folder per feature
├── components/    # ui and layout
├── hooks/
├── lib/           # env, api, query client, i18n, monitoring
├── styles/
├── mocks/         # MSW
└── test/
```

A feature folder contains the schema, the API functions, the query keys, and the hooks. UI for that feature stays in the same folder. Cross-feature primitives go in `components/` or `hooks/`.

SSR keeps server-only modules in `templates/ssr/src/server` (`env`, `session`, `security-headers`, `tasks`). Route handlers live in `templates/ssr/src/app/api`. Client components are marked `'use client'`.

Mobile screens live in `templates/mobile/app`. Feature logic lives in `templates/mobile/src/features`. The session token crosses native and web only through `templates/mobile/src/lib/token-store.ts`.

File names are kebab-case. Component functions are PascalCase. Hooks start with `use`. Export types from Zod schemas with `z.infer`. Web UI imports `cn` from `@/lib/utils`.

## API client

Import `createApiClient` from `@reactloom/api-client`. Construct one client per app in the template's API module (`templates/spa/src/lib/api.ts`, `templates/ssr/src/lib/api.ts`, or the mobile auth service) and call it from feature API functions.

```ts
return api.request('/api/tasks', taskListSchema, { signal })
```

- Pass a schema with `parse`. Zod schemas qualify.
- Pass the TanStack Query `signal` through so navigation cancels the request.
- Set `retry: false` on POST, PATCH, and other non-idempotent calls. GET and HEAD retry with backoff and honor `Retry-After`.
- Handle `ApiError`. Codes are `network`, `timeout`, `aborted`, `http`, `validation`, and `unauthorized`.
- Query defaults skip retry on 401, 403, 404, validation, and abort. See `templates/spa/src/lib/query-client.ts`.

The client joins the base URL, sends JSON, attaches a bearer token when `getAccessToken` returns one, and aborts on caller cancel or timeout. See `docs/adr/0004-api-client.md`.

## Testing

- Unit and integration tests use Vitest. SPA component tests go through `templates/spa/src/test/render.tsx`.
- SPA HTTP tests use MSW. `templates/spa/src/test/setup.ts` fails the test when a request has no handler.
- Playwright covers SPA and SSR. Run `pnpm test:e2e:setup` before the first end-to-end run, and add `--with-deps` on Linux. The axe scan runs after the heading is visible. `color-contrast` is disabled in the current specs.
- Mobile CI runs Vitest and `expo export --platform web`. The Maestro flow at `templates/mobile/.maestro/login.yaml` is local device coverage.
- Add a changeset when you change `@reactloom/api-client` or `create-reactloom` behavior.

After a code change, run the narrowest check that proves it, then the workspace checks the change can affect:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --filter @reactloom/template-spa test:e2e` or the SSR equivalent when a web flow changed
- `pnpm build` when the build, bundle budget, or public types changed

## Do

- Call HTTP through `@reactloom/api-client`.
- Keep server state in TanStack Query. Zustand holds theme, and on the SPA the synchronous session snapshot.
- Validate environment variables with the t3 env schema in that template. Commit `.env.example` only.
- Keep secrets and server-only modules on the server. SSR client code uses the cookie session.
- Follow Biome: single quotes, semicolons as needed, trailing commas, `import type` for type-only imports, no `any`.
- Preserve the Next.js agent block in `templates/ssr/AGENTS.md` between `BEGIN:nextjs-agent-rules` and `END:nextjs-agent-rules`.
- Read the Next.js guide in `templates/ssr/node_modules/next/dist/docs/` before writing Next.js APIs. This repo uses Next.js 16, including `proxy.ts`.

## Don't

- Do not call `fetch` from feature code, route modules, or tests that are exercising the app. The API client is the only HTTP wrapper. Tests may use MSW to intercept the client.
- Do not put tokens, `SESSION_SECRET`, or any other secret in source, commits, `.cursor/mcp.json`, or client bundles. `.env` stays untracked.
- Do not copy query results into Zustand.
- Do not import `templates/ssr/src/server/*` from a client component.
- Do not weaken the SSR security headers in `templates/ssr/src/server/security-headers.ts`, or store the session anywhere the browser script can read.
- Do not store the mobile session in AsyncStorage. Use `templates/mobile/src/lib/token-store.ts`.
- Do not bump mobile React ahead of the Expo SDK peer.
- Do not finish a change without running the checks that cover it.
