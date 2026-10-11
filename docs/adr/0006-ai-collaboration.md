# ADR 0006: AI collaboration files

`AGENTS.md` is the shared instructions file. The root copy covers architecture, the three templates, commands, directories, the API client, tests, and the do/don't rules. Each template has its own `AGENTS.md`. The nearer file wins. `create-reactloom` copies that template file into the generated project, plus the Cursor rules, Claude and Copilot pointers, and example MCP config named in that template's `template.json`. Other templates' rules are not copied. It rewrites `@reactloom/template-<id>` to the project name and rewrites `templates/<id>/` paths so they match the generated root.

`CLAUDE.md` and `.github/copilot-instructions.md` stay short pointers. Claude Code loads an `@AGENTS.md` import from `CLAUDE.md`, which keeps one body of instructions when a `CLAUDE.md` is present. Copilot's repository instructions file points at the same document. Cursor also reads `AGENTS.md`, and `.cursor/rules/*.mdc` adds glob-scoped rules (general, SPA, SSR, mobile, testing) with `alwaysApply: false`. The legacy single-file `.cursorrules` format is not used.

`.cursor/mcp.json` is an example with the shadcn MCP server and the Context7 docs server. It contains no API keys, tokens, or headers. A higher Context7 rate limit needs a local environment variable, outside this file.

## Sources

- [AGENTS.md](https://agents.md/) open format, including nested files. Supported by Codex, Cursor, Copilot, and other coding agents.
- [OpenAI Codex: AGENTS.md](https://developers.openai.com/codex/guides/agents-md) for root-down discovery.
- [Cursor rules](https://cursor.com/docs/rules) for `.cursor/rules/*.mdc`, glob scoping, and nested `AGENTS.md`.
- [Cursor MCP](https://cursor.com/docs/mcp) for project `.cursor/mcp.json`.
- [Claude Code memory](https://code.claude.com/docs/en/memory) for `CLAUDE.md` and `@AGENTS.md` imports.
- [GitHub Copilot custom instructions](https://docs.github.com/en/copilot/concepts/prompting/response-customization) for `.github/copilot-instructions.md`, and [Copilot's AGENTS.md support](https://docs.github.com/en/copilot/reference/custom-instructions-support).
- [shadcn MCP](https://ui.shadcn.com/docs/mcp) (`npx shadcn@latest mcp`).
- [Context7](https://github.com/upstash/context7) (`npx -y @upstash/context7-mcp`) as the docs server, without embedding a key.
