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
| `pnpm build` | `next build` and the gzip budget check |

## API client

Route handlers and server modules may use the client or the local task module. Client components call `getApi().request` with a Zod schema, the query `signal`, and `retry: false` on writes. The browser sends the cookie. It does not attach a bearer token.

## Testing

Dev server loads TanStack Query devtools and React Scan. Next.js shows its own error overlay, so there is no Vite checker. Vitest covers session cookies and security headers beside `templates/ssr/src/server`. Playwright signs in as `ada@reactloom.dev` / `loom-demo`, waits for the heading, then runs axe. Run `pnpm test:e2e:setup` before the first end-to-end run. On Linux, `pnpm test:e2e:setup --with-deps` installs system libraries.

## Do

- Read the Next.js docs under `node_modules/next/dist/docs/` before adding a framework API.
- Keep production security headers, including Content-Security-Policy, on the response.
- Leave the session cookie `httpOnly`.

## Don't

- Do not call `fetch` outside `@reactloom/api-client`.
- Do not import `templates/ssr/src/server` into a client component.
- Do not put `SESSION_SECRET` or any other secret in source, commits, or client bundles.
- Do not finish a change without `pnpm lint`, `pnpm typecheck`, and `pnpm test` in this directory. Run `pnpm test:e2e` when the sign-in or task flow changes.
