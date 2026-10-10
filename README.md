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
| `pnpm test:e2e` | Playwright for SPA and SSR |
| `pnpm build` | Library, both web apps, and Expo web export |
| `pnpm create` | Runs `create-reactloom` |

Inside a template, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` work on that package alone.

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

`--template` is `spa`, `ssr`, or `mobile`. `--yes` skips prompts. `--install` runs `pnpm install` in the new directory.

The CLI copies the template, copies `@reactloom/api-client` and `@reactloom/tsconfig` into `packages/`, writes a `pnpm-workspace.yaml`, copies Biome and EditorConfig, renames the package, and deletes template-only files (`template.json`, and for SSR the monorepo Dockerfile). The SSR trace root in `next.config.ts` is rewritten so the generated app is self-contained.

## Conventions

- Server state belongs in TanStack Query. Do not copy it into Zustand.
- Call the network through `@reactloom/api-client`. It retries idempotent requests, aborts on timeout, and throws `ApiError`.
- Validate env with the t3 env schema. Commit `.env.example` only.
- Feature code lives under `src/features/<name>` with a schema, an API function, query keys, and hooks.
- Web UI imports `cn` from `@/lib/utils`. Add shadcn components with the aliases in `templates/spa/components.json`.
- Commits follow Conventional Commits. Lefthook runs Biome and Commitlint.
- Changesets cover the shared library and the CLI. Templates are not published.

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

- [Monorepo and the init command](docs/adr/0001-monorepo-and-init.md)
- [Frameworks per template](docs/adr/0002-frameworks.md)
- [Sessions](docs/adr/0003-sessions.md)
- [API client](docs/adr/0004-api-client.md)
- [Tooling](docs/adr/0005-tooling.md)

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
