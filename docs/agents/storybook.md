---
description: How agents use Storybook while developing UI
storybook: 10.6.1
addon-mcp: 10.6.1
---

# Storybook for agents

Start the dev server with `pnpm storybook`, then use the MCP server at `/mcp`.

- SPA: http://localhost:6006/mcp with `@storybook/addon-vitest`, so `test-run` can execute stories in Chromium.
- SSR: http://localhost:6007/mcp. Toolsets `dev`, `docs`, and `test` are on. `test-run` needs `@storybook/addon-vitest`, which is not installed here because `@storybook/nextjs` uses Webpack. Use `dev` and `docs`, and run Playwright for the page.
- Expo: `@storybook/react-native` is not installed. The MCP addon does not apply. The reason is in the mobile `AGENTS.md`.

Find a component with `docs-list`, `docs-show`, and `stories-find-by-component` before creating a new one. Read controls and props from the manifest. Write CSF stories that include a play function when the component has an interaction. Re-run `test-run` on the SPA after a prop change, and update the story in the same commit. Accessibility stays on `@storybook/addon-a11y`.

The versions in this frontmatter are what the instructions were written for. `scripts/check-ai-rules-sync.mjs` fails when the installed Storybook major, or the `@storybook/addon-mcp` minor, drifts from them.
