# Getting started

This guide is for the ReactLoom monorepo and for a project created with `create-reactloom`. The developer setup below is already in the project. You do not install ESLint, Prettier, Husky, lint-staged, or Turbo, and you do not turn click-to-source on.

## Run the app

From a generated project, or from `templates/spa`, `templates/ssr`, or `templates/mobile`:

```sh
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm dev` is Vite on port 4317 (SPA), Next.js on port 4318 (SSR), or Expo (mobile). In the monorepo the same servers are `pnpm dev:spa`, `pnpm dev:ssr`, and `pnpm dev:mobile` from the repository root.

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
| Git hooks | Lefthook, not Husky or lint-staged. Pre-commit formats the staged files with Biome, then typechecks and tests packages changed since the last commit. Commit messages go through Commitlint. |
| Typecheck and test caching | TypeScript `incremental` reuses `.tsbuildinfo`. The pre-commit typecheck and test use `pnpm --filter "...[HEAD]"`, so unchanged packages are skipped. |
| Vitest | `pnpm test:ui` opens the Vitest UI. `pnpm test:coverage` writes a v8 text and HTML report. Coverage is not a CI gate. |
| Devtools | SPA: TanStack Query, TanStack Router, and React Scan (`src/main.tsx`), plus TypeScript errors in the Vite overlay (vite-plugin-checker, dev server only). SSR: TanStack Query, React Scan (`src/app/react-scan.tsx`, client only), and the Next.js error overlay. Hover an element in either web dev server to see the component name, props, and render time; re-renders are highlighted. Production builds alias `react-scan` to an empty module. Mobile does not load React Scan: 0.5.7 has no React Native export, and the native preview is unmerged. Mobile also does not load the TanStack panels. |
| Re-render reasons | Expo logs unnecessary re-renders with why-did-you-render while `pnpm dev` is running (`babel.config.js`, `index.js`, `src/lib/wdyr.js`). SPA and SSR do not load it. React Scan's outline is the render-cause view on those templates. |
| Bundle report | `pnpm analyze`. SPA writes `dist/stats.html` (rollup-plugin-visualizer). SSR writes `.next/diagnostics/analyze` (`next analyze --output`). Expo writes `.expo/atlas.jsonl` and opens Expo Atlas. `pnpm build` does not run this. |
| Props diff | Hover in React Scan on the web. On Expo, why-did-you-render prints the props that changed. For one component, call `useWhyDidYouUpdate` from `@reactloom/devtools`. Do not mount that hook on the app root. |
| Storybook | `pnpm storybook` and `pnpm build-storybook` on SPA (Vite, port 6006) and SSR (Next.js, port 6007). Stories cover the primitives and the login screen, with MSW and the a11y addon. Expo does not load on-device Storybook: `@storybook/react-native` 10.6.0 wants `react-native-safe-area-context` 5.8.0 and `@gorhom/bottom-sheet`, and Expo SDK 57 bundles safe-area-context ~5.7.0. |
| Browser mocks | SPA: `VITE_ENABLE_MSW=true` in dev reuses `src/mocks/handlers.ts`. SSR: `NEXT_PUBLIC_ENABLE_MSW` defaults to false so Playwright hits the route handlers; set it true in `.env.local` to start the same style of handlers. Expo: `EXPO_PUBLIC_USE_FIXTURES`. MSW 3.0.3 has no React Native entry. |
| Accessibility | Playwright axe stays on SPA and SSR. The web dev server also logs `@axe-core/react` while devtools are on. Install the axe DevTools browser extension for a manual pass. Expo does not load that package. |
| End-to-end | Playwright on SPA and SSR (`pnpm test:e2e`). Maestro on Expo (`.maestro/login.yaml`). CI does not launch an emulator. |
| Click to source | SPA uses `code-inspector-plugin` on Vite. SSR uses the same plugin on Turbopack, plus Next.js open-in-editor. Expo uses `react-native-dev-inspector`. |

Click to source, on the web: hold Option+Shift on macOS, or Alt+Shift on Windows and Linux, then click. On Expo, tap the lightning button, then tap the component. Saving the file hot-reloads through the dev server that is already running.

The editor is detected. No editor variable is set in `.env.development`.

1. An explicit `LAUNCH_EDITOR`, `CODE_EDITOR`, `REACT_EDITOR`, `VISUAL`, or `EDITOR`, if you set one in `.env.local`.
2. A running Neovim server (`$NVIM`, `$NVIM_LISTEN_ADDRESS`, or `.nvim.sock`).
3. A running Cursor, then VS Code.
4. A new terminal Neovim, when a terminal emulator is available.

VS Code and Cursor need nothing else when that editor is already running, or when `code` or `cursor` is on `PATH`.

## Neovim

Neovim is the one step that is not automatic. The dev server has no terminal, so it cannot open a new nvim window on its own stdio. `$NVIM` is set only inside a Neovim `:terminal`, which a dev server started from a normal shell does not have.

From the project directory:

```sh
nvim --listen .nvim.sock
```

Or in `init.lua`. A socket is not a regular file, so this uses `fs_stat`:

```lua
local sock = vim.fn.getcwd() .. "/.nvim.sock"
local uv = vim.uv or vim.loop
if uv.fs_stat(sock) == nil then
  pcall(vim.fn.serverstart, sock)
end
```

`.nvim.sock` is gitignored. The click then runs `nvim --server <address> --remote +<line> <file>` in that instance. A socket at the git root is found even when the dev server's working directory is a package inside the repo.

If the socket is left behind after nvim exits, `rm -f .nvim.sock` and start nvim again.

The inspectors spawn `scripts/code` (on Windows, `scripts/code.cmd`). That file is named `code` so they pass a line number. It is not VS Code. Do not put `scripts/` on `PATH`.

## When nothing opens

| What you see | Fix |
| --- | --- |
| Neovim is installed, and the click does nothing | `nvim --listen .nvim.sock` in the project, or the `init.lua` snippet above. |
| `nvim` is not on `PATH` | Install Neovim, or set `LAUNCH_EDITOR=cursor` in `.env.local` and restart `pnpm dev`. |
| You want VS Code while Cursor is also running | `LAUNCH_EDITOR=code` in `.env.local`. Cursor is preferred when both are running. |
| Windows reports `EINVAL` from `scripts/code.cmd` | `LAUNCH_EDITOR=cursor` in `.env.local`. |
| Expo on a phone or simulator | Open-in-editor runs on the computer that runs Metro. `pnpm dev`, then press `w` for the web preview. Generation does not boot a simulator. |

The React DevTools browser extension is not required. Click-to-source does not use it.
