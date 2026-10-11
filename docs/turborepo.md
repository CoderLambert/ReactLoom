# Turborepo

本文说明 ReactLoom 怎么用 Turborepo 2.11.7 编排任务和缓存结果。照着做即可，不需要再装别的任务运行器。

Turborepo 不代替 Vite、Next.js 或 Expo。它只决定「哪个包的哪条脚本先跑、上次的产物还能不能用」。真正编译的仍是各包 `package.json` 里的命令。它也不是 Next.js 的 Turbopack。SSR 的 `next.config.ts` 里 `bundler: 'turbopack'` 是开发服务器的打包器，和 `turbo` 这条命令无关。

## 它是什么

一个仓库里有多份 `package.json` 时，你本来会写 `pnpm -r build` 或 `pnpm --filter <包> test`。Turborepo 在这之上多做两件事：

1. 按 `turbo.json` 的 `dependsOn` 排顺序。例如应用的 `build` 依赖 `^build`，共享包会先编出 `dist`。
2. 把一次成功运行的输入哈希和输出文件记在 `.turbo/cache`。输入没变就跳过命令，并把上次的 `dist` 或 `.next` 拷回来。

配置只有仓库根的 `turbo.json`。包自己不写第二份。版本钉在根 `package.json` 的 `devDependencies`：`turbo` `2.11.7`。

`turbo.json` 顶层设置 `"ui": "tui"`。根目录的三个 `dev:*` 快捷脚本也固定传给 Turbo 同一设置，避免终端包装器把仓库默认值降级为 stream；用户执行时不需要再加参数。CI 不执行 `dev` 任务，lint、typecheck、test 和 build 仍按 CI 的非交互模式输出。

## 为什么是它，而不是 Nx，也不是只留 pnpm

以前的决定写在 [ADR 0005](adr/0005-tooling.md)：工作区不大，`pnpm --filter "...[HEAD]"` 已经能少跑一些包。那条过滤现在还留在各模板自己的 `typecheck:affected` 脚本里。根脚本和 Lefthook 改用 Turbo，是因为过滤和缓存不是同一件事。

| | pnpm 递归 | Turborepo | Nx |
| --- | --- | --- | --- |
| 怎么调用 | `pnpm -r`、`--filter` | 包脚本不变，根上 `turbo run` | target、executor，常常再加插件 |
| 任务顺序 | 不管 `build` 要不要等上游 | `dependsOn: ["^build"]` | 项目图里的 target 依赖 |
| 跳过没改过的包 | `...[HEAD]` 可以 | `--affected`，另外再加内容哈希 | affected 是一等功能 |
| 复用 `dist` / `.next` | 不能。命令每次都跑 | 本地 `.turbo`，远程缓存可选 | 本地缓存，Nx Cloud 另算 |
| 和现有脚本的关系 | 脚本就是命令 | 脚本仍然是 Vite / Next / Expo / `tsc` | 插件可能再声明一套目标 |

选 Turborepo 的原因：

- 包脚本已经是真的构建命令。Turbo 去调用它们，不用把 Vite、Next、Expo 换成另一套 target。
- 配置是一份 `turbo.json`。Nx 的插件、executor 和代码生成，这个仓库用不上。
- 本地缓存立刻能用。远程缓存是后加的令牌，不配也能开发、也能过 CI。
- pnpm 的 `--filter` 仍然有用（Playwright 安装、CLI 的集成测试排除）。Turbo 不取代包管理器。

不选「只留 pnpm」的原因：`pnpm -r build` 每次都重编三个模板。`...[HEAD]` 能少选一些包，但不会把上次的 `dist` 或 `.next` 还回来，也不知道应用要等 `@reactloom/api-client` 的 `build`。

不选 Nx 的原因：三个模板加几个共享包，不需要生成器和插件生态。两套「谁受影响」叠在 pnpm 上，维护成本高于缓存收益。Nx 在本仓库仍是未实现。

## 两套布局，同一份 turbo.json

这份 `turbo.json` 同时给 monorepo 和 `create-reactloom` 生成的项目用。两边的根 `package.json` 不一样，所以不会递归。

