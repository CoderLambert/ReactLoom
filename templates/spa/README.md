# ReactLoom SPA

Vite, React 19, TanStack Router, TanStack Query, Tailwind CSS v4, and a shadcn-style component set.

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

These work after `pnpm install`, including in a project created with `create-reactloom`. Nothing else is required for Biome, format on save, Lefthook, Vitest UI and coverage, the TanStack and React Scan panels, TypeScript errors in the Vite overlay, or click-to-source.

React Scan is the first import in `src/main.tsx`. In `pnpm dev`, hover an element to see its component name, props, and render time. Re-renders are highlighted. The outline also lists the props that changed. `vite build` aliases `react-scan` to `src/lib/devtools-stub.ts`, so the production bundle does not include it.

why-did-you-render is not loaded. Vite 8 would inject its JSX import ahead of React Scan. `pnpm analyze` writes `dist/stats.html`. For a console diff on one component, call `useWhyDidYouUpdate` from `@reactloom/devtools`. Do not import it from `src/main.tsx`.

`pnpm storybook` uses `@storybook/react-vite` on port 6006. Stories cover Button, Input, Label, Card, and the login route. The preview starts the same MSW handlers. `@axe-core/react` logs in the dev server while devtools are on, and the Storybook a11y addon covers the workshop. Install the axe DevTools browser extension for a manual pass. `pnpm build` aliases `msw` and `@axe-core/react` to `src/lib/workflow-stub.ts`. `pnpm build-storybook` sets `STORYBOOK=true` so that alias stays off.

Hold Option+Shift on macOS, or Alt+Shift on Windows and Linux, then click. The editor is a running Neovim server, then Cursor, then VS Code.

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
