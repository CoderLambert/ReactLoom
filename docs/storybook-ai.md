# Storybook 与 AI

Storybook 的 MCP 插件还是预览（preview）。接口以后可能变。官方说明在 [MCP server](https://storybook.js.org/docs/ai/mcp/overview)。

## 它是什么

`@storybook/addon-mcp` 10.6.1 挂在 Storybook 开发服务器上，路径是 `/mcp`，传输是 HTTP。代理用它查已有组件、读 props、写 story、在支持的模板上跑测试。它不替代 Vite、Next.js 或 Expo。

| | SPA | SSR | Expo |
| --- | --- | --- | --- |
| 框架 | `@storybook/react-vite` | `@storybook/nextjs`（Webpack） | 没有 Storybook |
| 地址 | http://localhost:6006/mcp | http://localhost:6007/mcp | 无 |
| 工具集 | dev、docs、test 都开 | 同左 | 不适用 |
| `test-run` | 有 `@storybook/addon-vitest` | 没有。Vitest 插件需要 Vite 构建器 | 不适用 |

Expo 不加载 `@storybook/react-native`。原因写在移动模板的 `AGENTS.md`：版本和 Expo SDK 57 自带的 safe-area-context、bottom-sheet 对不上。没有 Storybook 就没有这个 MCP。

## 安装和配置

包已经在 SPA 和 SSR 的 `package.json` 里，不必再跑 `npx storybook add`。`.storybook/main.ts` 里：

```ts
{
  name: '@storybook/addon-mcp',
  options: {
    endpoint: '/mcp',
    toolsets: { dev: true, docs: true, test: true },
  },
}
```

`features.componentsManifest` 是 true，docs 工具才能读到组件清单。React 框架会生成这份清单。

SPA 另外注册了 `@storybook/addon-vitest`。`vitest.config.ts` 有一个名为 `storybook` 的浏览器项目。`pnpm test` 只跑 `unit`，不会拉起 Chromium。

## 工具

| 工具集 | 工具 | 作用 |
| --- | --- | --- |
| dev | `stories-changed` | 本地改动影响到的 story |
| dev | `get-storybook-story-instructions` | 写 story 的当前约定 |
| dev | `stories-preview` | 预览。代理不支持 MCP App 时退回链接 |
| dev | `stories-find-by-component` | 从组件源文件找到 story |
| dev | `review-create` | 需要另开 review 功能，默认没有 |
| docs | `docs-list` | 组件和文档索引 |
| docs | `docs-show` | 某个组件的 props 和前几条 story |
| docs | `docs-show-story` | 单条 story 的全文 |
| test | `test-run` | 跑指定 story。SPA 上包含 a11y。SSR 上这个工具没有 Vitest 插件，不要依赖它 |

先 `pnpm storybook`，再让代理调用工具。服务器没开时，这些调用会失败。

## 代理怎么连

没有密钥。三份配置都指向本机：

| 代理 | 文件 |
| --- | --- |
| Cursor | `.cursor/mcp.json` 的 `mcpServers` |
| VS Code Copilot | `.vscode/mcp.json` 的 `servers`，`type` 为 `http` |
| Claude Code | `.mcp.json` 的 `mcpServers`，`type` 为 `http` |

根仓库两套都列着（`storybook-spa`、`storybook-ssr`）。`create-reactloom` 复制时只保留当前模板那一个；Expo 两个都去掉。

`AGENTS.md`、`.cursor/rules/storybook.mdc` 和 [docs/agents/storybook.md](agents/storybook.md) 要求：改 UI 之前先用 MCP 找已有组件，新组件写 CSF story（交互用 play 函数），SPA 上用 `test-run` 看结果，组件变了就一起改 story。不要编造清单里没有的 prop。

## 版本同步

两份说明的 frontmatter 写着当时的版本：

```yaml
storybook: 10.6.1
addon-mcp: 10.6.1
```

`scripts/check-ai-rules-sync.mjs` 读取 SPA 和 SSR 的 `package.json`（生成后的单包项目则读自己的 `package.json`）。Storybook 的主版本不同，或 addon-mcp 的次版本不同，脚本就以状态码 1 退出。补丁版本的 addon-mcp（10.6.1 到 10.6.2）不失败；次版本（10.6 到 10.7）会失败，因为它还是预览。Storybook 的次版本不失败，主版本（10 到 11）会失败。

CI 的 `packages` 作业和 Lefthook `pre-push` 都会跑它。没有 Storybook 依赖的项目（Expo）直接通过。

Renovate 把 `storybook`、`@storybook/*` 和 `msw-storybook-addon` 分成一组，PR 正文提醒去改 frontmatter。检查没过之前，那次升级的 CI 是失败的。

## 限制

插件标记为 preview。`review-create` 依赖额外功能，这里没开。SSR 的 `test-run` 不可用。Expo 整段不适用。文档清单只在支持的框架上完整，我们开了 `componentsManifest`。
