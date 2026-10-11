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

安装依赖后，统一 `@tanstack/react-devtools` 面板的 Plugins 中有 Query、React Scan 和 Lighthouse，只显示一个悬浮入口。该面板由 `NEXT_PUBLIC_DEVTOOLS` 控制并懒加载；生产构建把 TanStack 包和面板适配器替换为空桩。Lighthouse 页签可读取最近的本地报告、运行开发首页审计；正式评分仍使用 `pnpm lighthouse`。Next.js 继续使用自己的编译错误 overlay。

React Scan 默认关闭，可直接在统一面板开启或暂停；详细检查工具栏按需显示。`NEXT_PUBLIC_REACT_SCAN=true` 可设置启动时自动扫描。`src/app/react-scan.tsx` 仍在 React 之前导入它，`layout.tsx` 继续挂载客户端组件；生产构建使用空实现，开发工具和扫描启动开关都关闭时也使用空桩。

why-did-you-render is not loaded. Next.js 16 compiles JSX with SWC on Turbopack and has no app-wide `jsxImportSource`. `pnpm analyze` writes `.next/diagnostics/analyze`. `ANALYZE=true next build --webpack` still writes `.next/analyze` through `@next/bundle-analyzer`. For a console diff on one component, call `useWhyDidYouUpdate` from `@reactloom/devtools`. Do not import it from the app layout.

`pnpm storybook` uses `@storybook/nextjs` on port 6007. Stories cover Button, Input, Label, Card, and the login page, with MSW and the a11y addon. `NEXT_PUBLIC_ENABLE_MSW` defaults to false so Playwright hits the route handlers. Set it to true in `.env.local` to start those handlers in `pnpm dev`. `@axe-core/react` logs while devtools are on. Install the axe DevTools browser extension for a manual pass. Playwright stays `pnpm test:e2e`.

Hold Control+Shift+Option on macOS, or Ctrl+Shift+Alt on Windows and Linux, then click. The Next.js error overlay uses the same launcher, which opens the matching file and position in VS Code by default. Set `LAUNCH_EDITOR` in `.env.local` only when you want another editor. Run `pnpm doctor:editor [file:line]` to diagnose without opening.

`docs/getting-started.md` at the repository root has the rest, including the cases that still need a manual fix.
