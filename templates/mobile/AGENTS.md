# Mobile template

Agents that walk the directory tree also read any `AGENTS.md` closer to the repository root.

This directory is the Expo app, package `@reactloom/template-mobile`. Generated projects keep this file as their root instructions.

## Stack

Expo SDK 57, Expo Router, and React 19.2.3 (the SDK peer). React Native styles keep Metro free of NativeWind. TanStack Query holds server state. The auth feature uses a reducer plus `templates/mobile/src/lib/token-store.ts`.

Native tokens go through `expo-secure-store`. Web export uses `localStorage`. Fixture login is the default (`EXPO_PUBLIC_USE_FIXTURES=true`) so the app runs without a backend. Turning fixtures off sends login through `@reactloom/api-client`.

## Layout

Paths below are from the repository root.

- `templates/mobile/app` holds Expo Router screens (`_layout.tsx`, `index.tsx`, `login.tsx`, `tasks.tsx`).
- `templates/mobile/src/features/auth` holds the schema, reducer, service, and context.
- `templates/mobile/src/features/tasks` holds the repository.
- `templates/mobile/src/lib/env.ts` validates `EXPO_PUBLIC_` variables.
- `packages/api-client` at the repository root is the HTTP client.

## Commands

From this directory:

| Command | What it does |
| --- | --- |
| `pnpm start` | Expo dev server |
| `pnpm lint` | Biome |
| `pnpm typecheck` | `tsc` |
| `pnpm test` | Vitest |
| `pnpm test:coverage` | Vitest with the v8 coverage report |
| `pnpm test:ui` | Vitest browser UI |
| `pnpm build` | `expo export --platform web` |

## API client

`templates/mobile/src/features/auth/service.ts` builds a client with `getAccessToken: readToken` when fixtures are off. Pass a Zod schema and `retry: false` on the login POST. Persist the returned access token with `writeToken`.

## Testing

Editor recommendations are Biome, Vitest, Expo Tools, and Error Lens. Web-only devtools (Tailwind, Playwright, React Scan, TanStack devtools, code-inspector) are not part of this template. Click-to-source is `react-native-dev-inspector`: `withInspector` in `metro.config.js` passes `scripts/open-in-editor.mjs` as the editor, the babel plugin runs outside production, and `DevInspector` lives in `src/lib/dev-inspector.tsx`. `.env.development` sets `EXPO_PUBLIC_DEVTOOLS=true` and leaves the editor unset, so the launcher can open a Neovim server (`nvim --listen .nvim.sock`), then a running Cursor or VS Code. Tap the lightning button, then tap a component. Saving the file uses Fast Refresh. If detection fails, run `nvim --listen .nvim.sock` or set `LAUNCH_EDITOR=cursor` in `.env.local`. A simulator is not started for you; `pnpm dev` then `w` opens the web preview. Vitest covers the auth reducer and the task repository. `templates/mobile/.maestro/login.yaml` is the device flow and is not part of CI.

## Do

- Keep the session inside the token store.
- Stay on the React version the installed Expo SDK pins.

## Don't

- Do not call `fetch` outside `@reactloom/api-client`.
- Do not store the session in AsyncStorage.
- Do not commit `.env` or secrets. Commit `.env.example` only.
- Do not finish a change without `pnpm lint`, `pnpm typecheck`, and `pnpm test` in this directory.
