# ReactLoom Mobile

Expo SDK 57 and Expo Router. The session token uses `expo-secure-store` on device and `localStorage` on web export. Tasks in fixture mode stay on device; set `EXPO_PUBLIC_USE_FIXTURES=false` to call `@reactloom/api-client`.

```sh
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm build        # expo export --platform web
```

`.maestro/login.yaml` is the device flow. CI does not launch an emulator.

## Developer productivity

These work after `pnpm install`, including in a project created with `create-reactloom`. Nothing else is required for Biome, format on save, Lefthook, Vitest UI and coverage, or click-to-source. This template does not load the web devtools (TanStack panels, React Scan, or vite-plugin-checker). Expo shows bundler errors in the dev server.

Tap the lightning button, then tap a component. The editor is a running Neovim server, then Cursor, then VS Code. A simulator is not started for you. `pnpm dev`, then `w`, opens the web preview.

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
