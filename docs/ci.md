# CI

这份说明对着仓库里的工作流写。根工作流是 `.github/workflows/ci.yml`。SPA、SSR、Expo 各有自己的 `.github/workflows/ci.yml`，生成项目时只复制那一份。

## 每个模板跑什么

根工作流在 `push` 到 `main`、`pull_request`，以及手动的 `workflow_dispatch` 上触发。只有根工作流写了 `concurrency`，同一分支上的旧运行会被取消。模板工作流不写 `concurrency`。

| 作业 | 根仓库 | 生成后的 SPA / SSR | 生成后的 Expo |
| --- | --- | --- | --- |
| `packages` | 安装、Storybook 规则版本、`pnpm lint`、共享包的 typecheck 和 test。create-reactloom 的单测排除 `src/scaffold.integration.test.ts` | 无 | 无 |
| `verify` | 矩阵：`lint typecheck test build`，Web 再跑 Playwright | 同一串命令，包名就是项目名 | 到 `build` 为止。没有 Playwright，也没有 Lighthouse |
| `lighthouse` | SPA 和 SSR。`vars.LIGHTHOUSE_CI` 不是 `false` 时默认跑 | 同左 | 无 |
| `smoke` | 生成三个模板并构建 | 无 | 无 |

Expo 不跑 Playwright。浏览器缓存、`test:e2e`、Lighthouse 都只在 SPA 和 SSR 上。

## 为什么要缓存

安装依赖、下载 Chromium、再编译没改过的包，是 CI 里重复的部分。缓存把这些结果留在 GitHub Actions 上，下一次推送先恢复，再决定要不要重做。

## 缓存了什么

Action 的主版本是 `actions/checkout@v7`、`pnpm/action-setup@v6`、`actions/setup-node@v7`、`actions/cache@v6`。Renovate 的 `helpers:pinGitHubActionDigests` 会把这些标签钉成提交哈希，仓库里先写主版本。

| 缓存 | 路径 | 谁用 |
| --- | --- | --- |
| pnpm 商店 | `actions/setup-node` 的 `cache: pnpm` | 每个作业 |
| Playwright 浏览器 | `~/.cache/ms-playwright` | SPA 和 SSR 的 `verify`，以及 Lighthouse 作业 |
| Turbo | `.turbo`（里面是 `turbo.json` 的 `cacheDir`：`.turbo/cache`） | `packages`、`verify`、`lighthouse`。`smoke` 不缓存，因为它生成的是新目录 |
| Expo / Metro | `.expo` 和 `.metro-cache` | 只有 Expo。Metro 的 `FileStore` 写在项目里的 `.metro-cache`，所以能被 Actions 带走 |

Lighthouse 不另外下载 Chrome。它复用 Playwright 的 Chromium，`scripts/print-playwright-chrome.mjs` 把路径写进 `CHROME_PATH`。

## 键怎么设计

pnpm 的键由 `actions/setup-node` 生成，包含系统和 `pnpm-lock.yaml` 的哈希。锁文件一变，键就变，旧商店不会被当成命中。

Playwright 的键是我们写的：

```text
playwright-${{ runner.os }}-${{ version }}-${{ hashFiles('**/pnpm-lock.yaml') }}
```

`version` 来自该模板 `package.json` 里的 `@playwright/test`，在 `pnpm install` 之前用 Node 读出来。恢复时先试同一版本的前缀，再试同一系统的前缀：

```text
playwright-${{ runner.os }}-${{ version }}-
playwright-${{ runner.os }}-
```

命中（`cache-hit == 'true'`）只跑 `playwright install-deps chromium`，补系统库，不重新下载浏览器。未命中才跑 `playwright install --with-deps chromium`。

Turbo 的键带这次提交：

```text
turbo-${{ runner.os }}-${{ github.sha }}
```

恢复前缀是 `turbo-${{ runner.os }}-`。新提交几乎总是“未命中主键、命中最近一次前缀”，然后这次运行再写一份新的。这样不会把两个并发提交写进同一个主键。

Expo / Metro：

```text
expo-${{ runner.os }}-${{ hashFiles('**/pnpm-lock.yaml') }}
```

恢复前缀是 `expo-${{ runner.os }}-`。这一步放在 `pnpm install` 之后，避免安装把刚恢复的目录清掉。

锁文件或 Playwright 版本变了，对应的主键就会变，不需要手改工作流。

## 手动清缓存

GitHub 仓库的 Actions → Caches 可以按分支删。命令行：

```bash
gh cache list
gh cache delete <cache-id>
```

要让所有作业都当成未命中，把键的前缀改掉（例如 `playwright-` 改成 `playwright-v2-`）再推一次。远程 Turbo 缓存不是这套键，见 [Turborepo](turborepo.md)。

## 第二次推送会怎样

期望，不是在这台机器上量过的秒数：

- pnpm 步骤出现 cache hit，不再从 registry 拉整份商店。
- Playwright 步骤走 `install-deps`，日志里没有浏览器下载。
- Turbo 在输入没变的任务上打印缓存命中。`test:e2e` 和 `lighthouse` 的 `cache` 是 false，这两步仍会执行。

第一次推送，或锁文件变了，就是未命中，时间和现在不缓存时接近。

## Lighthouse 开关

`LIGHTHOUSE_CI` 和 `LIGHTHOUSE_LOCAL` 互不影响。CI 只看仓库变量 `vars.LIGHTHOUSE_CI`（空着或不是 `false` 就跑）和 `workflow_dispatch` 的 `lighthouse` 输入（默认 true）。本地默认不跑，见 [Lighthouse](best-practices/lighthouse.md)。

## Storybook 规则版本

`packages` 作业和 Lefthook 的 `pre-push` 跑 `node scripts/check-ai-rules-sync.mjs`。它对比 `.cursor/rules/storybook.mdc` 和 `docs/agents/storybook.md` 的 frontmatter：Storybook 的主版本、`@storybook/addon-mcp` 的次版本必须和已安装的包一致。Renovate 把 Storybook 相关的升级放在一组，PR 说明里提醒先改 frontmatter。检查失败时，那组 PR 不能过。说明见 [Storybook 与 AI](storybook-ai.md)。
