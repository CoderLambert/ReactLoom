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
