# ReactLoom

Production-grade React templates for a Vite SPA, a Next.js SSR app, and an Expo mobile app, plus `create-reactloom` to copy one of them into a new project.

The templates are meant to be started from and kept, not thrown away after the first screen. Each one includes a session pattern, a typed API client, error boundaries, env validation, tests, and CI. Shared TypeScript presets and the API client live in the pnpm workspace.

## Stack

Versions below are the ones installed in this repo.

| Area | Choice | Version |
| --- | --- | --- |
| Language | TypeScript, `strict` | 7.0.2 |
| UI | React | 19.3.0 on web, 19.2.3 on Expo SDK 57 |
| SPA | Vite, TanStack Router, TanStack Query | Vite 8.3.4, Router 1.170.42, Query 5.104.1 |
| SSR | Next.js App Router | 16.4.0 |
| Mobile | Expo SDK, Expo Router, React Native | Expo 57.0.27, RN 0.86.3 |
| Styling | Tailwind CSS v4 (web) | 4.3.3 |
| Components | shadcn-style `components.json`, `cn()`, Button, Card, Input, Label | SPA |
| Forms | React Hook Form + Zod | 7.89.0, Zod 4.6.5 |
| Server state | TanStack Query | 5.104.1 |
| Client state | Zustand for theme only | 5.0.15 |
| i18n | i18next + react-i18next | 26.4.3 / 17.0.16 |
| HTTP | `@reactloom/api-client` | workspace |
| Env | `@t3-oss/env-core` and `@t3-oss/env-nextjs` | 0.13.11 |
| Lint and format | Biome | 2.5.15 |
| Unit tests | Vitest + Testing Library | Vitest 5.0.3 |
| API mocks | MSW | 3.0.3 |
| E2E | Playwright (web), Maestro flow (mobile, not run in CI) | Playwright 1.64.0 |
| Sessions | In-memory + `sessionStorage` (SPA), `jose` httpOnly cookie (SSR), `expo-secure-store` (native) | jose 6.2.12 |
| Monitoring hook | Sentry-shaped adapter | `@sentry/react` and `@sentry/nextjs` 11.6.0 |
| Git hooks | Lefthook + Commitlint | 2.2.1 / 21.2.3 |
| Versions | Changesets for `@reactloom/api-client` and `create-reactloom` | CLI 3.0.3 |
| Packages | pnpm | 10.33.3 |
| Node | 22.14 or newer | `.nvmrc` is `22` |

React 18 was considered and not used. React 19 is the current mainstream release (19.3.0 on npm as of October 2026). Expo SDK 57 pins React 19.2.3, so the mobile template stays on that peer. React Router 8 and TanStack Router are both current; the SPA uses TanStack Router because new Vite SPAs in this ecosystem pair it with TanStack Query. SSR uses Next.js rather than React Router framework mode because Next.js is still the mainstream production SSR framework. ESLint + Prettier was considered; Biome is the better fit for a new TypeScript 7 repo because TypeScript 7 does not ship a programmatic API for `typescript-eslint`.

## Repository layout

```
.
├── packages/
│   ├── api-client/          # retries, timeouts, cancellation, normalized errors
│   ├── create-reactloom/    # init CLI
│   └── tsconfig/            # shared TypeScript presets
├── templates/
│   ├── spa/                 # Vite SPA
│   ├── ssr/                 # Next.js SSR + Docker
│   └── mobile/              # Expo
├── docs/getting-started.md  # usage guide, also copied into generated projects
├── docs/adr/                # architecture decisions
├── renovate.json
└── .github/workflows/ci.yml
```

SPA source follows a feature layout:

```
templates/spa/src/
├── app/           # router, shell, providers
├── features/      # auth and tasks
├── components/    # ui and layout
├── hooks/
├── lib/           # env, api, query client, i18n, monitoring
├── styles/
├── mocks/         # MSW
└── test/
```

## Scripts

From the repo root:

| Script | What it does |
| --- | --- |
| `pnpm dev:spa` | SPA on port 4317 |
| `pnpm dev:ssr` | SSR on port 4318 |
| `pnpm dev:mobile` | Expo dev server |
| `pnpm lint` | Biome |
| `pnpm typecheck` | `tsc` in every package |
| `pnpm test` | Unit and integration tests |
| `pnpm test:e2e:setup` | Install Playwright Chromium for SPA and SSR |
| `pnpm test:e2e` | Playwright for SPA and SSR |
| `pnpm build` | Library, both web apps, and Expo web export |
| `pnpm exec create-reactloom` | Scaffold an app in the current directory |
| `pnpm create-reactloom` | Same CLI, rebuilding it first |

