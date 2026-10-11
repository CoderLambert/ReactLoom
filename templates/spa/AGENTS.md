# SPA template

Agents that walk the directory tree also read any `AGENTS.md` closer to the repository root.

This directory is the Vite SPA, package `@reactloom/template-spa`. Generated projects keep this file as their root instructions. Practices for this app are in `docs/best-practices/README.md` at the project root.

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

开发服务器用 `@tanstack/react-devtools` 的一个悬浮入口承载 Query 与 Router 插件，并保留懒加载。React Scan 仍是 `src/main.tsx` 的首个 import，但默认不调用；仅当 `VITE_REACT_SCAN=true` 时开启。`VITE_DEVTOOLS` 继续控制统一 TanStack 面板、axe 日志和点击跳源码。`vite build` 把 React Scan 与三个 TanStack devtools 包指向 `src/lib/devtools-stub.ts`，生产包不得包含调试实现。Vite overlay 与 vite-plugin-checker 继续显示 TypeScript 错误。`src/components/errors/fallback.tsx` 显示开发态 source-mapped 栈。`server.open` 在未设置 `CI` 且 `REACTLOOM_OPEN` 不是 false 时打开 http://127.0.0.1:4317。why-did-you-render 不加载；需要单组件属性差异时使用 `@reactloom/devtools` 的 `useWhyDidYouUpdate`，不要从 `src/main.tsx` 导入。`pnpm analyze` 写入 `dist/stats.html`。Storybook、MSW、Playwright、Lighthouse 与点击跳源码的既有约束不变。

生成器用下面这句精确文本校验 why-did-you-render 的禁用原因：why-did-you-render v10 needs its package as the automatic JSX importSource. Vite 8 injects that import before React, which runs ahead of React Scan, so this template does not load why-did-you-render. React Scan's outline shows the render cause and the props that changed.

## Do

- Keep server state in TanStack Query. Optimistic updates write the query cache and roll back on error.
- Add routes, query keys, and MSW handlers in the same change as a new request.

## Don't

- Do not call `fetch` outside `@reactloom/api-client`.
- Do not put the access token anywhere except the session store.
- Do not commit `.env` or secrets. Commit `.env.example` only.
- Do not finish a change without `pnpm lint`, `pnpm typecheck`, and `pnpm test` in this directory. Run `pnpm test:e2e` when the sign-in or task flow changes.
