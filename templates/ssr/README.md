# ReactLoom SSR

Next.js 16 App Router with an httpOnly session cookie, security headers, a standalone Docker image, and the shared API client.

## Zero to running

```sh
pnpm install
pnpm dev
pnpm test
```

`pnpm dev` starts Next.js and opens http://127.0.0.1:4318. `scripts/open-browser.mjs` does the open step, because `next dev` has no open flag. It stays closed when `CI` is set or `REACTLOOM_OPEN=false`. From the ReactLoom repo, `pnpm exec create-reactloom web --template ssr --dev` installs and starts this server.

Best practices for this app are in [docs/best-practices/README.md](docs/best-practices/README.md): component organization, state, data fetching (including SSR hydration), styling, performance, and pitfalls.

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

安装依赖后，TanStack Query 作为插件运行在统一的 `@tanstack/react-devtools` 面板里，只显示一个悬浮入口。该面板由 `NEXT_PUBLIC_DEVTOOLS` 控制并懒加载；生产构建把 TanStack devtools 包替换为空桩。Next.js 继续使用自己的编译错误 overlay。

React Scan 默认关闭，并使用独立开关。需要时在 `.env.local` 设置 `NEXT_PUBLIC_REACT_SCAN=true` 并重启 `pnpm dev`。`src/app/react-scan.tsx` 仍在 React 之前导入它，`layout.tsx` 继续挂载客户端组件；生产构建以及未显式开启时都通过 `src/lib/react-scan-stub.ts` 使用空实现。

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
