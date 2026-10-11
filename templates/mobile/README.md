# ReactLoom Mobile

Expo SDK 57 and Expo Router. The session token uses `expo-secure-store` on device and `localStorage` on web export. Tasks in fixture mode stay on device; set `EXPO_PUBLIC_USE_FIXTURES=false` to call `@reactloom/api-client`.

## Zero to running

```sh
pnpm install
pnpm dev
pnpm test
```

`pnpm dev` starts Expo and does not open a browser or a simulator. Press `w` for the web preview. From the ReactLoom repo, `pnpm exec create-reactloom pocket --template mobile --dev` installs and starts this server.

Best practices for this app are in [docs/best-practices/README.md](docs/best-practices/README.md): component organization, state, data fetching, React Native styling, performance, and pitfalls.

```sh
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm build        # expo export --platform web
pnpm analyze      # Expo Atlas at .expo/atlas.jsonl
```

`.maestro/login.yaml` is the device flow. CI does not launch an emulator.

## Developer productivity

These work after `pnpm install`, including in a project created with `create-reactloom`. Nothing else is required for Biome, format on save, Lefthook, Vitest UI and coverage, or click-to-source. This template does not load the web devtools (TanStack panels or vite-plugin-checker). Expo shows bundler errors in the dev server.

why-did-you-render logs unnecessary re-renders to the console while `pnpm dev` is running. `index.js` loads it before Expo Router, and the production export does not. Pure components print the props that changed and the reason. Set `whyDidYouRender = true` on a component that is not memoized. `pnpm analyze` writes `.expo/atlas.jsonl` and opens Expo Atlas.

react-scan 0.5.7 has no React Native export. The native preview at aidenybai/react-scan#23 is unmerged, so this template does not load React Scan. Hover outlines (component name, props, render time) are available in the SPA and SSR templates. For a console diff on one component here, call `useWhyDidYouUpdate` from `@reactloom/devtools`. Do not import it from `index.js`.

On-device Storybook is not loaded. `@storybook/react-native` 10.6.0 is developed with Expo 57, but it requires `react-native-safe-area-context` 5.8.0 and `@gorhom/bottom-sheet`. Expo SDK 57 bundles safe-area-context ~5.7.0 and does not include bottom-sheet. Local data stays behind `EXPO_PUBLIC_USE_FIXTURES`. MSW 3.0.3 has no React Native entry. `@axe-core/react` needs a DOM, so it is not loaded. Use the axe DevTools browser extension on the web preview. `.maestro/login.yaml` is the device flow. CI does not launch an emulator, and Maestro is not an npm dependency.

Tap the lightning button, then tap a component. The launcher opens the matching file and position in VS Code by default. Set `LAUNCH_EDITOR` in `.env.local` only when you want another editor. Run `pnpm doctor:editor [file:line]` to diagnose without opening. A simulator is not started for you. `pnpm dev`, then `w`, opens the web preview.

`docs/getting-started.md` at the repository root has the rest, including the cases that still need a manual fix.
