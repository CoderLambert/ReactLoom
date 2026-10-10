# ADR 0005: Tooling

Biome replaces ESLint and Prettier for this new repo. TypeScript 7 has no programmatic compiler API, so type-aware `typescript-eslint` is not a practical default yet. `tsc` remains the typecheck.

Tailwind CSS v4 uses `@tailwindcss/vite` in the SPA and `@tailwindcss/postcss` in Next.js. The mobile template uses React Native styles so Metro does not depend on NativeWind.

Web tests are Vitest plus Testing Library, MSW for the SPA integration test, and Playwright with axe. Bundle scripts fail the build when gzipped JavaScript exceeds the budget in each template.

Changesets versions the library and the CLI. Renovate groups dependency updates; see the README. This repository does not publish packages.