**Monorepo。** 根包名是 `reactloom`。`pnpm-workspace.yaml` 只有 `packages/*` 和 `templates/*`，根包不在工作区里。根脚本写成 `turbo run build` 时，Turbo 不会再去执行这条脚本。它执行的是工作区包里的 `build`，例如 SPA 的 `vite build && node scripts/check-bundle-budget.mjs`。

**生成后的单项目。** 仍然保留 turbo。生成结果自己就是一个工作区：应用在项目根，`packages/` 里还有 API client、devtools 和 tsconfig。`pnpm-workspace.yaml` 写成：

```yaml
packages:
  - "."
  - "packages/*"
```

pnpm 10 允许把根目录算进工作区，于是 `pnpm exec turbo run build` 会先编共享包，再编应用。应用的 `build` 脚本必须保持 Vite、Next 或 Expo 的原命令。如果改成 `turbo run build`，根包在工作区里，Turbo 会再次执行它，形成递归。

因此：

| 你在哪 | `pnpm build` | `pnpm exec turbo run build` |
| --- | --- | --- |
| monorepo 根 | 就是 `turbo run build`，三个模板和共享包 | 同一件事 |
| 某个模板目录 | 只编这个包（`vite build`、`next build` 或 `expo export`） | 仍从仓库根读 `turbo.json`，按过滤跑 |
| 生成后的项目根 | 只编应用，不经 Turbo | 编 `packages/*` 和应用，并走缓存 |

生成器把根 `turbo.json` 列进三个 `template.json` 的 `configs`，于是复制到新项目，并把根 `package.json` 里的 `turbo` 版本写进新项目的 `devDependencies`。`docs/turborepo.md` 列在 `docs` 里，会一起复制。各模板的 `.gitignore` 含 `.turbo`。

## 常用命令

在 monorepo 根目录：

| 你想做的事 | 命令 |
| --- | --- |
| SPA 开发服务器 | `pnpm dev:spa`，即 `turbo run dev --filter=@reactloom/template-spa` |
| SSR | `pnpm dev:ssr` |
| Expo | `pnpm dev:mobile`，过滤的是 `dev` 脚本（`expo start`），不是 `start` |
| 检查 | `pnpm lint`、`pnpm typecheck`、`pnpm test`、`pnpm build` |
| 覆盖率 | `pnpm test:coverage` |
| 端到端 | 先 `pnpm test:e2e:setup`（这不是 Turbo 任务），再 `pnpm test:e2e` |
| 体积分析 | `pnpm analyze` |
| 只看会跑什么 | `pnpm exec turbo run build --dry` 或 `--dry-run` |
| 任务图 | `pnpm exec turbo run build --graph`（标准输出是 dot），或 `--graph=build.html` |
| 忽略缓存重跑 | `pnpm exec turbo run build --force` |
| 写运行摘要 | `pnpm exec turbo run build --summarize`（摘要在 `.turbo/runs`） |
| 自 `main` 以来有改动的包 | `pnpm typecheck:affected`、`pnpm test:affected`，或 Lefthook 里的那条 |

`--filter` 的写法和 pnpm 接近。根脚本用等号形式：`--filter=@reactloom/template-spa`。可以重复多次。生成后的项目里包名是项目名，一般不用这个过滤器，直接 `pnpm exec turbo run build`。

`--affected` 比较当前分支和 `main`。未提交的改动算进去。在功能分支上，这比「自当前 `HEAD` 起」更宽：自 `main` 以来的提交都算。要换基线，设置 `TURBO_SCM_BASE`。各模板 `package.json` 里的 `typecheck:affected` 仍是 `pnpm --filter "...[HEAD]"`，那是包自己的脚本，给「只看这一次提交」用。Lefthook 不调用它，Lefthook 调用 `pnpm exec turbo run typecheck test --affected`。

`--dry` 是 `--dry-run` 的同一选项。它打印将要执行的包和命令，不真正跑。用来确认根脚本没有被排进图里：图里不该出现命令为 `turbo run build` 的任务。

`--force` 等于不读已有缓存（`--cache=local:w,remote:w`）。输入没变也会重跑。

`turbo ls` 列出工作区包。monorepo 里应看到 API client、devtools、tsconfig、create-reactloom，以及 SPA、SSR、Expo 三个模板。不应把根包 `reactloom` 列进来。

