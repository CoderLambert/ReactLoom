# ReactLoom SPA

Vite, React 19, TanStack Router, TanStack Query, Tailwind CSS v4, and a shadcn-style component set.

## Zero to running

```sh
pnpm install
pnpm dev
pnpm test
```

`pnpm dev` opens http://127.0.0.1:4317. It stays closed when `CI` is set or `REACTLOOM_OPEN=false`. From the ReactLoom repo, `pnpm exec create-reactloom studio --template spa --dev` installs and starts this server.

Best practices for this app are in [docs/best-practices/README.md](docs/best-practices/README.md): component organization, state, data fetching, styling, performance, and pitfalls.

```sh
pnpm dev          # http://127.0.0.1:4317
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e:setup   # first Playwright run; on Linux add: --with-deps
pnpm test:e2e
pnpm build        # also checks the gzip budget
pnpm analyze      # writes dist/stats.html
pnpm storybook    # Vite Storybook on port 6006
pnpm build-storybook
```

Sign in with `ada@reactloom.dev` / `loom-demo`. MSW serves `/api/session` and `/api/tasks` when `VITE_ENABLE_MSW=true` (dev only, and the same handlers Storybook uses). `@axe-core/react` logs in the dev server while `VITE_DEVTOOLS` is on. Install the axe DevTools browser extension for a manual pass. Playwright is `pnpm test:e2e`.

`src/features/tasks` is the sample feature: query keys, a list query, an optimistic create mutation, and loading, empty, and error UI. Auth is a route guard, not a second copy of the task list.

## Developer productivity

安装依赖后，统一 `@tanstack/react-devtools` 面板的 Plugins 中有 Query、Router、React Scan 和 Lighthouse，只保留一个悬浮入口。该面板由 `VITE_DEVTOOLS` 控制并懒加载；生产构建把 TanStack devtools 和面板适配器指向 `src/lib/devtools-stub.ts`。Lighthouse 页签可读取最近的本地报告、运行开发首页审计；正式评分仍使用 `pnpm lighthouse`。

React Scan 默认关闭，可直接在统一面板开启或暂停。详细检查工具栏默认收起，需要查看组件名、props、渲染原因时勾选显示。`VITE_REACT_SCAN=true` 仅控制开发启动时自动扫描；`src/main.tsx` 仍把 `react-scan` 放在 React 之前，生产构建将其替换为空桩。

why-did-you-render is not loaded. Vite 8 would inject its JSX import ahead of React Scan. `pnpm analyze` writes `dist/stats.html`. For a console diff on one component, call `useWhyDidYouUpdate` from `@reactloom/devtools`. Do not import it from `src/main.tsx`.

`pnpm storybook` uses `@storybook/react-vite` on port 6006. Stories cover Button, Input, Label, Card, and the login route. The preview starts the same MSW handlers. `@axe-core/react` logs in the dev server while devtools are on, and the Storybook a11y addon covers the workshop. Install the axe DevTools browser extension for a manual pass. `pnpm build` aliases `msw` and `@axe-core/react` to `src/lib/workflow-stub.ts`. `pnpm build-storybook` sets `STORYBOOK=true` so that alias stays off.

Hold Control+Shift+Option on macOS, or Ctrl+Shift+Alt on Windows and Linux, then click. The launcher opens the matching file and position in VS Code by default. Set `LAUNCH_EDITOR` in `.env.local` only when you want another editor. Run `pnpm doctor:editor [file:line]` to diagnose without opening.

`docs/getting-started.md` at the repository root has the rest, including the cases that still need a manual fix.
