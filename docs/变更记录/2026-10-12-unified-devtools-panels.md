# SPA 与 SSR 统一开发工具面板

- Date: 2026-10-12
- Branch: `fix/devtools-consolidate` (delivery target: `main`)
- Delivery scope: 在 SPA 和 SSR 的 TanStack Devtools 中集成 React Scan 控制与本地 Lighthouse 报告/开发审计。

## Change objective

用户希望在页面现有的 TanStack Devtools 入口中找到 React Scan 与 Lighthouse。此前 React Scan 只能通过环境变量在启动时开启，Lighthouse 只能从命令行运行并查看报告。此改动把它们加入 SPA 和 SSR 的统一开发工具插件列表。

## Actual changes

| File or area | Module | What changed |
| --- | --- | --- |
| `packages/devtools/src/{panels,scan-controller,lighthouse-types,lighthouse-server}.ts(x)` and package exports | Shared devtools | Added reusable React Scan and Lighthouse panels, a scan controller that works with React Scan's early import requirement, report summaries, and a constrained local Lighthouse runner. |
| `packages/devtools/src/lighthouse-server.test.ts` | Shared devtools tests | Covers local Host/Origin checks, report summary filtering, and incomplete report files. |
| `templates/spa/src/main.tsx`, `src/app/devtools-plugins.tsx`, `src/lib/react-scan-controller.ts`, `src/lib/devtools-stub.ts` | SPA runtime | Added lazy React Scan and Lighthouse plugins, runtime enable/pause and toolbar controls, and production stubs. |
| `templates/spa/vite.config.ts`, `src/mocks/handlers.ts` | SPA dev server | Added a local-only Lighthouse middleware, report watch exclusion, and MSW passthrough for that endpoint. |
| `templates/spa/src/app/*-panel.stories.tsx` | SPA Storybook | Added React Scan controls and Lighthouse empty, running, report, and error story states. |
| `templates/ssr/src/app/{providers,react-scan,devtools-plugins}.tsx`, `src/app/api/devtools/lighthouse/route.ts`, `src/lib/react-scan-stub.ts`, `next.config.ts` | SSR runtime | Added lazy plugins, runtime scan controls, a development-only local Lighthouse route, and production/devtools-off stubs. |
| `templates/ssr/src/app/*-panel.stories.tsx` | SSR Storybook | Added React Scan controls and Lighthouse panel states. |
| `packages/create-reactloom/src/scaffold.test.ts`, `.changeset/tidy-tools-panel.md` | CLI and release notes | Updated scaffold expectations and recorded a patch release for `create-reactloom` generated templates. |
| `AGENTS.md`, `docs/best-practices/{dev-tools,performance,pitfalls}.md`, `docs/getting-started.md`, template `AGENTS.md`, `README.md`, and `.env.example` files | Project guidance | Documented unified panel usage, initial React Scan environment switches, Lighthouse development audit limits, and template behavior. |

## Key implementation

React Scan remains imported before React in each web template. A framework-free external-store controller lets the plugin panel enable or pause scans after startup, while keeping the detailed React Scan toolbar hidden until requested. The existing environment variables continue to control startup scanning.

The Lighthouse panel uses a fixed local endpoint and queries the newest valid `.lighthouseci` report. The server helper accepts no user-provided command, file path, or audit URL; the audit target is the template's local home page. Host and Origin checks limit the endpoints to local development requests. Production bundles replace the new panels and scan imports with stubs. The official `pnpm lighthouse` production-preview workflow remains unchanged.

## Behavior and compatibility

SPA now lists Query, Router, React Scan, and Lighthouse in TanStack Devtools. SSR lists Query, React Scan, and Lighthouse. React Scan starts disabled by default, can be toggled in the panel, and its detailed toolbar is opt-in. Mobile behavior is unchanged. The Lighthouse panel's development scores are diagnostic; production scores still come from `pnpm lighthouse`.

## Validation

| Command or check | Result |
| --- | --- |
| `pnpm lint` | Passed across the workspace. |
| `pnpm typecheck` | Passed across the workspace. |
| `pnpm test` | Passed across 8 Turbo tasks, including generated SPA, SSR, and mobile scaffold checks. |
| `pnpm build` | Passed across the workspace; SPA and SSR bundle budgets passed. |
| `node scripts/check-ai-rules-sync.mjs` | Passed. |
| Storybook panel stories and live SPA/SSR browser checks | Passed: five panel stories in SPA Storybook and live React Scan/Lighthouse checks in both templates. |
| `git diff --check` | Passed. |

## Risks, limitations, and follow-up

Lighthouse development scores differ from production scores because the audit targets the running development server. Browser automation and the sign-in/task flows are unchanged, so the Playwright end-to-end suite is not part of this change. Pre-existing edits to `pnpm-lock.yaml` and `templates/ssr/next-env.d.ts` are excluded from the commit.
