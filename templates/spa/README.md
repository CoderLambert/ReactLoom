# ReactLoom SPA

Vite, React 19, TanStack Router, TanStack Query, Tailwind CSS v4, and a shadcn-style component set.

```sh
pnpm dev          # http://127.0.0.1:4317
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e:setup   # first Playwright run; on Linux add: --with-deps
pnpm test:e2e
pnpm build        # also checks the gzip budget
pnpm analyze      # writes dist/stats.html
```

Sign in with `ada@reactloom.dev` / `loom-demo`. MSW serves `/api/session` and `/api/tasks` when `VITE_ENABLE_MSW=true`.

`src/features/tasks` is the sample feature: query keys, a list query, an optimistic create mutation, and loading, empty, and error UI. Auth is a route guard, not a second copy of the task list.
