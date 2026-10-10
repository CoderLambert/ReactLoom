# ReactLoom SSR

Next.js 16 App Router with an httpOnly session cookie, security headers, a standalone Docker image, and the shared API client.

```sh
pnpm dev          # http://127.0.0.1:4318
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

From the ReactLoom repo root:

```sh
docker build -f templates/ssr/Dockerfile.monorepo -t reactloom-ssr .
```

After `create-reactloom --template ssr`, build `Dockerfile` from the generated project. Set `SESSION_SECRET` and `REACTLOOM_STRICT_SECRETS=true` outside local development.

`proxy.ts` is the Next.js 16 request proxy. The Next TypeScript plugin is omitted because TypeScript 7 has no programmatic API; `tsc` and `next build` still run.