Inside a template, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` work on that package alone. SPA and SSR also have `pnpm test:e2e:setup` and `pnpm test:e2e`.

`create-reactloom` is a root devDependency, so `pnpm exec create-reactloom` resolves from the repository root. The app is written in the directory where you run the command. Pass a path when it should land somewhere else:

```sh
pnpm exec create-reactloom studio --template spa --yes
pnpm exec create-reactloom ../outside/web --template ssr --yes
```

`pnpm create` is pnpm's built-in initializer and does not run this CLI.

## Create a project

Interactive:

```sh
pnpm exec create-reactloom
```

Non-interactive:

```sh
pnpm exec create-reactloom studio --template spa --yes
pnpm exec create-reactloom web --template ssr --yes --install
pnpm exec create-reactloom pocket --template mobile --yes
```

`--template` is `spa`, `ssr`, or `mobile`. `--yes` skips prompts. `--install` runs `pnpm install` in the new directory. The project name is the last segment of the path, so `studio` and `../outside/studio` both name the package `studio`.

The CLI copies that template directory, then adds only the shared files listed in `templates/<id>/template.json`. It renames the package, deletes template-only files (`template.json`, and for SSR the monorepo Dockerfile), and writes a `pnpm-workspace.yaml` whose `packages` list is `packages/*`. `lefthook` is added to `onlyBuiltDependencies` only when `lefthook.yml` is in the manifest. The SSR trace root in `next.config.ts` is rewritten so the generated app is self-contained. The mobile Metro config's workspace root is rewritten to the generated project.

`@reactloom/template-<id>` in the copied AI files becomes the project name, and `templates/<id>/` paths are rewritten so they match the generated root.

## What each template receives

`template.json` is the manifest. It is not copied into the new project.

| | SPA | SSR | Mobile |
| --- | --- | --- | --- |
| `packages/api-client` | yes | yes | yes |
| TypeScript presets | `base`, `react`, `vite`, `node` | `base`, `react`, `next`, `node` | `base`, `react`, `expo`, `node` |
| Root configs | `.npmrc`, EditorConfig, Biome, Lefthook, Commitlint, Changesets, Renovate, `scripts/open-in-editor.mjs`, `scripts/code`, `scripts/code.cmd` | same | same |
| CI | `templates/spa/.github/workflows/ci.yml` | `templates/ssr/.github/workflows/ci.yml` | `templates/mobile/.github/workflows/ci.yml` |
| Dockerfile | no | yes (`Dockerfile.standalone` renamed to `Dockerfile`) | no |
| Cursor rules | general, spa, testing | general, ssr, testing | general, mobile, testing |
| AI pointers | `CLAUDE.md`, `.github/copilot-instructions.md`, `.cursor/mcp.json` | same | same |
| Docs | `docs/getting-started.md`, ADRs 0003–0006 | same | same |
| `reactScan` | `react-scan` 0.5.7 in `src/main.tsx` | `react-scan` 0.5.7 in `src/app/react-scan.tsx` | off; 0.5.7 has no stable React Native entry |

Left out of every generated app: the monorepo workflow (`.github/workflows/ci.yml` at the repo root), `docs/adr/0001-monorepo-and-init.md`, `docs/adr/0002-frameworks.md`, and `packages/create-reactloom`. An SPA also excludes `next.json`, `expo.json`, `next.config.ts`, `app.json`, Nest config, and the SSR and mobile Cursor rules. SSR excludes the Vite and Expo presets. Mobile excludes the Vite and Next presets. The copied `@reactloom/tsconfig` `package.json` exports only the presets that were copied.

Listing `biome.json`, `lefthook.yml`, `commitlint.config.mjs`, or `.changeset/config.json` adds that tool's devDependency from the root `package.json`. Omitting one removes the dependency and any script that runs it (`lint`, `changeset`, `version-packages`). Dependencies and scripts for a framework whose preset is not listed (`next`, `expo`, `vite`, Nest) are removed. The Changesets `ignore` list is rewritten to the new project name.

### Add a file to a template

- A file that belongs only to that app (a route, a component, the template's own CI workflow) goes in `templates/<id>/`. The CLI copies the template directory. Do not also list it under `configs`.
- A shared package, TypeScript preset, repo-root config, AI file, or ADR is included by adding it to `templates/<id>/template.json`.
- A tsconfig preset must include the presets it extends. `vite.json`, `next.json`, and `expo.json` extend `react.json`, which extends `base.json`. Copying `api-client` requires `node.json`, because the client extends `@reactloom/tsconfig/node.json`.
- Set `docker` to `true` only when that template should keep a Dockerfile. SSR is the only template that does.
- `ci` is the template-relative workflow path (`.github/workflows/ci.yml`). The monorepo workflow is never copied over it.
- `ai.rules` lists Cursor rule filenames from `.cursor/rules/`. Add a rule there only for the templates it applies to.
- `ai.pointers` lists repo-root files such as `CLAUDE.md`.
- `docs` lists paths such as `docs/getting-started.md` and `docs/adr/0004-api-client.md`.
- `clickToSource` names that template's inspector package, its exact version, the bundler config (`vite.config.ts`, `next.config.ts`, or `metro.config.js`), the committed launch-editor file (`.env.development`), and `scripts/open-in-editor.mjs`. List `scripts/open-in-editor.mjs`, `scripts/code`, and `scripts/code.cmd` in `configs` so generation copies them. The CLI checks those files were copied, that the env file does not pin an editor, and that `package.json` depends on that version. Do not put another template's inspector in that file.
- `reactScan` names `react-scan`, its exact version, `enabled`, and the config file. SPA and SSR set `enabled` to true and import the package from that file. Mobile sets `enabled` to false, and `reason` is the sentence in `AGENTS.md` that explains why. The CLI checks the file and that `package.json` matches.
- `whyDidYouRender` names `@welldone-software/why-did-you-render`, its exact version, `enabled`, and the config file. Expo sets `enabled` to true. SPA and SSR set it to false, and `reason` is the sentence in `AGENTS.md`. The CLI checks that sentence when the tool is off, and the dev-only Babel setup when it is on.
- `bundleAnalyze` names the analyzer package, its exact version, the config file, the `analyze` script, and a marker that file must contain.
- `propsDiff` names the primary tool (`react-scan` or `@welldone-software/why-did-you-render`) and `@reactloom/devtools`. `packages.devtools` copies that package. The hook is not imported from an app entry.

## Conventions

- Server state belongs in TanStack Query. Do not copy it into Zustand.
- Call the network through `@reactloom/api-client`. It retries idempotent requests, aborts on timeout, and throws `ApiError`.
- Validate env with the t3 env schema. Commit `.env.example` and `.env.development` (devtools on, editor unset). Secrets and a machine-specific editor override go in `.env.local`.
- Feature code lives under `src/features/<name>` with a schema, an API function, query keys, and hooks.
- Web UI imports `cn` from `@/lib/utils`. Add shadcn components with the aliases in `templates/spa/components.json`.
- Commits follow Conventional Commits. Lefthook runs Biome and Commitlint.
- Changesets cover the shared library and the CLI. Templates are not published.

Before the first Playwright run, install browsers:

```sh
pnpm test:e2e:setup
```

On Linux, install the system libraries as well:

```sh
pnpm test:e2e:setup --with-deps
```

Generated SPA and SSR projects include the same `test:e2e:setup` script. pnpm 10 skips dependency build scripts unless they are trusted. `pnpm-workspace.yaml` lists `lefthook` in `onlyBuiltDependencies`, so `pnpm install` registers the git hooks. To trust another package, add its name there or run `pnpm approve-builds`.

## Developer productivity

Cloning this repo, or generating a project with `create-reactloom`, turns these on. There is no ESLint, Prettier, Husky, lint-staged, or Turbo setup step. The one exception is Neovim: the dev server cannot open a new nvim window, so Neovim users start a listener once. The walkthrough is [Getting started](docs/getting-started.md). `create-reactloom` copies that file into the generated project.

### Biome instead of ESLint and Prettier

Biome 2.5.15 is the formatter and the linter. `pnpm lint` is `biome check .`.

ESLint plus Prettier was the usual pair, and it is not used here. TypeScript 7 does not ship a programmatic compiler API, so type-aware `typescript-eslint` is not a practical default. `tsc` remains the typecheck. Biome covers format and lint in one tool without that API. `.vscode/extensions.json` marks the ESLint and Prettier extensions as unwanted, so the editor does not prompt you to install them.

### Lefthook instead of Husky and lint-staged

Lefthook is the git hook runner. Husky and lint-staged are not installed.

`pnpm-workspace.yaml` lists `lefthook` in `onlyBuiltDependencies`. pnpm 10 skips other dependency build scripts, so `pnpm install` registers these hooks and does not need a separate Husky install. `lefthook.yml` is a shared config, and `create-reactloom` copies it.

The pre-commit hook runs in order (`parallel: false`):

1. Biome formats and lints the staged files (`{staged_files}`) and stages the fixes.
2. If a staged file is TypeScript, `pnpm typecheck:affected` and `pnpm test:affected` run.

The commit-msg hook runs Commitlint. Commits use Conventional Commits.

### VS Code

The repo root `.vscode` is for this monorepo. It recommends Biome, Tailwind CSS IntelliSense, Vitest Explorer, Playwright, Expo Tools, and Error Lens. Each template has a smaller `.vscode`. `create-reactloom` copies the template directory and does not copy the monorepo `.vscode`:

| | SPA | SSR | Mobile |
| --- | --- | --- | --- |
| Extensions | Biome, Tailwind, Vitest, Playwright, Error Lens | same | Biome, Vitest, Expo Tools, Error Lens |
| Tailwind class regex | yes | yes | no |

Format on save is on. The default formatter is `biomejs.biome`. Save also runs `source.fixAll.biome` and `source.organizeImports.biome`. `typescript.tsdk` points at the workspace TypeScript 7 install. On the web templates, Tailwind IntelliSense reads `cn` and `cva` through `tailwindCSS.classFunctions` and `tailwindCSS.experimental.classRegex`.

### Pre-commit checks on staged files

Biome's pre-commit command receives only `{staged_files}`. It does not reformat the rest of the tree.

The typecheck and test that follow are not limited to the staged hunks. They are `pnpm --filter "...[HEAD]"`, so they run in packages changed since the last commit, and in dependents of those packages. Unchanged packages are skipped. A staged markdown file does not by itself start that step: the command's glob is `*.{ts,tsx}`.

### Typecheck and test caching

Shared `tsconfig` presets set `incremental`, so a later `tsc` reuses `.tsbuildinfo`. Those files are gitignored. The affected filter is the other cache: pre-commit does not typecheck or test a package that has not changed since `HEAD`. Turbo is not added. This workspace is a handful of packages, and the filter already skips the unchanged ones.

### Vitest UI and coverage

Inside a package, `pnpm test:ui` opens the Vitest UI and `pnpm test:coverage` writes a v8 text and HTML report under `coverage/` (gitignored). From the repo root, `pnpm test:coverage` runs that script in every package that defines it. A generated project has both scripts at its root. Coverage is not a CI gate.

### React and TanStack devtools

These load only while `pnpm dev` is running. Playwright sets `VITE_DEVTOOLS=false` and `NEXT_PUBLIC_DEVTOOLS=false`, and that process value wins over `.env.development`, so the axe scan does not see the panels. The SPA production build aliases the TanStack devtools to `templates/spa/src/lib/devtools-stub.ts`.

| Tool | Where | What it does |
| --- | --- | --- |
| TanStack Query devtools | SPA `src/app/providers.tsx`, SSR `src/app/providers.tsx` | Inspect queries. |
| TanStack Router devtools | SPA `src/main.tsx` | Inspect the route tree. Bottom-right, so it does not sit on the query panel. |

Mobile does not get those web overlays.

### React Scan

React Scan 0.5.7 is on in the SPA and SSR dev servers. Hover an element and the outline shows that React component's name, its props, and its render time. Re-renders are highlighted. Those are the package defaults: `scan({ enabled: true })` with the toolbar on. No extra options are set.

Each template's `template.json` `reactScan` records the package, the exact version, and the config file. `create-reactloom` checks that file and the `package.json` pin, so a generated project includes the same setup. The integration is the one in React Scan's install docs for that bundler. It is the module import, not the CDN script. The CDN script would load in every environment, including production. `react-scan/all-environments` is the import that runs in production, and these templates do not use it.

| | SPA (Vite) | SSR (Next.js App Router) | Mobile (Expo) |
| --- | --- | --- | --- |
| Config | `templates/spa/src/main.tsx` | `templates/ssr/src/app/react-scan.tsx`, mounted from `src/app/layout.tsx` | `templates/mobile/AGENTS.md` (`reactScan.enabled` is false) |
| How it loads | `import { scan } from 'react-scan'` is the first import, before React and React DOM. `scan({ enabled: true })` runs when `import.meta.env.DEV` and `VITE_DEVTOOLS` is `true`. | A client component. `import { scan } from 'react-scan'` comes before `react`, and `useEffect` calls `scan({ enabled: true })`. That component is the top-most import in `layout.tsx` and renders as the first child of `<html>`, so it is client-side only. | Not loaded. |
| Production | `vite build` aliases `react-scan` to `src/lib/devtools-stub.ts`. The same alias applies when `VITE_DEVTOOLS` is `false`. | `next build`, and dev with `NEXT_PUBLIC_DEVTOOLS=false`, alias `react-scan` to `src/lib/react-scan-stub.ts` (`turbopack.resolveAlias`, and the webpack alias for `next build --webpack`). | `react-scan` is not a dependency, so `expo export` cannot include it. |

The Vite plugin section of the React Scan docs is still a TODO, so the SPA uses the documented module import. The published Vite plugin also peers an older Vite than this repo.

Mobile records this sentence as `reactScan.reason`, and the CLI requires `AGENTS.md` to include it and `package.json` not to depend on `react-scan`:

> react-scan 0.5.7 has no React Native export. The native preview at aidenybai/react-scan#23 is unmerged, so this template does not load React Scan.

The preview's author describes it as early and not at feature parity, and 0.5.7 does not publish a `react-scan/native` entry.

### why-did-you-render

why-did-you-render 10.0.1 logs an unnecessary re-render, and the reason, to the console. v10 supports React 19 only when the automatic JSX transform uses that package as `importSource`. It stays out of production. The package monkeypatches React and slows it down, and its own docs say not to ship it.

| | SPA (Vite 8) | SSR (Next.js 16) | Mobile (Expo) |
| --- | --- | --- | --- |
| Loaded | no | no | yes, while `expo start` is running |
| Config | `templates/spa/AGENTS.md` | `templates/ssr/AGENTS.md` | `babel.config.js`, `index.js`, `src/lib/wdyr.js` |

Vite would inject `jsxImportSource` at the top of every module, ahead of the React Scan import. React Scan has to be the first import, so the tracker would run first and the outline would be unreliable. Next.js compiles App Router JSX with SWC on Turbopack and has no app-wide `jsxImportSource`. A Babel config would fight that bundler. Expo's `babel-preset-expo` accepts `jsxImportSource`, and a custom `index.js` can import the tracker before `expo-router/entry`.

`template.json` `whyDidYouRender` records the package, the exact version, `enabled`, and the config file. When `enabled` is false, `reason` is the sentence in that file. `create-reactloom` checks the sentence is present and that `package.json` does not depend on the package. When it is on, the CLI checks the Babel gate, `index.js`, and `src/lib/wdyr.js`.

The SPA sentence is:

> why-did-you-render v10 needs its package as the automatic JSX importSource. Vite 8 injects that import before React, which runs ahead of React Scan, so this template does not load why-did-you-render. React Scan's outline shows the render cause and the props that changed.

The SSR sentence is:

> Next.js 16 compiles JSX with SWC on Turbopack and has no app-wide jsxImportSource. why-did-you-render v10 requires that Babel setting, so this template does not load it. React Scan's outline shows the render cause and the props that changed.

On Expo, the preset option is set only when `NODE_ENV` is not `production`, `EXPO_PUBLIC_DEVTOOLS` is not `false`, and Metro is not already compiling a production bundle (`expo export` sets that). `src/lib/wdyr.js` calls `whyDidYouRender(React, { trackAllPureComponents: true })` inside `__DEV__`, so Metro strips the call from the export. A component that is not a pure component can opt in with `whyDidYouRender = true`.

### Bundle analysis

`pnpm analyze` is on every template. `pnpm build` does not run it. `template.json` `bundleAnalyze` records the package, the exact version, the config file, the script, and a marker the CLI looks for in that file.

| | SPA | SSR | Mobile |
| --- | --- | --- | --- |
| Package | `rollup-plugin-visualizer` 7.1.1 | `@next/bundle-analyzer` 16.4.0, plus Next's built-in analyzer | `expo-atlas` 0.4.3 |
| Script | `ANALYZE=true vite build` | `next analyze --output` | `EXPO_ATLAS=true expo export --platform web --output-dir dist && expo-atlas .expo/atlas.jsonl` |
| Report | `dist/stats.html` | `.next/diagnostics/analyze` | `.expo/atlas.jsonl`, then the Atlas UI |
| Config | `vite.config.ts` | `next.config.ts` | `package.json` |

The Vite plugin is added only when `ANALYZE` is `true`. Next 16's default `next build` is Turbopack, and `@next/bundle-analyzer` skips Turbopack and points at `next analyze`. `next analyze --output` writes the report and exits. It does not start the interactive server. `ANALYZE=true next build --webpack` still uses `@next/bundle-analyzer` and writes `.next/analyze`. Expo Atlas is the documented Expo report. It has been stable since SDK 53. The Atlas file includes source, so it stays under `.expo`, which is gitignored. `pnpm analyze` on Expo opens the viewer after the export.

### Props diffs

No second overlay is installed. The props that changed are already on screen or in the console.

| | What shows the diff |
| --- | --- |
| SPA and SSR | React Scan. Hover a component and the outline lists the props that changed, with the render time and the re-render highlight. |
| Expo | why-did-you-render prints the previous props, the next props, and the reason for pure components, and for any component with `whyDidYouRender = true`. |
| One component | `useWhyDidYouUpdate` from `@reactloom/devtools`. |

The hook is opt-in. Call it inside the component you are debugging. Do not mount it on the app root, and do not import it from `src/main.tsx`, `src/app/layout.tsx`, or `index.js`. Production builds inline `NODE_ENV` and drop the log when a feature does import it. Because no entry imports it, the production bundles do not contain it. `template.json` `propsDiff` records the primary tool, the hook package, and the config file. `packages.devtools` copies `packages/devtools` into a generated project. The package is a `workspace:*` devDependency.

### In-browser TypeScript errors

The SPA dev server uses vite-plugin-checker 0.14 in `templates/spa/vite.config.ts`. It shells out to `tsc` and shows TypeScript errors in the Vite overlay. `enableBuild` is off, because `pnpm typecheck` already runs `tsc`. The checker does not run ESLint or Biome.

SSR does not use vite-plugin-checker. Next.js already shows compile errors in its overlay. Mobile uses the Expo dev server for bundler errors.

### Click to source

`pnpm dev` loads an inspector. Click a component and the editor opens at that file and line. Saving hot-reloads through the dev server that is already running (Vite HMR, Next.js Fast Refresh, or Expo Fast Refresh).

| | SPA (Vite) | SSR (Next.js) | Mobile (Expo) |
| --- | --- | --- | --- |
| Tool | `code-inspector-plugin` 2.0.9 | same plugin on Turbopack, plus the Next.js dev overlay | `react-native-dev-inspector` 1.1.0 |
| Where | `templates/spa/vite.config.ts`, dev server only | `templates/ssr/next.config.ts` | `metro.config.js`, `babel.config.js`, `src/lib/dev-inspector.tsx` |
| Gesture | Option+Shift (macOS) or Alt+Shift, then click | same gesture. Overlay stack frames use Open in editor | Tap the lightning button, then tap the component |

Each template's `template.json` `clickToSource` names the inspector package, its exact version, the bundler config, `.env.development`, and `scripts/open-in-editor.mjs`. `configs` also copies `scripts/code` and `scripts/code.cmd`. `create-reactloom` checks those files landed and that the package is that version. A generated SPA does not get the Next.js or Expo inspector.

`.env.development` is committed. It turns devtools on and does not set an editor. While the dev server starts, the bundler calls `activateLauncher`. That stashes any `LAUNCH_EDITOR`, `CODE_EDITOR`, or `REACT_EDITOR` already set into `REACTLOOM_EDITOR`, then points those three variables at `scripts/code` (Windows: `scripts/code.cmd`). The inspectors spawn that path. The shim is named `code` so they pass `file:line`. It is not VS Code. Do not put `scripts/` on `PATH`. The shim runs `scripts/open-in-editor.mjs`.

The Vite plugin is registered only for `vite dev`, and only when `VITE_DEVTOOLS` is not `false`. The launcher is not activated during `vite build`. The Next.js plugin returns `dev: false` when `NODE_ENV` is `production` or `NEXT_PUBLIC_DEVTOOLS` is `false`, and it does not activate the launcher in that case, so `next build` does not inject `data-insp-path`. SPA source maps stay on (`build.sourcemap` and `css.devSourcemap`). Next.js dev source maps stay on. `productionBrowserSourceMaps` stays off. The Expo babel plugin and the root `DevInspector` run only outside production, and only when `EXPO_PUBLIC_DEVTOOLS` is not `false`. `metro.config.js` passes the launcher as `withInspector`'s `editor`.

Server Components are included: the Turbopack rule rewrites JSX in the App Router, and the Next.js overlay opens server stack frames from their source maps. This repo uses `src/app`, and Next.js 16.4 resolves that path.

### Editor auto-detection

On each click, `scripts/open-in-editor.mjs` looks for an editor in this order:

1. An explicit command: `LAUNCH_EDITOR`, then `CODE_EDITOR`, then `REACT_EDITOR`, then `VISUAL`, then `EDITOR`. A value of `nvim`, `neovim`, or `vim` stays on the Neovim path and does not fall through to Cursor.
2. A running Neovim server. The address is `$NVIM`, then `$NVIM_LISTEN_ADDRESS`, then `.nvim.sock` in the current directory and each parent up to the git root. A socket at the repo root still works when `pnpm --filter` runs inside a template. The command is `nvim --server <address> --remote +<line> <file>`.
3. A running Cursor, then VS Code (`code`, then `code-insiders`, then `codium`).
4. A new terminal Neovim, `nvim +<line> <file>`, when a terminal emulator is available. The dev server's own stdio is not a terminal, so this step opens Terminal.app, Windows Terminal, or a Linux emulator.

VS Code and Cursor need no setup when that editor is already running, or when `code` or `cursor` is on `PATH`. Neovim does. `$NVIM` is set only inside Neovim's `:terminal`, so a dev server started from a normal shell does not see it. One-time setup, from the project directory:

```sh
nvim --listen .nvim.sock
```

Or in `init.lua`. A socket is not a regular file, so this uses `fs_stat` rather than `filereadable`:

```lua
local sock = vim.fn.getcwd() .. "/.nvim.sock"
local uv = vim.uv or vim.loop
if uv.fs_stat(sock) == nil then
  pcall(vim.fn.serverstart, sock)
end
```

`.nvim.sock` is gitignored. GUI editors receive `file:line:column`. Neovim receives `+line`.

Optional override, only if detection does not open an editor. Put one line in `.env.local` (gitignored) and restart `pnpm dev`. The same names work in every template. `LAUNCH_EDITOR` wins when more than one is set.

| Variable | Examples |
| --- | --- |
| `LAUNCH_EDITOR` | `cursor`, `code`, `nvim`, `webstorm`, or an executable path. Read first. |
| `CODE_EDITOR` | Same values. Used when `LAUNCH_EDITOR` is unset. |
| `REACT_EDITOR` | Same values. Used when the two above are unset. Next.js also reads this for `/__nextjs_launch-editor`. |
| `VISUAL`, then `EDITOR` | Used when the three names above are unset. `EDITOR=nvim` opens Neovim. |

These steps cannot be made automatic from the repo:

| Limit | Why | One-line fix |
| --- | --- | --- |
| No Neovim socket, and `$NVIM` is unset in the dev server | Neovim runs in a terminal. The dev server cannot attach a new nvim window to its own stdio. `$NVIM` exists only inside a Neovim terminal. | `nvim --listen .nvim.sock` in the project, or add the `init.lua` snippet above. |
| `nvim` is not on `PATH` | `--remote` and a new window both run the `nvim` binary. A socket file alone is not enough. | Install Neovim so `command -v nvim` works, or set `LAUNCH_EDITOR=cursor`. |
| No terminal emulator | A brand-new nvim window needs Terminal.app, Windows Terminal (`wt`), `$TERMINAL`, or `kitty`, `alacritty`, `wezterm`, `gnome-terminal`, `konsole`, `xfce4-terminal`, or `xterm`. | `nvim --listen .nvim.sock`, or `export TERMINAL=kitty`, or `LAUNCH_EDITOR=cursor`. |
| Stale `.nvim.sock` | The path is a socket, but nothing is listening. `--remote` fails and the click stops there. | `rm -f .nvim.sock`, then start nvim again. |
| `scripts/` is on `PATH` | `scripts/code` is the shim, not VS Code. A `code` command would open the shim. | Keep `scripts/` off `PATH`. Set `LAUNCH_EDITOR` to the real `cursor` or `code` binary. |
| Windows `scripts/code.cmd` fails with `EINVAL` | Node will not spawn a `.cmd` file unless `shell` is set. | `LAUNCH_EDITOR=cursor` in `.env.local`, then restart `pnpm dev`. |
| Cursor is chosen while VS Code is also running | After Neovim, a running Cursor is preferred over VS Code. | `LAUNCH_EDITOR=code` in `.env.local`. |
| No editor process, and `code` or `cursor` is not on `PATH` | A clone cannot install VS Code or Cursor. | `LAUNCH_EDITOR=cursor` in `.env.local` (or `CODE_EDITOR` / `REACT_EDITOR`), then restart `pnpm dev`. |
| React DevTools browser extension | A repository cannot install a browser extension. Click-to-source does not use it. The dev server injects the inspector. | Install the React DevTools extension only if you want its Components panel. |
| Expo phone or simulator | Generation does not boot a simulator or a device. Open-in-editor runs on the computer that runs Metro. | `pnpm --filter @reactloom/template-mobile exec expo start --web` |

## AI collaboration

`AGENTS.md` at the repository root is the source of truth for coding agents: architecture, how the three templates differ, commands, directories, the API client, tests, and the do/don't rules. Each template has a nearer `AGENTS.md`. The SSR file keeps the Next.js agent block that `next dev` writes, and adds the ReactLoom session and security rules under it.

`CLAUDE.md` imports `@AGENTS.md`. `.github/copilot-instructions.md` points at the same file. Cursor rules in `.cursor/rules/*.mdc` are glob-scoped: general TypeScript and Biome, SPA, SSR, mobile, and testing. `.cursor/mcp.json` is an example that starts the shadcn MCP server and the Context7 docs server. It has no API keys or tokens. See [ADR 0006](docs/adr/0006-ai-collaboration.md).

The fixture account on every template is `ada@reactloom.dev` / `loom-demo`. It is local demo data, not a credential.

## Dependency updates

`renovate.json` is the only Renovate artifact in this repo. Nothing here installs the GitHub App or opens pull requests.

The config extends `config:recommended`, which turns on the dependency dashboard. It also:

- Schedules updates for early Monday in `Asia/Shanghai` (`before 6am on Monday`).
- Groups ESLint, typescript-eslint, TypeScript, Vitest, Playwright, Tailwind, TanStack, React, Expo / React Native, and Next.js so related bumps share a pull request.
- Updates `pnpm-lock.yaml` on those bumps and opens a weekly lockfile-maintenance pull request.
- Automerge minor, patch, pin, digest, and non-major devDependency updates with GitHub auto-merge after CI is green (`platformAutomerge`).
- Leaves major updates for review and labels them `dependencies` and `major`.
- Pins GitHub Actions to commit digests via `helpers:pinGitHubActionDigests`.

### Install the Renovate GitHub App

1. Open [the Renovate GitHub App](https://github.com/apps/renovate) and choose **Install**.
2. Pick the account or organization that owns this private repository, then grant access to this repository only.
3. Renovate reads the committed `renovate.json`. It does not need an onboarding commit if this file is already on the default branch.
4. Protect `main` and require the `CI / verify` check. Auto-merge waits for that check.
5. Use the Dependency Dashboard issue to see pending updates. Major updates stay open until someone merges them.

App permissions and the schedule are documented by Renovate: [installing Renovate](https://docs.renovatebot.com/getting-started/installing-onboarding/) and [config:recommended](https://docs.renovatebot.com/presets-config/).

## Decisions worth reading

- [Getting started](docs/getting-started.md)
- [Monorepo and the init command](docs/adr/0001-monorepo-and-init.md)
- [Frameworks per template](docs/adr/0002-frameworks.md)
- [Sessions](docs/adr/0003-sessions.md)
- [API client](docs/adr/0004-api-client.md)
- [Tooling](docs/adr/0005-tooling.md)
- [AI collaboration](docs/adr/0006-ai-collaboration.md)

## Practices this follows

- [bulletproof-react](https://github.com/alan2207/bulletproof-react) for feature folders, MSW, and query/mutation hooks.
- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite), [create-t3-app](https://github.com/t3-oss/create-t3-app), and [create-turbo](https://github.com/vercel/turborepo/tree/main/packages/create-turbo) for the CLI shape: flags, prompts, and a copied template.
- [TanStack Router](https://tanstack.com/router/latest/docs/framework/react/quick-start) and [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview).
- [Next.js proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) and [self-hosting](https://nextjs.org/docs/app/guides/self-hosting).
- [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/) and [Expo monorepos](https://docs.expo.dev/guides/monorepos/).
- [T3 Env](https://env.t3.gg/docs/core), [MSW 3](https://mswjs.io/docs/migrations/2.x-to-3.x), [Biome](https://biomejs.dev/), [Playwright](https://playwright.dev/), [Changesets](https://github.com/changesets/changesets).
- [Tailwind CSS with Vite](https://tailwindcss.com/docs/installation/using-vite) and [shadcn/ui for Vite](https://ui.shadcn.com/docs/installation/vite).
- [TypeScript 7](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) and [React versions](https://react.dev/versions).
- [Renovate configuration](https://docs.renovatebot.com/configuration-options/).
- [AGENTS.md](https://agents.md/), [Cursor rules](https://cursor.com/docs/rules), [Claude Code memory](https://code.claude.com/docs/en/memory), and [Copilot custom instructions](https://docs.github.com/en/copilot/concepts/prompting/response-customization) for the AI collaboration files.
