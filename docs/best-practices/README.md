# Best practices

These notes match the code in this project. Each file is one topic. Start with the topic you are changing, then check [Common pitfalls](pitfalls.md) before you add a second place for the same data.

## Topics

- [Component organization](components.md) covers feature folders, colocation, shared and feature components, and naming.
- [State management](state.md) covers server state in TanStack Query, URL state in the router, form state in React Hook Form, and the client store this template already has.
- [Data fetching](data-fetching.md) covers the API client, query keys, mutations, optimistic updates, and prefetching.<!-- reactloom:ssr --> It also covers SSR hydration.<!-- /reactloom:ssr -->
- [Styling](styling.md) covers<!-- reactloom:spa --> Tailwind v4 tokens, shadcn and `cva` variants, `cn()`, and dark mode.<!-- /reactloom:spa --><!-- reactloom:ssr --> Tailwind v4 tokens, `cva` variants, and `cn()`.<!-- /reactloom:ssr --><!-- reactloom:mobile --> React Native styles.<!-- /reactloom:mobile -->
- [Performance](performance.md) covers code splitting, memoization, images, and bundle size.<!-- reactloom:spa --> It also covers React Scan.<!-- /reactloom:spa --><!-- reactloom:ssr --> It also covers React Scan.<!-- /reactloom:ssr --><!-- reactloom:mobile --> It also covers why-did-you-render.<!-- /reactloom:mobile -->
- [Common pitfalls](pitfalls.md) lists mistakes this code is set up to avoid, and the fix for each.
- [Workflow research（工作流调研）](workflow-research.md) compares community workflow choices with what this repo runs. The page is in Chinese. It mirrors GitHub issue [#2](https://github.com/CoderLambert/ReactLoom/issues/2).
- [Dev tools（开发工具目录）](dev-tools.md) lists every productivity tool in this repo, with commands, config paths, and a per-template table. The page is in Chinese.
- [Turborepo](../turborepo.md) is the Chinese guide to the task runner and its cache. Every template copies it. It is not one of the topic files above.
- [Lighthouse](lighthouse.md) is the Chinese note for the SPA and SSR audit. Expo has no Lighthouse job.
- [CI](../ci.md), [Git workflow](../git-workflow.md), [Storybook and AI](../storybook-ai.md), and [self-hosted deploy](../deploy-self-hosted.md) sit next to this folder. Every template copies them.

`workflow-research.md` and `dev-tools.md` are copied in full into every generated project. They compare SPA, SSR, and Expo on purpose, so they do not use template-only sections.

<!-- reactloom:spa -->
Paths in the other files are relative to this project. The task feature in `templates/spa/src/features/tasks` is the sample to copy.
<!-- /reactloom:spa -->
<!-- reactloom:ssr -->
Paths in the other files are relative to this project. Routes live under `templates/ssr/src/app`, and server-only modules live under `templates/ssr/src/server`.
<!-- /reactloom:ssr -->
<!-- reactloom:mobile -->
Paths in the other files are relative to this project. Screens live under `templates/mobile/app`, and feature logic lives under `templates/mobile/src/features`.
<!-- /reactloom:mobile -->
