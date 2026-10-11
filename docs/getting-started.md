# Getting started

This guide is for the ReactLoom monorepo and for a project created with `create-reactloom`. The developer setup below is already in the project. You do not install ESLint, Prettier, Husky, lint-staged, or Turbo, and you do not turn click-to-source on.

How this codebase wants features built is in [Best practices](docs/best-practices/README.md). A generated project includes the sections for its template.

## Run the app

From a generated project, or from `templates/spa`, `templates/ssr`, or `templates/mobile`:

```sh
pnpm install
pnpm dev
pnpm test
```

`pnpm dev` is Vite on port 4317 (SPA), Next.js on port 4318 (SSR), or Expo (mobile). SPA and SSR open that URL in the browser. They stay closed when `CI` is set or `REACTLOOM_OPEN=false`. Expo does not open a browser: press `w` for the web preview. In the monorepo the same servers are `pnpm dev:spa`, `pnpm dev:ssr`, and `pnpm dev:mobile` from the repository root.

From the ReactLoom repo, install and start in one step:

```sh
pnpm exec create-reactloom studio --template spa --dev
```

`--dev` implies install. `--yes` without `--dev` does not start a server. The interactive prompt offers install-and-start, install only, or skip.

SPA and SSR also have Playwright. The first run needs browsers. On Linux, add `--with-deps`:

```sh
pnpm test:e2e:setup
pnpm test:e2e
```

Sign in with `ada@reactloom.dev` / `loom-demo`. That account is local demo data.

Generate a project from the ReactLoom repo:

```sh
pnpm exec create-reactloom studio --template spa --yes --install
pnpm exec create-reactloom web --template ssr --yes --install
pnpm exec create-reactloom pocket --template mobile --yes --install
```

`--template` is `spa`, `ssr`, or `mobile`. The new directory has this file, the template README, and only the shared packages that template uses.

## What works out of the box

After `pnpm install`, these are already configured:

| Feature | What you get |
| --- | --- |
| Format and lint | Biome. `pnpm lint` is `biome check`. ESLint and Prettier are not installed. TypeScript 7 has no programmatic compiler API, so type-aware `typescript-eslint` is not used. `tsc` is the typecheck. |
| Format on save | `.vscode` sets Biome as the default formatter and organizes imports on save. The ESLint and Prettier extensions are marked unwanted. |
| Git hooks | Lefthook, not Husky or lint-staged. Pre-commit formats the staged files with Biome, then typechecks and tests packages changed since the last commit. Commit messages go through Commitlint. A failing hook blocks the commit. |
| Typecheck and test caching | TypeScript `incremental` reuses `.tsbuildinfo`. The pre-commit typecheck and test use `pnpm --filter "...[HEAD]"`, so unchanged packages are skipped. |
| Vitest | `pnpm test:ui` opens the Vitest UI. `pnpm test:coverage` writes a v8 text and HTML report. Coverage is not a CI gate. |
| Devtools | SPA 用一个 `@tanstack/react-devtools` 入口承载 Query 与 Router；SSR 用同一容器承载 Query。React Scan 默认关闭，分别设置 `VITE_REACT_SCAN=true` 或 `NEXT_PUBLIC_REACT_SCAN=true` 后才开启。生产构建把这些调试包替换为空桩。Mobile 不加载 TanStack 面板或 React Scan。 |
| Re-render reasons | Expo logs unnecessary re-renders with why-did-you-render while `pnpm dev` is running (`babel.config.js`, `index.js`, `src/lib/wdyr.js`). SPA and SSR do not load it. React Scan's outline is the render-cause view on those templates. |
| Bundle report | `pnpm analyze`. SPA writes `dist/stats.html` (rollup-plugin-visualizer). SSR writes `.next/diagnostics/analyze` (`next analyze --output`). Expo writes `.expo/atlas.jsonl` and opens Expo Atlas. `pnpm build` does not run this. |
| Props diff | Hover in React Scan on the web. On Expo, why-did-you-render prints the props that changed. For one component, call `useWhyDidYouUpdate` from `@reactloom/devtools`. Do not mount that hook on the app root. |
| Storybook | `pnpm storybook` and `pnpm build-storybook` on SPA (Vite, port 6006) and SSR (Next.js, port 6007). Stories cover the primitives and the login screen, with MSW and the a11y addon. Expo does not load on-device Storybook: `@storybook/react-native` 10.6.0 wants `react-native-safe-area-context` 5.8.0 and `@gorhom/bottom-sheet`, and Expo SDK 57 bundles safe-area-context ~5.7.0. |
| Browser mocks | SPA: `VITE_ENABLE_MSW=true` in dev reuses `src/mocks/handlers.ts`. SSR: `NEXT_PUBLIC_ENABLE_MSW` defaults to false so Playwright hits the route handlers; set it true in `.env.local` to start the same style of handlers. Expo: `EXPO_PUBLIC_USE_FIXTURES`. MSW 3.0.3 has no React Native entry. |
| Accessibility | Playwright axe stays on SPA and SSR. The web dev server also logs `@axe-core/react` while devtools are on. Install the axe DevTools browser extension for a manual pass. Expo does not load that package. |
| End-to-end | Playwright on SPA and SSR (`pnpm test:e2e`). Maestro on Expo (`.maestro/login.yaml`). CI does not launch an emulator. |
| Errors | SPA: Vite overlay plus vite-plugin-checker, and a dev stack in `src/components/errors/fallback.tsx`. SSR: the Next.js overlay, and a dev stack in `src/app/error.tsx`. Expo: LogBox, and a dev stack from `app/_layout.tsx`. Project frames open in the editor. Production hides the stack. |
| Click to source | SPA uses `code-inspector-plugin` on Vite. SSR uses the same plugin on Turbopack, plus Next.js open-in-editor. Expo uses `react-native-dev-inspector`. |

