# ADR 0002: One framework per template

- SPA: Vite 8 and TanStack Router. File-based routing is the TanStack default; this template uses a code-based route tree so `tsc` does not depend on a generate step. Routes are still lazy.
- SSR: Next.js 16 App Router. `proxy.ts` replaces the old `middleware.ts` convention. React Router framework mode was the other credible SSR choice; Next.js remains the more common production server renderer.
- Mobile: Expo SDK 57 and Expo Router, which is the current mainstream React Native stack. Device e2e is a Maestro flow. CI runs unit tests and `expo export --platform web` because this repo does not boot an emulator.
