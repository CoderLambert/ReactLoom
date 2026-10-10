# ReactLoom SSR

Next.js 16 App Router with an httpOnly session cookie, security headers, a standalone Docker image, and the shared API client.

## Zero to running

```sh
pnpm install
pnpm dev
pnpm test
```

`pnpm dev` starts Next.js and opens http://127.0.0.1:4318. `scripts/open-browser.mjs` does the open step, because `next dev` has no open flag. It stays closed when `CI` is set or `REACTLOOM_OPEN=false`. From the ReactLoom repo, `pnpm exec create-reactloom web --template ssr --dev` installs and starts this server.

```sh
pnpm dev          # http://127.0.0.1:4318
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e:setup   # first Playwright run; on Linux add: --with-deps
pnpm test:e2e
pnpm build
pnpm analyze      # writes .next/diagnostics/analyze
pnpm storybook    # Next.js Storybook on port 6007
pnpm build-storybook
```

From the ReactLoom repo root:

```sh
docker build -f templates/ssr/Dockerfile.monorepo -t reactloom-ssr .
```

After `create-reactloom --template ssr`, build `Dockerfile` from the generated project. Set `SESSION_SECRET` and `REACTLOOM_STRICT_SECRETS=true` outside local development.

`proxy.ts` is the Next.js 16 request proxy. The Next TypeScript plugin is omitted because TypeScript 7 has no programmatic API; `tsc` and `next build` still run.

## Developer productivity

These work after `pnpm install`, including in a project created with `create-reactloom`. Nothing else is required for Biome, format on save, Lefthook, Vitest UI and coverage, TanStack Query devtools, React Scan, or click-to-source. Next.js shows compile errors in its own overlay. This template does not also run vite-plugin-checker.

React Scan lives in `src/app/react-scan.tsx`. That client component imports `react-scan` before React, and `src/app/layout.tsx` mounts it. In `pnpm dev`, hover an element to see its component name, props, and render time. Re-renders are highlighted, and the outline lists the props that changed. Production builds alias `react-scan` to `src/lib/react-scan-stub.ts`, so the client bundle does not include the library.

why-did-you-render is not loaded. Next.js 16 compiles JSX with SWC on Turbopack and has no app-wide `jsxImportSource`. `pnpm analyze` writes `.next/diagnostics/analyze`. `ANALYZE=true next build --webpack` still writes `.next/analyze` through `@next/bundle-analyzer`. For a console diff on one component, call `useWhyDidYouUpdate` from `@reactloom/devtools`. Do not import it from the app layout.

`pnpm storybook` uses `@storybook/nextjs` on port 6007. Stories cover Button, Input, Label, Card, and the login page, with MSW and the a11y addon. `NEXT_PUBLIC_ENABLE_MSW` defaults to false so Playwright hits the route handlers. Set it to true in `.env.local` to start those handlers in `pnpm dev`. `@axe-core/react` logs while devtools are on. Install the axe DevTools browser extension for a manual pass. Playwright stays `pnpm test:e2e`.

Hold Option+Shift on macOS, or Alt+Shift on Windows and Linux, then click. The Next.js error overlay's Open in editor uses the same launcher. The editor is a running Neovim server, then Cursor, then VS Code.

Neovim needs one step. The dev server cannot open a new nvim window:

```sh
nvim --listen .nvim.sock
```

Or in `init.lua`:

```lua
local sock = vim.fn.getcwd() .. "/.nvim.sock"
local uv = vim.uv or vim.loop
if uv.fs_stat(sock) == nil then
  pcall(vim.fn.serverstart, sock)
end
```

`docs/getting-started.md` at the repository root has the rest, including the cases that still need a manual fix.
