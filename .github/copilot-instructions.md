# GitHub Copilot

Follow [AGENTS.md](../AGENTS.md). That file is the source of truth for architecture, commands, and constraints. A nearer `AGENTS.md` applies to the directory you are editing. Do not duplicate those instructions here.

## Commit messages

Generated commit messages follow the same rules as `commitlint.config.mjs` and `.gitmessage`.

- Header: `type(scope): subject`. One logical change.
- Scope is `spa`, `ssr`, `mobile`, `api-client`, `cli`, `docs`, or `ci`, plus an optional feature suffix such as `spa-auth` or `api-client/retry`. The scope or the subject names the feature.
- Subject is imperative, lowercase, at least 12 characters, and not vague. Do not use `update files`, `fix stuff`, `wip`, or `changes`.
- `feat` and `fix` need a body that says what changed, why, and the impact scope (modules, templates, users).
- Breaking changes use a `BREAKING CHANGE:` trailer.

Good: `feat(spa-auth): restore the session before the router guard` with a body that states why the guard raced. Bad: `feat: update files`.