Click to source, on the web: hold Control+Shift+Option on macOS, or Ctrl+Shift+Alt on Windows and Linux, then click. On Expo, tap the lightning button, then tap the component. Saving the file hot-reloads through the dev server that is already running.

No editor variable is set in `.env.development`. VS Code is the default.

1. An explicit `LAUNCH_EDITOR`, `CODE_EDITOR`, or `REACT_EDITOR`, including quoted arguments from `.env.local`.
2. VS Code at the exact source position. Linux uses the registered `vscode://file` desktop handler and does not force compositor focus; other platforms fall back to `code -r -g file:line:column`.
3. Legacy editor detection only when `code` is unavailable.

VS Code needs nothing else when `code` is on `PATH`. Set `LAUNCH_EDITOR=cursor` in `.env.local` if you prefer Cursor.

## Neovim

The launcher scans live Neovim sockets automatically, but a project socket is the most deterministic setup. `$NVIM` is usually inherited only inside a Neovim `:terminal`; its server cwd is checked so an inherited socket cannot jump into another project.

From the project directory:

```sh
nvim --listen .nvim.sock
```

Or in `init.lua`. A socket is not a regular file, so this uses `fs_stat`:

```lua
local root = vim.fs.root(0, ".git") or vim.fn.getcwd()
local sock = root .. "/.nvim.sock"
if not vim.uv.fs_stat(sock) then pcall(vim.fn.serverstart, sock) end
```

`.nvim.sock` is gitignored. Multiple projects stay isolated by git root. If several Neovim instances belong to one project, the deepest server cwd wins. A confirmed-dead project `.nvim.sock` is skipped and may be removed; runtime-directory sockets are never deleted.

The inspectors spawn `scripts/code` (on Windows, `scripts/code.cmd`). That file is named `code` so they pass a line number. It is not VS Code. Do not put `scripts/` on `PATH`.

## When nothing opens

| What you see | Fix |
| --- | --- |
| `code` is not on `PATH` | Install the VS Code shell command, or set `LAUNCH_EDITOR` in `.env.local` to an available editor and restart `pnpm dev`. |
| You want Cursor instead of VS Code | Set `LAUNCH_EDITOR=cursor` in `.env.local` and restart `pnpm dev`. |
| Windows reports `EINVAL` from `scripts/code.cmd` | `LAUNCH_EDITOR=cursor` in `.env.local`. |

Set `REACTLOOM_EDITOR_DEBUG=1` for the full selection trace. `pnpm doctor:editor [file:line]` prints the selected command without opening it.
| Expo on a phone or simulator | Open-in-editor runs on the computer that runs Metro. `pnpm dev`, then press `w` for the web preview. Generation does not boot a simulator. |

The React DevTools browser extension is not required. Click-to-source does not use it.