## turbo.json 里每一项，对应本仓库

文件在仓库根。`$schema` 指向 `https://turborepo.dev/schema.json`。`envMode` 是 `strict`：没点名的环境变量不会传给任务。要让任务读到变量，就放进 `env` / `globalEnv`（参与哈希）或 `passThroughEnv` / `globalPassThroughEnv`（只传入，不参与哈希）。

### 全局

| 字段 | 本仓库的值 | 作用 |
| --- | --- | --- |
| `cacheDir` | `.turbo/cache` | 本地缓存。CI 用 `actions/cache` 存整个 `.turbo` |
| `globalDependencies` | `pnpm-lock.yaml`、`pnpm-workspace.yaml` | 这两个文件一变，所有任务的哈希都变。`turbo.json` 本身总是参与哈希 |
| `globalEnv` | `CI`、`NODE_ENV` | 所有任务都能读到，并且值进哈希。CI 里浏览器是否打开、Playwright 重试次数都看 `CI` |
| `globalPassThroughEnv` | `SESSION_SECRET`、`REACTLOOM_OPEN`、`EXPO_NO_TELEMETRY`、`FORCE_COLOR`，以及 `TURBO_TOKEN`、`TURBO_TEAM`、`TURBO_API` 等 | 任务用得上，但值不进哈希。令牌和会话密钥不能成为缓存键 |

`SESSION_SECRET` 不进哈希，是因为它不应被写进客户端产物。会改变构建结果的公开变量用另一组：`VITE_*`、`NEXT_PUBLIC_*`、`EXPO_PUBLIC_*`，写在具体任务的 `env` 上。`REACTLOOM_STRICT_SECRETS` 会决定 SSR 构建拒不拒绝开发密钥，所以它在 `build` 的 `env` 里，参与哈希。

`dev` 任务另外透传 `DBUS_SESSION_BUS_ADDRESS`、`DISPLAY`、`WAYLAND_DISPLAY` 和相关 `XDG_*` 桌面会话变量。Linux 的 click-to-source 需要这些变量调用系统注册的 `vscode://file` 协议，让桌面正常激活 VS Code；不再通过 Hyprland 强制聚焦窗口。这些变量在 CI 中不存在，因此不会改变非交互任务。

### 任务

`^build` 表示「依赖包的 `build` 先成功」。API client 的 `exports` 指向 `dist`，所以应用的 `dev`、`test`、`typecheck`、`build` 都依赖它。没有该脚本的包会被跳过，例如 `@reactloom/tsconfig` 没有 `build`。

| 任务 | 缓存 | 依赖 | 输出 | 说明 |
| --- | --- | --- | --- | --- |
| `build` | 是 | `^build` | `dist/**`、`.next/**`，排除 `.next/cache/**` | 包脚本仍是 tsc、Vite、Next 或 `expo export`。gzip 预算脚本在 SPA 和 SSR 的 `build` 里面，缓存命中表示这组输入已经通过预算 |
| `dev` | 否，`persistent`，`interactive` | `^build` | 无 | 开发服务器不退出，也不能被缓存 |
| `test` | 是 | `^build` | 无（只缓存日志和退出码） | `vitest run` 不写覆盖率 |
| `test:coverage` | 是 | `^build` | `coverage/**` | 这才是会产出覆盖率目录的任务 |
| `test:e2e` | 否 | `^build` | 无 | Playwright 会起服务器。Expo 没有这条脚本，Turbo 跳过它 |
| `lint` | 是 | 无 | 无 | 各包脚本是 `biome check .` |
| `//#lint:root` | 是 | 无 | 无 | 只在 monorepo 根执行 `lint:root` |
| `typecheck` | 是 | `^build` | 无 | `tsc --noEmit`。`.tsbuildinfo` 被排除在输入之外 |
| `analyze` | 是 | `^build`，不是 `build` | `dist/**`、`.next/**`（排除 cache）、`.expo/**` | 分析脚本自己会构建。不要写成依赖本包的 `build`，否则会构建两次 |
| `storybook` | 否，`persistent`，`interactive` | `^build` | 无 | `storybook dev`，不产出静态文件 |
| `build-storybook` | 是 | `^build` | `storybook-static/**` | 静态 Storybook 在这里。不要把这个目录挂到 `storybook` 或 `build` 上，那两个任务并不总是写出它 |

