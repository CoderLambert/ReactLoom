<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SSR template

Agents that walk the directory tree also read any `AGENTS.md` closer to the repository root.

This directory is the Next.js 16 App Router app, package `@reactloom/template-ssr`. Generated projects keep this file as their root instructions. Keep the `nextjs-agent-rules` block above intact.

## Stack

Next.js 16 with `output: 'standalone'`. `templates/ssr/src/proxy.ts` guards `/tasks`. Server modules live in `templates/ssr/src/server`: env, `jose` session, security headers, and the task record. Tailwind CSS v4 is loaded through PostCSS.

The session is an HS256 JWT in the `rl_session` httpOnly cookie. Client calls use `getApi()` from `templates/ssr/src/lib/api.ts` with `credentials: 'include'`. `SESSION_SECRET` is server-only. `REACTLOOM_STRICT_SECRETS=true` refuses the development fallback in `templates/ssr/src/server/env.ts`.

## Layout

Paths below are from the repository root.

- `templates/ssr/src/app` holds routes. The root layout is a Server Component. Login, tasks, and providers are client components.
- `templates/ssr/src/app/api` holds route handlers for the session and tasks.
- `templates/ssr/src/server` is imported by server code only.
- `templates/ssr/next.config.ts` registers `headersFor` on every path and disables `poweredByHeader`.
- `packages/api-client` at the repository root is the HTTP client.

## Commands

From this directory:

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js on port 4318 |
| `pnpm lint` | Biome |
| `pnpm typecheck` | `tsc` |
| `pnpm test` | Vitest |
| `pnpm test:coverage` | Vitest with the v8 coverage report |
| `pnpm test:ui` | Vitest browser UI |
| `pnpm test:e2e:setup` | Install Playwright Chromium |
| `pnpm test:e2e` | Playwright |
| `pnpm storybook` | Storybook on port 6007 |
| `pnpm build-storybook` | Static Storybook build |
| `pnpm build` | `next build` and the gzip budget check |

## API client

Route handlers and server modules may use the client or the local task module. Client components call `getApi().request` with a Zod schema, the query `signal`, and `retry: false` on writes. The browser sends the cookie. It does not attach a bearer token.

## Testing

Dev server loads TanStack Query devtools and React Scan. React Scan is the client component `src/app/react-scan.tsx`: it imports `react-scan` before `react`, calls `scan({ enabled: true })` in `useEffect`, and is the top-most import in `src/app/layout.tsx`. Production builds and `NEXT_PUBLIC_DEVTOOLS=false` alias `react-scan` to `src/lib/react-scan-stub.ts`, so the client bundle does not include the library. Next.js 16 compiles JSX with SWC on Turbopack and has no app-wide jsxImportSource. why-did-you-render v10 requires that Babel setting, so this template does not load it. React Scan's outline shows the render cause and the props that changed. `pnpm analyze` is `next analyze --output` and writes `.next/diagnostics/analyze`. `@next/bundle-analyzer` remains for `ANALYZE=true next build --webpack`, which writes `.next/analyze`. Opt into a console props diff with `useWhyDidYouUpdate` from `@reactloom/devtools`. Do not import that hook from `src/app/layout.tsx`. Next.js shows its own error overlay, so there is no Vite checker. `src/app/error.tsx` shows a dev-only source-mapped stack and opens a frame through `/__nextjs_launch-editor`. `scripts/open-browser.mjs` opens http://127.0.0.1:4318 unless `CI` is set or `REACTLOOM_OPEN=false`. Click-to-source is `code-inspector-plugin` on the Turbopack rules in `next.config.ts`, including Server Components. It adds no rules when `NODE_ENV` is `production` or `NEXT_PUBLIC_DEVTOOLS` is `false`. `.env.development` turns devtools on and leaves the editor unset. `scripts/open-in-editor.mjs` opens a Neovim server (`nvim --listen .nvim.sock`), then a running Cursor or VS Code. Hold Option+Shift on macOS, or Alt+Shift on Windows and Linux, then click an element. Saving the file hot-reloads. The Next.js error overlay opens a file through `/__nextjs_launch-editor`, which also goes through that launcher. If detection fails, run `nvim --listen .nvim.sock` or set `REACT_EDITOR=cursor` in `.env.local`. Production browser source maps stay off. Vitest covers session cookies and security headers beside `templates/ssr/src/server`. Storybook 10.6.1 uses `@storybook/nextjs` in `.storybook/main.ts`, with stories for the primitives and the login page, `msw-storybook-addon`, and `@storybook/addon-a11y`. `NEXT_PUBLIC_ENABLE_MSW` defaults to false. Set it to true in `.env.local` and `src/app/dev-client.tsx` starts `src/mocks/handlers.ts` in development only. Playwright leaves the flag off and hits the route handlers. `@axe-core/react` logs from that same client while devtools are on. Install the axe DevTools browser extension for a manual pass. Playwright signs in as `ada@reactloom.dev` / `loom-demo`, waits for the heading, then runs axe. Run `pnpm test:e2e:setup` before the first end-to-end run. On Linux, `pnpm test:e2e:setup --with-deps` installs system libraries. Production builds alias `msw` and `@axe-core/react` to `src/lib/workflow-stub.ts` unless `STORYBOOK=true`.

## Do

- Read the Next.js docs under `node_modules/next/dist/docs/` before adding a framework API.
- Keep production security headers, including Content-Security-Policy, on the response.
- Leave the session cookie `httpOnly`.

## Don't

- Do not call `fetch` outside `@reactloom/api-client`.
- Do not import `templates/ssr/src/server` into a client component.
- Do not put `SESSION_SECRET` or any other secret in source, commits, or client bundles.
- Do not finish a change without `pnpm lint`, `pnpm typecheck`, and `pnpm test` in this directory. Run `pnpm test:e2e` when the sign-in or task flow changes.
