# ADR 0005: Tooling

Biome replaces ESLint and Prettier for this new repo. Lefthook replaces Husky and lint-staged: it formats staged files with Biome, then typechecks and tests the packages changed since `HEAD`. TypeScript 7 has no stable programmatic compiler API, so type-aware `typescript-eslint` is not a practical default. `tsc` remains the typecheck. Shared presets set `incremental` so repeat runs reuse `.tsbuildinfo`. The SPA dev server uses vite-plugin-checker 0.14, which shells out to `tsc` for the in-browser overlay and does not run ESLint or Biome. Turbo is not used; the workspace is small and `pnpm --filter "...[HEAD]"` already limits work to affected packages. Click-to-source uses `code-inspector-plugin` on the Vite and Next.js dev servers only. The Next.js overlay still opens server frames with `REACT_EDITOR`. Expo keeps its element inspector and React Native DevTools instead of a Metro plugin.

Tailwind CSS v4 uses `@tailwindcss/vite` in the SPA and `@tailwindcss/postcss` in Next.js. The mobile template uses React Native styles so Metro does not depend on NativeWind.

Web tests are Vitest plus Testing Library, MSW for the SPA integration test, and Playwright with axe. Bundle scripts fail the build when gzipped JavaScript exceeds the budget in each template.

Changesets versions the library and the CLI. Renovate groups dependency updates; see the README. This repository does not publish packages.
