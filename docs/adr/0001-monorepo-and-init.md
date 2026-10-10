# ADR 0001: Monorepo and init command

ReactLoom is a pnpm workspace. Templates are developed in-tree and copied by `create-reactloom`.

The CLI follows create-vite and create-t3-app: `@clack/prompts` when a human is present, and `--template`, `--yes`, and `--install` when they are not. It deletes `template.json` and other template-only files, then writes a fresh `pnpm-workspace.yaml` so the generated app still depends on `@reactloom/api-client` through `workspace:*`.

Shared packages are copied into the generated project. The result does not stay coupled to this git repo.