`//#` 是根任务前缀。monorepo 的根不在工作区里，普通的 `lint` 不会检查 `scripts/` 和 `packages/tsconfig`。根 `package.json` 的 `lint` 因此是 `turbo run lint lint:root`。`lint:root` 的命令是对那几处跑 `biome check`。生成后的项目把 `"."` 算进工作区，应用自己的 `biome check .` 已经覆盖项目根，不需要再加 `lint:root` 脚本。

输入用 `$TURBO_DEFAULT$`（包内文件），并排除 `dist`、`.next/cache`、`.expo`、`coverage`、`storybook-static`、`*.tsbuildinfo`，避免产物反过来弄脏下一次哈希。`build`、`test`、`typecheck`、`analyze` 另外包含 `$TURBO_ROOT$/packages/tsconfig/**`，共享 preset 一改就会失效。`lint` 额外包含 `$TURBO_ROOT$/biome.json`。

`build` 的 `env` 还有 `ANALYZE`、`STORYBOOK`、`REACTLOOM_STRICT_SECRETS`。`STORYBOOK=true` 时，生产构建用来丢掉 MSW 和 axe 的别名会关掉，所以它必须进哈希。`test:e2e` 点名 `VITE_DEVTOOLS`、`VITE_ENABLE_MSW`、`NEXT_PUBLIC_DEVTOOLS`、`NEXT_PUBLIC_ENABLE_MSW`，并放行 `PLAYWRIGHT_*`。

## 给新模板或新包加任务

1. 在那个包的 `package.json` 里写真正的命令，例如 `"build": "vite build"`。不要写成 `turbo run build`。
2. 任务名如果已经在根 `turbo.json` 里（`build`、`dev`、`test`、`lint`、`typecheck`、`analyze`、`storybook`），不用再声明一遍。Turbo 发现同名脚本就会套用那份配置。
3. 任务名是新的，就在根 `turbo.json` 的 `tasks` 里加一项：谁先跑（`dependsOn`）、哪些文件算输入、哪些目录是输出、哪些环境变量会改变结果。输出必须是这条命令真的会写的目录。挂上一个从不生成的目录，运行时会报找不到输出。
4. 共享包要被 `pnpm lint` 覆盖，就加上 `"lint": "biome check ."`。没有脚本的包会被跳过。
5. monorepo 根上如果要一个快捷方式，再加一条根脚本：`turbo run <任务> --filter=<包名>`。
6. 新模板要随 `create-reactloom` 出去时，模板的 `package.json` 就是生成后的根。脚本保持第 1 步的真命令。`turbo.json` 已经通过 `template.json` 的 `configs` 复制，不必在模板目录里再放一份。

包脚本里需要的新环境变量，补进对应任务的 `env`（影响产物）或 `passThroughEnv`（只是要读到）。漏了的话，strict 模式会把它从进程里拿掉，Vite 或 Next 会像没设过一样工作，而且不会报「变量被丢掉」。

## 缓存什么时候失效，怎么清掉

一次任务的哈希大致包括：

- 该任务的 `inputs` 匹配到的文件内容
- `env` 和 `globalEnv` 里那些变量的值
- `globalDependencies` 里的锁文件和工作区文件
- `turbo.json`
- `dependsOn` 里上游任务的哈希

下面这些**不会**使缓存失效：`passThroughEnv`、`globalPassThroughEnv`、被输入排除的 `dist` / `.next/cache` / `coverage` / `storybook-static`。所以改了 `SESSION_SECRET` 不会重编；改了 `NEXT_PUBLIC_*` 会，因为它在 `build` 的 `env` 里。

强制重跑当前命令：

```sh
pnpm exec turbo run build --force
```

清掉本地缓存再跑（冷运行）：

```sh
rm -rf .turbo
rm -rf node_modules/.cache/turbo
pnpm exec turbo run typecheck --filter=@reactloom/api-client
```

