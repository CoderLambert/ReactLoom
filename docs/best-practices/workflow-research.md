# 工作流调研

本文按场景比较社区里常见的工作流，并写明 ReactLoom 现在用哪一种。它对应 GitHub issue [#2](https://github.com/CoderLambert/ReactLoom/issues/2)。

issue #2 里和任务缓存有关的那一项，现在的决定是采用 Turborepo 2.11.7。本地缓存目录是 `.turbo`，CI 用 `actions/cache` 恢复它。远程缓存仍然可选，仓库不要求 `TURBO_TOKEN`。Lighthouse CI 已在 SPA 和 SSR 接入（`@lhci/cli` 0.15.1）；Expo 没有这项作业。Nx、Chromatic、size-limit、Vercel、EAS 仍是未实现。操作说明在 [Turborepo](../turborepo.md) 和 [CI](../ci.md)。

三个模板都会收到本文。文中的路径是各模板自己的文件名（例如 SPA 的 `vite.config.ts`）。在 monorepo 里，这些文件在对应模板目录下；`create-reactloom` 生成的项目里，它们在项目根目录。

## 状态

| 标记 | 含义 |
| --- | --- |
| 已接入 | 仓库里有配置，生成项目会带上（Docker 只在 SSR） |
| 未实现 | 社区里常见，本仓库没有。不要当成已经接好 |

| 场景 | 社区里常见的选择 | ReactLoom |
| --- | --- | --- |
| 任务缓存 | Turborepo 或 Nx | 已接入 Turborepo 2.11.7，本地目录 `.turbo`。Nx 未实现 |
| CI 依赖缓存 | `actions/setup-node` 的 `cache: pnpm` | 已接入 |
| CI 浏览器缓存 | `actions/cache` 缓存 Playwright | 已接入（SPA 与 SSR；Expo 没有 Playwright） |
| 远程任务缓存 | Turborepo Remote Cache 或 Nx Cloud | 可选，未要求。CI 不设置令牌。Nx Cloud 未实现 |
| CI 路径过滤 | `on.push.paths` 或 paths-filter | 未实现。每次 push 和 pull request 都跑完整作业 |
| CI 并发 | `concurrency` 取消过期运行 | 已接入，只在 monorepo 根工作流 |
| 提交前检查 | Lefthook，或 Husky 加 lint-staged | 已接入 Lefthook。Husky 与 lint-staged 未实现 |
| 提交说明 | commitlint | 已接入 |
| 组件驱动开发 | Storybook | 已接入 SPA 与 SSR。Expo 未接入 |
| 视觉回归 | Chromatic | 未实现 |
| 性能闸门 | Lighthouse CI、size-limit、自写体积预算 | gzip 预算和 Lighthouse CI 已接入 SPA 与 SSR。size-limit 未实现。Expo 不用 Lighthouse |
| 版本说明 | Changesets | 已接入，只覆盖 API client 和 CLI |
| 依赖更新 | Renovate 或 Dependabot | Renovate 配置已接入。GitHub App 要人去安装 |
| Web 托管 | Vercel | 未实现 |
| SSR 自托管 | Docker | 已接入，仅 SSR |
| Expo 构建 | EAS | 未实现 |

## 1. 任务缓存：Turborepo 与 Nx

两边都把「任务的输入没变，就复用上一次的输出」做成一等功能。输入通常是源文件、依赖锁和任务命令。输出是 `dist`、`.next` 或测试缓存。

### 何时用 Turborepo

包很多、任务图清楚（`build` 依赖上游的 `build`）、本地和 CI 都在重复跑同一批命令时，用 Turborepo。它的配置是仓库根的 `turbo.json`，任务用 `pnpm turbo run build` 或 npm script 调用。

优点：

- 配置面小，和 pnpm workspace 的脚本对齐。
- 本地缓存默认打开。远程缓存是单独的一步。
- 对「一个库加多个应用」的仓库足够用。

缺点：

- 不管代码生成、项目图可视化、插件生态。这些是 Nx 在做的事。
- 缓存键要自己列对。漏掉环境变量或生成文件，CI 会拿到旧产物。
- 多一层 CLI。小仓库的收益经常低于维护成本。

参考：[Turborepo caching](https://turborepo.dev/docs/crafting-your-repository/caching)、[turbo.json](https://turborepo.dev/docs/reference/configuration)。

### 何时用 Nx

包之间有代码生成、目标依赖很复杂、或者要按项目图做 affected 分析时，用 Nx。配置是 `nx.json` 和各项目的 `project.json` 或包里的 `nx` 字段。

优点：

- affected 能根据 git 范围跳过没碰到的项目。
- 远程缓存、分布式任务和项目图是同一套模型。
- 插件能识别 Vite、Next.js、Expo 的目标。

缺点：

- 概念多（target、executor、plugin、cache input）。一个三应用的仓库容易配得比业务还长。
- 和 pnpm 的过滤语法重复。两套「谁受影响」的规则会打架。
- 生成器和插件会把仓库绑到 Nx 的版本节奏上。

参考：[Nx task cache](https://nx.dev/docs/features/cache-task-results)、[Nx affected](https://nx.dev/docs/features/ci-features/affected)。

### 在 ReactLoom 中

已接入 Turborepo，没有 `nx.json`。根上有 `turbo.json`，版本是 2.11.7。完整字段说明、命令和清缓存的步骤在 [Turborepo](../turborepo.md)。

[ADR 0005](../adr/0005-tooling.md) 原先用 `pnpm --filter "...[HEAD]"` 限制类型检查和测试。那条过滤还留在各模板自己的 `typecheck:affected` / `test:affected` 脚本里。monorepo 根脚本和 Lefthook 改走 Turbo：

| 脚本 | 命令 |
| --- | --- |
| `typecheck`、`test`、`build` | `turbo run <任务>` |
| `typecheck:affected` | `turbo run typecheck --affected` |
| `test:affected` | `turbo run test --affected` |
| 模板包里的 `typecheck:affected` | 仍是 `pnpm --filter "...[HEAD]" --if-present typecheck` |

`--affected` 的基线是 `main`，比 `...[HEAD]` 宽：功能分支上会带上自 `main` 以来的包。Lefthook 用的是 `--affected`。共享 TypeScript preset 的 `incremental` 还在，`.tsbuildinfo` 是编译器缓存，和 `.turbo` 不是一回事。

三个模板的差异：任务看的是包，不看框架。改了 SPA 的页面，不会因此去跑 SSR 的 `next build`，除非那个包也在本次哈希或 `--affected` 的范围内。CI 不用 `--affected` 把整个矩阵滤掉。`verify` 仍按模板各跑一遍，但命中 `.turbo` 时会跳过输入没变的命令。

Nx 仍未实现。远程缓存未要求，见下一节。

## 2. GitHub Actions 的缓存与跳过

依赖缓存、浏览器缓存、任务缓存、远程任务缓存、路径过滤、并发取消，是不同的事。ReactLoom 做了 pnpm 安装缓存、Playwright 浏览器缓存、Turborepo 本地目录（经 `actions/cache`），以及根工作流的并发取消。远程令牌没有配。

### pnpm 安装缓存

何时使用：CI 每次都 `pnpm install`，而锁文件经常不变。缓存的是 pnpm 的内容寻址存储，不是 `node_modules` 目录本身。`actions/setup-node` 的 `cache: pnpm` 会按锁文件做键。

优点：安装从「下载全部包」变成「命中存储再链接」。和 pnpm 10 的锁文件对齐。

缺点：锁文件一变，键就失效，当次安装仍然完整。缓存不能代替 `--frozen-lockfile`。缓存坏了时，要删 GitHub 上的 cache 条目，不能靠改一行配置修好。

参考：[setup-node caching](https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md#caching-packages-dependencies)、[pnpm CI](https://pnpm.io/continuous-integration)。

ReactLoom：已接入。monorepo 根工作流 `.github/workflows/ci.yml` 和三个模板各自的 `.github/workflows/ci.yml` 都是：

- `actions/checkout@v7`
- `pnpm/action-setup@v6`，版本 `10.33.3`
- `actions/setup-node@v7`，`node-version: 22`，`cache: pnpm`
- `actions/cache@v6` 负责 `.turbo`、Playwright 和 Expo
- `pnpm install --frozen-lockfile`

Renovate 的 `helpers:pinGitHubActionDigests` 会把这些主版本钉成提交哈希。键的设计和清缓存的办法在 [CI](../ci.md)。

生成后的项目只保留自己那一份工作流，不复制 monorepo 的矩阵。

### Playwright 浏览器缓存

何时使用：SPA 或 SSR 的端到端测试要装 Chromium，而浏览器二进制比测试代码大得多。

优点：锁文件和 `@playwright/test` 版本都不变时，不必下载浏览器。命中后只跑 `playwright install-deps chromium`。未命中才跑 `playwright install --with-deps chromium`。

缺点：只缓存 `~/.cache/ms-playwright`。系统库不在这个目录里，命中时仍要装一次。键里同时有系统、Playwright 版本和 `**/pnpm-lock.yaml` 的哈希。

参考：[Playwright CI caching](https://playwright.dev/docs/ci-intro#caching-browsers)。

ReactLoom：已接入，而且只在会跑 Playwright 的作业上。

| 工作流 | 缓存路径 | 键 | 谁跑 e2e |
| --- | --- | --- | --- |
| monorepo `.github/workflows/ci.yml` 的 `verify` | `~/.cache/ms-playwright` | `playwright-` 加系统、`@playwright/test` 版本、`hashFiles('**/pnpm-lock.yaml')` | `matrix.e2e` 为真时，也就是 SPA 和 SSR |
| SPA 模板的 `.github/workflows/ci.yml` | 同上 | 同上 | 总是跑 |
| SSR 模板的 `.github/workflows/ci.yml` | 同上 | 同上，不再使用 `playwright-ssr-` 前缀 | 总是跑 |
| Expo 模板的 `.github/workflows/ci.yml` | `.expo` 和 `.metro-cache` | `expo-` 加系统和锁文件哈希 | 不跑 Playwright。构建是 `expo export --platform web` |

本地安装浏览器仍是 `pnpm test:e2e:setup`。CI 在未命中时用 `playwright install --with-deps chromium`（pnpm 10 不要在参数前再加一个 `--`）。Expo 的 verify 作业设置 `EXPO_NO_TELEMETRY: "1"`：monorepo 矩阵里有，生成后的 Expo 工作流里也有。Metro 把文件缓存写到 `.metro-cache`，这一步放在 `pnpm install` 之后。

### 远程任务缓存

何时使用：同一条 `build` 或 `test` 在很多 CI 机器和开发者机器上重复执行，而且产物可以安全复用。Turborepo 的 Remote Cache 和 Nx Cloud 把任务输出放到共享存储。GitHub 的 `actions/cache` 也能手写一份，但是要自己定义键和恢复路径。

优点：改了一个包时，其它包的构建可以直接取回。多人仓库里这是 CI 时间的主要来源。

缺点：

- 缓存键漏了密钥或 `NODE_ENV`，会把开发构建当成生产构建。
- 远程缓存是第三方服务或自建存储，有令牌，不能写进仓库。
- 本仓库的生产构建还要跑 gzip 预算和别名检查。旧产物被复用时，这些检查必须仍然执行，不能把「缓存命中」当成「预算已通过」。

参考：[Turborepo remote caching](https://turborepo.dev/docs/core-concepts/remote-caching)、[Nx remote cache](https://nx.dev/docs/features/ci-features/remote-cache)。

ReactLoom：远程缓存未要求。没有 `TURBO_TOKEN`、`TURBO_TEAM` 或 Nx Cloud。本地任务缓存已接入：`turbo.json` 的 `cacheDir` 是 `.turbo/cache`，工作流用 `actions/cache` 保存 `.turbo`，键是 `turbo-${{ runner.os }}-${{ github.sha }}`，恢复前缀是 `turbo-${{ runner.os }}-`。这和把 `dist` 或 `.next` 单独放进 `actions/cache` 不是一回事，恢复的是 Turbo 的任务缓存。令牌怎么配写在 [Turborepo](../turborepo.md)，不配也能跑。

### 路径过滤

何时使用：monorepo 里一次提交只碰一个应用，希望 CI 不要把另外两个应用也建一遍。做法有两种：工作流触发器上的 `paths` / `paths-ignore`，或作业里的 [dorny/paths-filter](https://github.com/dorny/paths-filter) 再配合 `if`。

优点：只改文档时可以不跑 Expo 导出。账单和等待时间都下降。

缺点：

- 共享包（API client、tsconfig、devtools）被改时，三个应用都要跑。过滤规则容易漏掉这条边。
- `paths` 写在触发器上时，一个 PR 同时改了文档和工作流，行为会不好解释。
- 本仓库的 smoke 作业要生成三个模板再构建。路径过滤不能把这个作业滤掉，否则 CLI 的复制逻辑没有人跑。

参考：[GitHub Actions paths](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#onpushpull_requestpull_request_targetpathspaths-ignore)。

ReactLoom：未实现。根工作流和模板工作流的触发都是 `push` 到 `main` 以及 `pull_request`，没有 `paths`。矩阵是 `fail-fast: false`，一个模板失败不会取消另外两个。

这是有意的：三个模板共享锁文件和根配置，路径过滤还没写成「共享文件变更则全跑」的规则。现在每次都跑 `packages`、`verify (spa)`、`verify (ssr)`、`verify (mobile)` 和 `smoke`。

### 并发

何时使用：同一个分支上连续推送，旧的 CI 还在跑。`concurrency` 把同一组里正在跑的作业取消，只留下最新的。

优点：不付钱给已经被新提交取代的运行。开发者不用等一条注定过期的 e2e。

缺点：取消会丢掉那次运行的日志。如果要对比两次失败，需要把取消关掉，或者只在 pull request 上取消、在 `main` 上不取消。

参考：[Using concurrency](https://docs.github.com/en/actions/using-jobs/using-concurrency)。

ReactLoom：已接入，仅根工作流。

```yaml
concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

三个模板自己的 `.github/workflows/ci.yml` 不写 `concurrency`。生成器的测试会拒绝模板工作流里出现这个键，避免生成后的单包仓库和 monorepo 的取消策略缠在一起。模板工作流也不含 `@reactloom/template-` 这样的过滤器，因为生成后的 `package.json` 名字就是项目名。作业跑 `pnpm exec turbo run lint typecheck test build`（Web 再跑 `test:e2e`），并缓存 `.turbo`。

## 3. 提交前闸门

### Lefthook 与 Husky + lint-staged

何时用 Lefthook：希望一个 YAML 描述全部 git 钩子，并且用 glob 把命令限制在暂存文件上。配置是仓库根的 `lefthook.yml`。pnpm 10 要允许它的安装脚本，否则钩子不会注册。

何时用 Husky 加 lint-staged：团队已经有 `.husky/` 脚本，或者每个钩子都是一段 shell。lint-staged 负责「只对暂存文件跑」。

优点（Lefthook）：

- 一个文件里有 pre-commit 和 commit-msg。
- `stage_fixed: true` 会把格式化改过的文件重新放进暂存区。
- 不需要再加一个 lint-staged 配置。

缺点（Lefthook）：

- 钩子靠安装脚本写进 `.git/hooks`。`onlyBuiltDependencies` 没列 `lefthook` 时，`pnpm install` 不会注册钩子。
- 并行打开时，格式化和类型检查会抢同一批文件。本仓库因此把 `parallel` 设为 `false`。

优点（Husky + lint-staged）：生态示例多，钩子就是仓库里的脚本，读起来直接。

缺点：两个工具、两份配置。Husky 的版本 9 和更早的写法不一样，复制旧教程容易装错。

参考：[Lefthook](https://lefthook.dev/)、[Husky](https://typicode.github.io/husky/)、[lint-staged](https://github.com/lint-staged/lint-staged)。

ReactLoom：已接入 Lefthook 2.2.1。Husky 与 lint-staged 未实现，不要加。

`lefthook.yml`：

- `parallel: false`。Biome 先改文件，然后才类型检查。
- pre-commit 的 `biome`：glob 是 `*.{js,jsx,ts,tsx,json,css,mjs,cjs}`，命令是 `pnpm exec biome check --write`，作用在 `{staged_files}`，`stage_fixed: true`。
- pre-commit 的 `check-affected`：glob 是 `*.{ts,tsx}`，命令是 `pnpm exec turbo run typecheck test --affected`。范围是相对 `main` 有变化的包，含未提交的改动，不是全仓库，也不是「只跑暂存文件里的测试」。
- 非零退出会挡住这次提交。注释写在 `lefthook.yml` 顶部。

`pnpm-workspace.yaml` 的 `onlyBuiltDependencies` 只有 `lefthook`。生成项目会保留这份列表。

三个模板用同一份 `lefthook.yml`（列在各自 `template.json` 的 `configs` 里）。没有按模板拆钩子。

### commitlint

何时使用：提交说明要能被生成 changelog 的工具读懂，并且要在提交时就失败，而不是等 CI。

优点：和 Changesets、约定式提交是同一套词汇（`feat`、`fix`、`docs`）。本地失败比 CI 失败便宜。

缺点：只检查说明的形状，不检查内容是否真实。钩子可以绕过（`git commit --no-verify`），所以它是本地闸门，不是安全边界。

参考：[commitlint](https://commitlint.js.org/)。

ReactLoom：已接入。`commitlint.config.mjs` 只扩展 `@commitlint/config-conventional`。版本是 `@commitlint/cli` 和 `@commitlint/config-conventional` 21.2.3。Lefthook 的 commit-msg 运行 `pnpm exec commitlint --edit {1}`。三个模板都复制这份配置。

## 4. Storybook 与 Chromatic

### 组件驱动开发

何时使用：一个按钮或一张卡片要在没有整页数据的情况下被看、被改、被测。Story 是组件的可运行示例。

优点：

- 状态（空、加载、错误、禁用）不用走完整登录流程。
- 可以和 MSW、a11y 插件放在同一个预览里。
- `build-storybook` 产出静态站点，给评审看。

缺点：

- Story 会和真实页面漂移。本仓库把 story 放在组件旁边，就是为了减少这个距离，但没有工具强制同步。
- Expo 上的 on-device Storybook 有自己的原生依赖，和 SDK 版本绑在一起。接不上时不要硬装。
- 生产构建必须把 Storybook 留在开发依赖里。本仓库用 `STORYBOOK=true` 关掉生产别名，避免 story 构建去解析空的 MSW 桩。

参考：[Why Storybook](https://storybook.js.org/docs/get-started/why-storybook)。

ReactLoom：

| | SPA | SSR | Expo |
| --- | --- | --- | --- |
| 状态 | 已接入 | 已接入 | 未实现 |
| 版本 | Storybook 10.6.1 | 同左 | 不安装 |
| 框架 | `@storybook/react-vite` | `@storybook/nextjs` | 不使用 `@storybook/react-native` |
| 配置 | `.storybook/main.ts`、`.storybook/preview.ts` | 同左 | 无 |
| Story 位置 | `src/**/*.stories.tsx` | 同左 | 无 |
| 命令 | `pnpm storybook` 端口 6006；`pnpm build-storybook` | 端口 6007；同一条构建命令 | 无 |
| 插件 | `@storybook/addon-a11y`、`msw-storybook-addon` | 同左 | 无 |

两条 `storybook` 脚本都带 `STORYBOOK=true` 和 `--no-open`。a11y 的 `parameters.a11y.test` 是 `todo`，静态构建不会因为现有 story 的可访问性问题失败。

Expo 未实现的原因写在模板的 `AGENTS.md` 里，也是 `template.json` 的 `storybook.reason`：`@storybook/react-native` 10.6.0 要 `react-native-safe-area-context` 5.8.0 和 `@gorhom/bottom-sheet`，而 Expo SDK 57 带的 safe-area-context 是 ~5.7.0，并且没有 bottom-sheet。不要为了 Storybook 去改 SDK 的原生依赖。

### Chromatic

何时使用：Story 的截图像素变了就要在 PR 上挡下来，并且要有人点接受或拒绝。Chromatic 吃的是 `build-storybook` 的产物。

优点：视觉回归和 Storybook 是同一批 story，不用再写一套截图测试。PR 上能看到差异。

缺点：要有 Chromatic 项目令牌，令牌不能进仓库。免费额度之外要付费。字体和抗锯齿会制造噪声。它不代替 Playwright 的用户流程。

参考：[Chromatic](https://www.chromatic.com/docs/)。

ReactLoom：未实现。没有 `chromatic` 依赖，没有工作流步骤，没有项目令牌。`pnpm build-storybook` 只在本地或你自己加上的 CI 里产出 `storybook-static`。视觉回归如果要做，下一步才是 Chromatic 或 Playwright 的截图，现在两样都没有接到闸门上。

## 5. 性能闸门

三样东西经常被放在一起说，它们量的不是同一个数。

| 工具 | 量什么 | 何时用 |
| --- | --- | --- |
| 自写 bundle budget | 构建产物的 gzip 字节 | 每次 `pnpm build` 都要失败得很快，规则就是一个数字 |
| size-limit | 配置里列出的入口 gzip 或运行时间 | 想用现成 CLI，并且在 CI 里对 PR 评论体积变化 |
| Lighthouse CI | 实验室里的性能、可访问性、SEO 分数 | 有一个可打开的 URL，要挡 LCP、总阻塞时间这类运行时指标 |

### 自写预算

优点：没有新依赖。失败信息就是哪一个文件、多少 KiB、预算多少。和 Vite 或 Next 的输出目录直接对应。

缺点：不理解「这个 PR 比 main 大了 2 KiB」。它只认识绝对上限。换了输出目录（Next 的客户端块位置变了）脚本就会报「没有 JavaScript」。

ReactLoom：已接入。

| 模板 | 脚本 | 何时跑 | 预算 |
| --- | --- | --- | --- |
| SPA | `scripts/check-bundle-budget.mjs` | `vite build` 之后，`pnpm build` 的一部分 | 全部 JS gzip 550 KiB，最大一块 280 KiB。输入是 `dist/assets/*.js` |
| SSR | `scripts/check-bundle-budget.mjs` | `next build` 之后 | 客户端 JS gzip 900 KiB。输入是 `.next/static` 下的 `.js`。没有单块上限 |
| Expo | 无 | `pnpm build` 只做 `expo export --platform web` | 未实现。体积用 `pnpm analyze` 看 Expo Atlas，不挡构建 |

不要为了让构建变绿去抬这两个数字。先看 `pnpm analyze` 的报告。

### size-limit

优点：配置短，CI 动作能在 PR 上比较基线。可以测 gzip，也可以用 headless 浏览器测运行时间。

缺点：和上面的脚本重复。两套预算会一个过、一个不过。size-limit 对 Next 的多块输出要自己列文件，列错就量错。

参考：[size-limit](https://github.com/ai/size-limit)。

ReactLoom：未实现。没有 `size-limit` 配置，也没有它的 GitHub Action。

### Lighthouse CI

优点：抓的是加载后的指标，不只是 JS 字节。可以和预览 URL 连在一起，在 PR 上挡回归。

缺点：

- 要先有一个已经起来的服务器。分数随机器和网络抖动，阈值要留余量，否则全是噪声。
- 它不代替本仓库已经在用的 `@axe-core/playwright`。可访问性规则两边都有，重复跑要决定以谁为准。
- Expo 的原生界面没有 Lighthouse。Web 预览才有。

参考：[Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)。

ReactLoom：SPA 和 SSR 已接入。`lighthouserc.cjs` 用 `@lhci/cli` 0.15.1，`pnpm lighthouse` 先构建再 `lhci autorun`。CI 作业默认开，仓库变量 `LIGHTHOUSE_CI=false` 或手动输入 `lighthouse: false` 会关掉。本地 `LIGHTHOUSE_LOCAL` 默认关。Expo 没有这个作业。Playwright 的 axe 扫描还在，它不代替 Lighthouse。字段和限速说明在 [Lighthouse](lighthouse.md)。

## 6. 从开发到部署

下面按一个人改完代码会经过的顺序写。每一步只列仓库里真的有的命令。

### 开发

| | SPA | SSR | Expo |
| --- | --- | --- | --- |
| monorepo | `pnpm dev:spa` | `pnpm dev:ssr` | `pnpm dev:mobile` |
| 模板目录或生成后的项目 | `pnpm dev` | `pnpm dev` | `pnpm dev` 或 `pnpm start` |
| 地址 | http://127.0.0.1:4317，Vite 自己打开 | http://127.0.0.1:4318，`scripts/open-browser.mjs` 打开 | 不打开浏览器。终端里按 `w` 看 Web |
| 关掉自动打开 | `CI` 为真，或 `REACTLOOM_OPEN=false` | 同左 | 本来就不会打开 |
| 新项目 | `pnpm exec create-reactloom <name> --template spa --dev` | `--template ssr` | `--template mobile` |

`--dev` 会安装依赖并在前台跑 `pnpm dev`。`--yes` 且不带 `--dev` 只生成，不启动。

### 提交

1. 改文件并 `git add`。
2. Lefthook pre-commit：Biome 改暂存文件，再跑 affected 类型检查和测试。失败则提交不成立。
3. commit-msg：commitlint。说明要像 `docs: add workflow research`。
4. 如果改的是 `@reactloom/api-client` 或 `create-reactloom` 的行为，再加 Changeset（下一小节）。模板本身不发版。

### CI

monorepo 根 `.github/workflows/ci.yml`：

| 作业 | 做什么 |
| --- | --- |
| `packages` | `pnpm lint`（Turbo 的包检查加根上的 `lint:root`）；`turbo run typecheck` / `turbo run test` 覆盖 API client 和 devtools；create-reactloom 的单元测试仍用带 `--exclude` 的 `vitest run`，排除 `src/scaffold.integration.test.ts`。另外跑 `scripts/check-ai-rules-sync.mjs` |
| `verify (spa)` / `verify (ssr)` / `verify (mobile)` | `turbo run lint typecheck test build`，按该模板过滤。Web 再加 Playwright。Expo 另恢复 `.expo` 和 `.metro-cache` |
| `lighthouse (spa)` / `lighthouse (ssr)` | `turbo run lighthouse`。默认开，见 [Lighthouse](lighthouse.md) |
| `smoke` | 生成三个模板并各自构建 |

Renovate 的自动合并等的就是这些检查名：`verify (spa)`、`verify (ssr)`、`verify (mobile)`、`packages`、`smoke`。

生成后的项目只有模板那一份工作流：安装，然后 `pnpm exec turbo run lint typecheck test build`，Web 再加 e2e 和 Lighthouse。缓存 `.turbo`。Expo 另缓存 `.expo` 和 `.metro-cache`，没有 Lighthouse。没有矩阵，没有 `concurrency`，没有 smoke。自建部署是另一份 `deploy.yml`，只有 `--deploy self-hosted` 才生成。Vercel 仍未实现。

### 预览

| | 命令 | 状态 |
| --- | --- | --- |
| SPA | `pnpm build` 之后 `pnpm preview`，仍是 4317 | 已接入。这是本地预览，不是托管环境 |
| SSR | `pnpm build` 之后 `pnpm start`，4318 | 已接入，同样是本地 |
| SSR 容器 | 见下面的 Docker | 已接入 |
| Expo Web | `pnpm build` 把静态资源导出到 `dist` | 已接入导出，没有托管 |
| PR 预览环境 | 无 | 未实现。没有 Vercel、Netlify 或类似的预览机器人 |

### Changesets

何时使用：一个仓库里有多个可发布的包，希望版本号和 changelog 由 PR 里的一个小文件决定，而不是手改每份 `package.json`。

优点：忽略列表可以把「只是模板、不发布」的包排除掉。版本提升和依赖的 patch 更新是同一条命令。

缺点：有人忘了加 changeset，版本就不会动。`commit: false` 时，`changeset version` 不会自己提交，要人再提交一次。

参考：[Changesets](https://github.com/changesets/changesets)。

ReactLoom：已接入 `@changesets/cli` 3.0.3。

| 项 | 值 |
| --- | --- |
| 配置 | `.changeset/config.json` |
| 命令 | `pnpm changeset`，然后 `pnpm version-packages`（即 `changeset version`） |
| `commit` | `false` |
| `access` | `restricted` |
| `baseBranch` | `main` |
| `changelog` | `@changesets/cli/changelog` |
| `ignore` | 根包 `reactloom`，以及三个模板包 |

模板不进版本。生成项目时，`ignore` 会改写成新项目的名字，避免 generated app 被当成要发布的包。ADR 0005 写明：这个仓库不发布包。不要假设 `changeset publish` 已经接在 CI 上。未实现的是发布步骤，不是 changeset 文件本身。

### Renovate

何时使用：希望依赖按计划分组更新，小版本在 CI 通过后自动合并，大版本留下给人看。

优点：分组能把 React、Expo、Next.js 各自收成一个 PR。`helpers:pinGitHubActionDigests` 把 Action 钉到提交哈希。锁文件维护可以每周一次。

缺点：仓库里的 JSON 不会自己开 PR。要安装 Renovate GitHub App，并让 `main` 保护规则要求上面那些检查。令牌不在仓库里，这是对的。

参考：[Renovate](https://docs.renovatebot.com/)、[config:recommended](https://docs.renovatebot.com/presets-config/)。

ReactLoom：配置已接入，App 未由仓库安装。

`renovate.json` 的要点：

- 扩展 `config:recommended` 和 `helpers:pinGitHubActionDigests`
- 时区 `Asia/Shanghai`，日程 `before 6am on Monday`
- 小版本、补丁、pin、digest，以及非 major 的 devDependency，在 CI 通过后 `platformAutomerge`
- major 不自动合并，标签是 `dependencies` 和 `major`
- 分组：ESLint、typescript-eslint、TypeScript、Vitest、Playwright、Tailwind、TanStack、React、Expo / React Native、Next.js
- `lockFileMaintenance` 每周一次，同样可自动合并
- `postUpdateOptions` 含 `pnpmDedupe`
- `rangeStrategy` 是 `bump`

三个模板的 `configs` 都复制 `renovate.json`。生成后的项目要自己去装 App，仓库不会替它装。

### Vercel

何时使用：Next.js 要预览部署和托管，并且团队接受 Vercel 的构建环境。SPA 也可以把 `vite build` 的 `dist` 交给它，但那不是 Next 的那条路径。

优点：pull request 有预览 URL。Next.js 的函数、图片和缓存与平台对齐。

缺点：构建环境要复现 pnpm 10、Node 22 和 `onlyBuiltDependencies`。本仓库的 SSR 还依赖 standalone 输出和 `SESSION_SECRET`。这些都要在项目设置里配，不能靠一份还没提交的 `vercel.json` 假装已经有了。Expo 不走 Vercel。

参考：[Vercel](https://vercel.com/docs)、[Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)（对照用，说明不托管在 Vercel 时的输出）。

ReactLoom：未实现。没有 `vercel.json`，没有 Vercel 项目连接，CI 也不部署。SSR 的托管路径是下面的 Docker。

### Docker

何时使用：SSR 要在自己的机器或任意容器平台上跑，并且要用 Next.js 的 `output: 'standalone'`，而不是 Vercel。

优点：镜像里是追踪过的文件，而不是整个 `node_modules`。端口和用户可以固定。

缺点：只覆盖 SSR。SPA 的 `vite preview` 和 Expo 的导出没有 Dockerfile。密钥 `SESSION_SECRET` 必须在运行时注入。本地构建为了能编过，会把 `REACTLOOM_STRICT_SECRETS` 设成 `false`，生产运行时要改成 `true`。

参考：[Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)。

ReactLoom：已接入，仅 SSR。`next.config.ts` 里 `output: 'standalone'`。

| 文件 | 谁用 |
| --- | --- |
| `Dockerfile.monorepo` | 在 monorepo 根目录构建。README 里的命令使用 `-f` 指向 SSR 模板旁的这个文件 |
| `Dockerfile.standalone` | `create-reactloom --template ssr` 之后改名为 `Dockerfile`。构建上下文是生成出的项目 |

生成后的镜像监听 `PORT=3000`。这和开发时的 4318 不是同一个端口。SPA 和 Expo 没有这两份文件，`template.json` 的 `docker` 只有 SSR 为真。

### EAS

何时使用：Expo 应用要打出 iOS 或 Android 安装包，或者用 EAS Update 发 JS 更新。配置是 `eas.json`，命令是 `eas build`。

优点：云端有对应 SDK 的原生工具链，不用每台机器装 Xcode 和 Android SDK。配置可以按 development、preview、production 分 profile。

缺点：要有 Expo 账户和令牌。它不代替本仓库的 `expo export --platform web`。CI 里没有模拟器，Maestro 也不在 CI 里跑，所以 EAS 不会自动补上设备测试。

参考：[EAS Build](https://docs.expo.dev/build/introduction/)、[Configure EAS](https://docs.expo.dev/build/setup/)。

ReactLoom：未实现。没有 `eas.json`，没有 `eas-cli`，工作流不调用 `eas build`。Expo 模板的 `pnpm build` 只导出 Web 到 `dist`。`pnpm android` 和 `pnpm ios` 是本地 `expo start --android` / `--ios`，不是云构建。设备流程是 `.maestro/login.yaml`，CI 不启动模拟器。

## 和三个模板的对应

| 阶段 | SPA | SSR | Expo |
| --- | --- | --- | --- |
| 本地任务缓存 | Turborepo `.turbo` | 同左 | 同左 |
| CI 安装缓存 | pnpm | pnpm | pnpm |
| CI 浏览器缓存 | Playwright | Playwright | 无 |
| 远程任务缓存 | 可选，未要求 | 同左 | 同左 |
| 路径过滤 | 未实现 | 未实现 | 未实现 |
| 提交闸门 | Lefthook + commitlint | 同左 | 同左 |
| Storybook | 已接入 | 已接入 | 未实现 |
| Chromatic | 未实现 | 未实现 | 未实现 |
| 体积闸门 | 550 / 280 KiB gzip | 900 KiB 客户端 gzip | 未实现，用 Atlas 看 |
| Lighthouse CI | 已接入 | 已接入 | 不适用 |
| size-limit | 未实现 | 未实现 | 未实现 |
| 预览 | `pnpm preview` | `pnpm start` 或 Docker | Web 导出，无托管 |
| 版本 | 模板被 Changesets 忽略 | 同左 | 同左 |
| 依赖更新 | 复制 `renovate.json` | 同左 | 同左 |
| 部署 | 未实现 Vercel | Docker standalone | 未实现 EAS |
