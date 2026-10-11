<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# SSR template

Agents that walk the directory tree also read any `AGENTS.md` closer to the repository root.

This directory is the Next.js 16 App Router app, package `@reactloom/template-ssr`. Generated projects keep this file as their root instructions. Keep the `nextjs-agent-rules` block above intact. Practices for this app are in `docs/best-practices/README.md` at the project root.

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

开发服务器用 `@tanstack/react-devtools` 的一个悬浮入口承载 Query 插件，并保留懒加载。React Scan 客户端组件仍在 `react` 之前导入包，且是 `layout.tsx` 最上面的 import，但默认不调用；仅当 `NEXT_PUBLIC_REACT_SCAN=true` 时开启。`NEXT_PUBLIC_DEVTOOLS` 继续控制统一 TanStack 面板、axe 日志和点击跳源码。生产构建把 TanStack devtools 与 React Scan 指向 `src/lib/react-scan-stub.ts`；React Scan 未显式开启时，开发构建也使用空桩。Next.js 16 继续使用 SWC 和自己的错误 overlay，不加 Vite checker。why-did-you-render 不加载；需要单组件属性差异时使用 `@reactloom/devtools` 的 `useWhyDidYouUpdate`，不要从 `src/app/layout.tsx` 导入。`pnpm analyze` 写入 `.next/diagnostics/analyze`。Storybook、MSW、Playwright、Lighthouse、安全头与点击跳源码的既有约束不变。

生成器用下面这句精确文本校验 why-did-you-render 的禁用原因：Next.js 16 compiles JSX with SWC on Turbopack and has no app-wide jsxImportSource. why-did-you-render v10 requires that Babel setting, so this template does not load it. React Scan's outline shows the render cause and the props that changed.

## Click-to-source

按住 Ctrl+Shift+Alt（Linux/Windows）或 Control+Shift+Option（macOS）再单击元素；`next.config.ts` 显式配置了这三个 modifier。launcher 会先读 `.env.local` 的 `LAUNCH_EDITOR` / `CODE_EDITOR` / `REACT_EDITOR`（支持带引号的参数）；未配置时默认打开 VS Code 的精确源码位置。Linux 走 `vscode://file` 桌面协议，不强制操作合成器焦点。`REACTLOOM_EDITOR_DEBUG=1` 打印解析过程；`pnpm doctor:editor [文件:行]` 只诊断不打开。

## Do

- Read the Next.js docs under `node_modules/next/dist/docs/` before adding a framework API.
- Keep production security headers, including Content-Security-Policy, on the response.
- Leave the session cookie `httpOnly`.

## Don't

- Do not call `fetch` outside `@reactloom/api-client`.
- Do not import `templates/ssr/src/server` into a client component.
- Do not put `SESSION_SECRET` or any other secret in source, commits, or client bundles.
- Do not finish a change without `pnpm lint`, `pnpm typecheck`, and `pnpm test` in this directory. Run `pnpm test:e2e` when the sign-in or task flow changes.
