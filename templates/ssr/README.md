# ReactLoom SSR

Next.js 16 App Router with an httpOnly session cookie, security headers, a standalone Docker image, and the shared API client.

```sh
pnpm dev          # http://127.0.0.1:4318
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e:setup   # first Playwright run; on Linux add: --with-deps
pnpm test:e2e
pnpm build
```

From the ReactLoom repo root:

```sh
docker build -f templates/ssr/Dockerfile.monorepo -t reactloom-ssr .
```

After `create-reactloom --template ssr`, build `Dockerfile` from the generated project. Set `SESSION_SECRET` and `REACTLOOM_STRICT_SECRETS=true` outside local development.

`proxy.ts` is the Next.js 16 request proxy. The Next TypeScript plugin is omitted because TypeScript 7 has no programmatic API; `tsc` and `next build` still run.

## Developer productivity

These work after `pnpm install`, including in a project created with `create-reactloom`. Nothing else is required for Biome, format on save, Lefthook, Vitest UI and coverage, TanStack Query devtools, React Scan, or click-to-source. Next.js shows compile errors in its own overlay. This template does not also run vite-plugin-checker.

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