第二条路径是旧版 Turbo 的默认目录。本仓库把 `cacheDir` 设成 `.turbo/cache`，平时删 `.turbo` 就够。两条一起删可以确认没有落在别的目录。`.turbo` 已在根 `.gitignore`，也在三个模板的 `.gitignore` 里，不要提交。

冷运行的日志是 `cache miss, executing`。同样的命令紧接着再跑，应出现 `cache hit`，并且 `Cached` 计数大于 0。命中时命令不会执行，声明过的输出会从缓存恢复。

不要把「缓存命中」理解成「有人又检查了一遍预算」。预算脚本在 `build` 命令内部。命中表示这组输入以前跑过，并且当时退出码是 0。源码或列入 `env` 的变量一变，哈希就变，预算会重新跑。

## 远程缓存（可选，不要求）

CI 用的是本地目录加 GitHub `actions/cache`，不是 Vercel 远程缓存。不设置 `TURBO_TOKEN` 和 `TURBO_TEAM` 时，日志里是 `Remote caching disabled`。这样就能用。

工作流里的步骤（monorepo 的 `packages`、`verify`，以及三个模板各自的工作流）：

```yaml
- uses: actions/cache@v6
  with:
    path: .turbo
    key: turbo-${{ runner.os }}-${{ github.sha }}
    restore-keys: |
      turbo-${{ runner.os }}-
```

键带提交号，恢复时用同一系统上最近的一份。Action 主版本是 `actions/checkout@v7`、`pnpm/action-setup@v6`、`actions/setup-node@v7`、`actions/cache@v6`。pnpm 商店、Playwright 浏览器、`.turbo`、Expo 的 `.expo` 与 `.metro-cache` 是四份缓存，键和命中后的安装命令写在 [CI](ci.md)。

如果以后要开远程缓存，在本机：

```sh
pnpm exec turbo login
pnpm exec turbo link
```

或在环境和 CI 里设置：

| 变量 | 作用 |
| --- | --- |
| `TURBO_TOKEN` | 访问令牌。不要写进仓库 |
| `TURBO_TEAM` | 团队或组织 slug |
| `TURBO_API` | 自建实现时的 API 地址。用 Vercel 官方缓存就不用设 |

这三个名字已经在 `globalPassThroughEnv`，传给任务时不会进入哈希。仓库和 GitHub Actions 都没有配置它们。Nx Cloud 同样未实现。

monorepo 的 `packages` 作业不会用 `turbo run test --filter=create-reactloom`。那条会跑 `scaffold.integration.test.ts`。CLI 测试在该作业里仍是一条带 `--exclude` 的 `vitest run`，完整生成放在 `smoke` 作业。CI 里 `.turbo`、pnpm 商店、Playwright 和 Expo 的键写在 [CI](ci.md)。`dev` 的 `passThroughEnv` 包含 `LIGHTHOUSE_LOCAL`，所以本地开关不会被 strict 模式丢掉，也不会写进 `build` 的哈希。

## 和 Vite、Next、Expo 的关系

| 工具 | 谁启动它 | Turbo 做的事 |
| --- | --- | --- |
| Vite 8 | SPA 的 `dev` / `build` / `analyze` | 排在共享包 `build` 之后，缓存 `dist/**`。`dev` 不缓存 |
| Next.js 16 | SSR 的 `dev` / `build` / `analyze` | 缓存 `.next/**`，但不把 `.next/cache/**` 放进缓存。开发服务器仍是 `next dev`，打包器仍可以是 Turbopack |
| Expo SDK 57 | `dev`（`expo start`）和 `build`（`expo export`） | 缓存 web 导出的 `dist/**`。`analyze` 另外留下 `.expo/**`（Atlas） |
| Storybook | `storybook` 与 `build-storybook` | 只有静态构建写入 `storybook-static/**` |
| Lighthouse | SPA / SSR 的 `lighthouse` | `cache: false`。脚本自己 `pnpm build` 再 `lhci autorun` |
| `tsc`、Vitest、Biome | 共享包和模板上的同名脚本 | 按包缓存成功结果。Biome 不会被换成别的 linter |

改端口、别名、预算脚本、环境变量前缀时，改的是 Vite / Next / Expo 的配置和包脚本。只有「缓存该不该失效、谁该先编译」才改 `turbo.json`。
