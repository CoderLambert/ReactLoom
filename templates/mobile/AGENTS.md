# Mobile template

Agents that walk the directory tree also read any `AGENTS.md` closer to the repository root.

This directory is the Expo app, package `@reactloom/template-mobile`. Generated projects keep this file as their root instructions. Practices for this app are in `docs/best-practices/README.md` at the project root.

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

`templates/mobile/src/features/auth/service.ts` builds a client with `getAccessToken: readToken` when fixtures are off. Pass a Zod schema and `retry: false` on the login POST. The auth controller persists the returned access token with `writeToken` only while the login is current, and serializes token writes with logout.

## Testing

Editor recommendations are Biome, Vitest, Expo Tools, and Error Lens. Web-only devtools (Tailwind, Playwright, TanStack devtools, code-inspector) are not part of this template. Compile and uncaught runtime errors open in LogBox (`@expo/log-box`, started by `expo-router/entry`). `app/_layout.tsx` exports an error boundary that shows a symbolicated stack in development and opens a frame through Metro. This template does not open a browser. why-did-you-render 10.0.1 logs unnecessary re-renders in development. `index.js` imports `src/lib/wdyr.js` before `expo-router/entry`, and `babel.config.js` sets `jsxImportSource` only outside production when the bundler is not already compiling for export. `pnpm analyze` exports with Expo Atlas (`EXPO_ATLAS=true`) and opens `.expo/atlas.jsonl`. Pure components, and any component with `whyDidYouRender = true`, print the previous props, the next props, and the reason. Opt into the same console diff on one component with `useWhyDidYouUpdate` from `@reactloom/devtools`. Do not import that hook from `index.js`. react-scan 0.5.7 has no React Native export. The native preview at aidenybai/react-scan#23 is unmerged, so this template does not load React Scan. Click-to-source is `react-native-dev-inspector`: `withInspector` in `metro.config.js` passes `scripts/open-in-editor.mjs` as the editor, the babel plugin runs outside production, and `DevInspector` lives in `src/lib/dev-inspector.tsx`. `.env.development` sets `EXPO_PUBLIC_DEVTOOLS=true` and leaves the editor unset. Tap the lightning button, then tap a component. Saving the file uses Fast Refresh. A simulator is not started for you; `pnpm dev` then `w` opens the web preview. Vitest covers the auth reducer and the task repository. `templates/mobile/.maestro/login.yaml` is the device flow and is not part of CI. @storybook/react-native 10.6.0 is developed with Expo 57, but it requires react-native-safe-area-context 5.8.0 and @gorhom/bottom-sheet. Expo SDK 57 bundles safe-area-context ~5.7.0 and does not include bottom-sheet, so this template does not load on-device Storybook. The Storybook MCP addon is not installed here for that reason. Lighthouse CI is not installed here either, because there is no browser page job. msw 3.0.3 ships a browser worker and a Node server, and no React Native entry. This template keeps local data behind EXPO_PUBLIC_USE_FIXTURES instead of loading MSW. @axe-core/react needs a DOM. This template renders React Native views, so it does not load that package. Use the axe DevTools browser extension on the web preview, and Maestro for the device flow.

## Click-to-source

Expo 使用闪电按钮，不使用 Web 快捷键。launcher 会先读 `.env.local` 的 `LAUNCH_EDITOR` / `CODE_EDITOR` / `REACT_EDITOR`（支持带引号的参数）；未配置时默认打开 VS Code 的精确源码位置。Linux 走 `vscode://file` 桌面协议，不强制操作合成器焦点。`REACTLOOM_EDITOR_DEBUG=1` 打印解析过程；`pnpm doctor:editor [文件:行]` 只诊断不打开。

## Do

- Keep the session inside the token store.
- Stay on the React version the installed Expo SDK pins.

## Don't

- Do not call `fetch` outside `@reactloom/api-client`.
- Do not store the session in AsyncStorage.
- Do not commit `.env` or secrets. Commit `.env.example` only.
- Do not finish a change without `pnpm lint`, `pnpm typecheck`, and `pnpm test` in this directory.
