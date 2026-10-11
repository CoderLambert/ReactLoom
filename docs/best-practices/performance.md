# Performance

React Compiler is not enabled. No template sets a `reactCompiler` flag, and `babel-plugin-react-compiler` is not a dependency. Do not add `useMemo` or `useCallback` to satisfy a compiler that is not running. The screens in this repo do not use those hooks.

Memoize a component after a render tool shows the same props producing extra renders that cost something. A new list of ten tasks does not need `memo`.

## Code splitting

<!-- reactloom:spa -->
Routes are split in `templates/spa/src/app/router.tsx`. `HomePage`, `LoginPage`, and `TasksPage` are `lazy()` imports, wrapped by `lazyPage` in `<Suspense>`. `defaultPreload: 'intent'` fetches the next route's module on hover. That preload is JavaScript, not query data.

Devtools are split the same way. `templates/spa/src/main.tsx` lazy-loads the router devtools only when `import.meta.env.DEV` and `VITE_DEVTOOLS` are on. `templates/spa/src/app/providers.tsx` lazy-loads React Query devtools under the same check. Production builds alias `react-scan` to `templates/spa/src/lib/devtools-stub.ts`.

Do not statically import a page into `router.tsx`. That pulls every screen into the entry.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
The App Router splits by file. `templates/ssr/src/app/page.tsx` (home), `login/page.tsx`, and `tasks/page.tsx` are separate modules. The root layout stays a Server Component so the client bundle is the providers plus the client pages, not the whole tree.

`templates/ssr/src/app/providers.tsx` lazy-loads React Query devtools only when `NODE_ENV` is `development` and `NEXT_PUBLIC_DEVTOOLS` is not `'false'`. React Scan is imported from `templates/ssr/src/app/react-scan.tsx` and aliased to an empty module in production.

Keep a new server-only helper under `templates/ssr/src/server`. Importing it from a client page pulls it into the browser bundle or fails the build.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
Expo Router splits by file under `templates/mobile/app`. `_layout.tsx` stays mounted. `index.tsx`, `login.tsx`, and `tasks.tsx` load with their routes.

`templates/mobile/index.js` imports `templates/mobile/src/lib/wdyr.js` before `expo-router/entry`. That module loads `why-did-you-render` only in development. Do not import it again from a screen.
<!-- /reactloom:mobile -->

## Images

<!-- reactloom:spa -->
The only image is the favicon. `templates/spa/index.html` links `/favicon.svg`. Screens do not render `<img>`. Keep decorative art in `public/` and reference it by URL so it stays out of the route module. A large raster imported from `tasks-page.tsx` lands in the JavaScript budget below.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
No screen uses `next/image`. The home page is type and layout. When you add a photo, use `next/image` so the file is not imported into a client component. The proxy matcher in `templates/ssr/src/proxy.ts` already ignores `/_next/image`.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
The sample screens do not render images. `expo-image` is not a dependency. Add it when a screen needs a remote or cached image, and keep the asset out of the auth and task modules' JavaScript.
<!-- /reactloom:mobile -->

## Bundle budgets

<!-- reactloom:spa -->
`templates/spa/package.json` runs `node scripts/check-bundle-budget.mjs` after `vite build`. The script gzips every file in `dist/assets/*.js`.

| Budget | Limit |
| --- | --- |
| Total JavaScript gzip | 550 KiB |
| Largest chunk gzip | 280 KiB |

`pnpm analyze` writes `dist/stats.html`. Check that report before raising either number. A failing budget means the new import is in the client graph. It does not mean the limit should move.

Storybook, MSW, `@axe-core/react`, and React Scan are aliased to stubs in the production build. Do not import them from a path the alias misses.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
`templates/ssr/package.json` runs `node scripts/check-bundle-budget.mjs` after `next build`. The script gzips the client JavaScript Next emits. The budget is 900 KiB total. There is no per-chunk cap in this script.

`pnpm analyze` writes `.next/diagnostics/analyze`. Treat a budget failure as a client import to remove. Do not raise 900 KiB to fit a dev-only package. Production aliases `react-scan`, `msw/browser`, and `@axe-core/react` to stubs.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
`pnpm build` is `expo export --platform web`. There is no gzip budget script. `pnpm analyze` writes Expo Atlas at `.expo/atlas.jsonl`.

The web export must not contain Storybook, MSW, or `@axe-core/react`. Those packages are not dependencies. `why-did-you-render` stays behind the development check in `templates/mobile/index.js`.
<!-- /reactloom:mobile -->

## Seeing why something rendered

`useWhyDidYouUpdate` from `@reactloom/devtools` logs a console diff for one component. Call it from that component while you are looking. Do not import it from the app entry, and do not leave it on a hot list.

<!-- reactloom:spa -->
React Scan is the overlay. `templates/spa/src/main.tsx` imports `react-scan` before React and calls `scan({ enabled: true })` when devtools are on. Hover an element for the component name, props, and render time. The outline lists the props that changed.

why-did-you-render is not loaded. Vite 8 would inject its JSX import ahead of React Scan. Use the outline, or `useWhyDidYouUpdate` on the one component you care about.
<!-- /reactloom:spa -->

<!-- reactloom:ssr -->
React Scan is the overlay. `templates/ssr/src/app/layout.tsx` renders `ReactScan` from `templates/ssr/src/app/react-scan.tsx`, and that module is the top-most import so the scanner installs before React. It runs in development on the client. Server Components are not drawn in the overlay. Hover a client element for the component name, props, and render time.

why-did-you-render is not loaded. Next.js 16 compiles JSX with SWC and has no app-wide `jsxImportSource`. Use React Scan's outline, or `useWhyDidYouUpdate` on one client component.
<!-- /reactloom:ssr -->

<!-- reactloom:mobile -->
why-did-you-render logs extra renders in the dev console. `templates/mobile/src/lib/wdyr.js` calls it with `trackAllPureComponents: true`, and `templates/mobile/index.js` imports that file first. The production export does not run that branch. A pure component prints the props that changed and the reason. For a component that is not memoized, set `whyDidYouRender = true` on it, or call `useWhyDidYouUpdate`.

React Scan is not loaded. `react-scan` 0.5.7 has no React Native export.
<!-- /reactloom:mobile -->
