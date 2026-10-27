# ReactLoom Library Lab

独立前端工具库实战与 Agent 知识应用。119条库的源码示例、中文指南与 Agent 文档已接入，357项三层场景是**声明数量，不是 SDK / 浏览器测试通过数量**。依赖安装、TypeScript 全仓检查与 Vite/Chromium 仍待可用 Runner 验证。

```sh
pnpm install
pnpm --filter @reactloom/library-lab dev
# http://127.0.0.1:4319
pnpm --filter @reactloom/library-lab test
pnpm --filter @reactloom/library-lab test:sdk
pnpm --filter @reactloom/library-lab typecheck
pnpm --filter @reactloom/library-lab build
pnpm --filter @reactloom/library-lab test:e2e:setup
pnpm --filter @reactloom/library-lab test:e2e
```

依赖锁文件需由集成任务通过真实pnpm生成。没有依赖时可直接运行 `node scripts/generate.mjs` 和 `npm test` 验证目录与平台纯逻辑，不代表 SDK 通过。

源码、guide.md、agent.md 与相关关系按 `entries/<ID>-<slug>` 组织。运行 `catalog:generate` 生成原文、源码哈希、动态loader和根索引。主站不自动运行下载大型SDK，不把未接入条目伪装成真实效果。

当前实现：119条目录与分类搜索（含移动端）、四Tab深链接、安全Markdown原文/目录与按需 Shiki 高亮、源码SHA-256清单、显式启动/停止、CLI可复现命令提示、sourceFingerprint 证据失效判定、局部错误边界。已有部分条目接入真实SDK调用源码（含非Web MSW Node入口），准确数量以源目录及生成索引为准；构建/SDK/浏览器运行状态必须以实际验证证据为准。
待完善：真实依赖安装和冻结锁文件、目标 SDK 与浏览器执行证据、特殊 Worker/SW 独立 runner、许可证复核、CI 与性能验收。119 条源文件及指南的存在不等于运行通过。文档图片仅允许本地审核过的 raster 资产。

## 面向 Agent 的离线检索

无需安装前端依赖或启动浏览器，即可从库元数据定位精准条目：

```sh
node packages/library-lab/scripts/find-library.mjs --query "并发" --json
node packages/library-lab/scripts/find-library.mjs --id D03 --agent
node packages/library-lab/scripts/find-library.mjs --id D03 --related --json
node packages/library-lab/scripts/find-library.mjs --group E --limit 10
```

输出定位到 `library.json`、`agent.md`、`guide.md`、`examples/` 和 `verification.json`。条目已收录或源码已存在都不代表真实 SDK 测试通过。离线平台测试命令 `pnpm --filter @reactloom/library-lab test` **不加载 SDK**；SDK 专项测试必须单独执行 `test:sdk`，二者不可混淆。

首页只读取生成的 `public/catalog-index.json`（119条轻量目录，包含用途与检索标签，**不携带所有第三方 SDK、运行配置和完整验证证据**）。进入某一个库时，才读取 `public/raw/<ID>/detail.json`；详情根据索引中的条目编号、slug、分组和 `sourceFingerprint` 再次验证，避免旧版 CDN 缓存与新版入口混合。跨库导航会取消未完成的请求，并提供失败重试。为不破坏离线工具，生成器仍保留完整版 `catalog.json`。页面四个 Tab 的文档与真实 Demo 维持独立懒加载。

源码面板使用 `source-index.json` 提供摘要与路径，用户选择后只下载该文件；浏览器支持 Web Crypto 时会核对 SHA-256。无需为查看某个 Demo 把该库所有源码一次下载。

## 静态依赖契约审核

`pnpm --filter @reactloom/library-lab catalog:check` 校验目录完整性及已接入 Demo 所声明的 npm 包名称、精确版本是否与此应用的 `package.json` 一致；该审核不执行安装，也不代表 TypeScript、构建、SDK 或浏览器已经通过。新增库由 AB/CD/EF 提交元数据，PLATFORM 统一确认依赖后再执行此门禁。

## Worker 演示协议

经过审查的 `executionKind: worker` 条目可以提供独立 ESM Worker 模块入口，生成器产生延迟创建的 `workerFactories`；**页面只有用户点击运行时才创建 Worker**。宿主向 Worker 发送 `{type:'start',level,runId}`，Worker 使用同一 `runId` 返回 `{type:'progress'|'result'|'error',message:string,runId}`；无效或过期消息被丢弃、文本截断，退出或45秒超时后终止 Worker。Worker 非不可信代码安全边界，不支持任意脚本执行。

`service-worker`、`persistent-network-interception`、`cross-origin-isolation` 等能力仍拒绝在主站运行，需独立 origin 审计。CLI/Node 示例仍仅提供可复制命令。该能力的生成器协议经过离线测试，但直到有真实条目、依赖安装和浏览器验收前，不能宣称 Worker SDK 运行 PASS。

## 定向 SDK 测试（避免每次运行全部库）

`test:sdk` 只收集显式命名的 `sdk.test.mjs` / `node-scenarios.test.mjs`；**纯业务政策 `.test.mjs` 不再计入 SDK 套件**。新增的目标条目不存在真正 SDK 套件时，定向选择明确失败，不能把零个目标 SDK 测试记录为通过。套件命名只是候选范围，运行成功仍需核对真实 SDK 导入和日志。

```sh
cd packages/library-lab
node scripts/sdk-runner.mjs --list                  # 查看全部实际 Node SDK 测试文件；不执行
node scripts/sdk-runner.mjs --entry=C17             # 指定一个库
node scripts/sdk-runner.mjs --entries=C17,C18,D06   # 仅执行指定库
node scripts/sdk-runner.mjs --group=F               # 仅执行 F 组实际 Node 测试
node scripts/sdk-runner.mjs                        # 所有 Node SDK 测试，包含全局测试
```

`--entry` / `--entries` 与 `--group` 不能混用；定向命令不会悄悄加入全局 `tests/sdk.test.mjs`。没有 Node 测试的 WebGL、编辑器或纯浏览器条目应通过单独的浏览器场景验证，**不能因 Node suite 为零就声称 PASS**。

## 纯策略回归（与 SDK 验收隔离）

独立执行纯粹的输入校验、并发/撤销状态、资源释放判定、Worker 注册作用域、页面与图表策略；支持 `.test.mjs` 与使用 Node 类型剥离的 `.test.mts`，**无论结果如何均不得填写目标 SDK PASS**。部分测试可能依赖特定条目文件或已安装包，执行失败不得降级为假通过。

```sh
cd packages/library-lab
node scripts/policy-runner.mjs --list
node scripts/policy-runner.mjs --entry=C07
node scripts/policy-runner.mjs --group=B
pnpm test:policy
```

测试目录约定：`entries/<ID>-<slug>/(examples|tests)/*.test.(mjs|mts)`。仅 `sdk.test.mjs`、`node-scenarios.test.mjs` 属于正式 SDK 套件；其他名称仅作为政策级回归候选。测试分类与运行命令要分别记录，避免将非 SDK 回归数量累加到 SDK 已通过数。

Library Lab CI 在完整平台 Node 测试后，通过 `node scripts/policy-runner.mjs --changed-base=<40位Git SHA>` 比较真实 Git 差异：仅源文件、`library.json` 或测试变动的条目运行其纯策略用例；公共 `src/scripts/tests`、本包配置、依赖/锁文件与 Lab CI 变化会全量运行纯策略；指南、Agent 与进度文本不会无意义地触发所有条目。Git 差异无法读取时安全回退运行全部策略，不把 `SKIP` 当 SDK PASS。此增量机制不替代独立 TypeScript、SDK、构建与 E2E 检查。

## CLI workshops / 独立 Node 工具复现

D16 Workbox、D21 Pagefind、F04 ExcelJS、F10 Orval、F15 Knip、F16 dependency-cruiser、F18 rollup-plugin-visualizer 均通过固定 CLI 白名单在本机验证，不伪装成浏览器执行。其中 D16 只生成隔离工作坊资产，不在主站注册 Service Worker；所有 CLI 运行需要对应的真实依赖和本机权限（项目要求 Node >=22.18）。

```sh
node packages/library-lab/scripts/cli-runner.mjs --list
node packages/library-lab/scripts/cli-runner.mjs --entry=F15  # 三组真实 Knip JSON 报告
node packages/library-lab/scripts/cli-runner.mjs --entries=D16,D21 # 独立 Workbox/Pagefind 构建
node packages/library-lab/scripts/cli-runner.mjs --entries=F04,F10,F16,F18
```

CLI runner 仅执行仓库内硬编码的验证脚本，不接收外部 shell/path。未执行的 CLI 结果仍为 NOT_RUN，离线校验只能证明选择器输入和调用边界正确。Orval 8+ 需 Node.js >=22.18。


## 离线准备度报告（源码级，不执行 SDK）

```sh
pnpm library:status
node packages/library-lab/scripts/readiness.mjs --group=A
node packages/library-lab/scripts/readiness.mjs --json > /tmp/library-lab-readiness.json
```

该命令只读取本地 `library.json`、指南、Agent 规则、真实示例文件与 `verification.json`，逐源文件计算 SHA-256 和统一 `sourceFingerprint`；返回源代码接入数、三层配置声明数、运行类型数及 SDK/构建/浏览器证据状态。**只有当前源码指纹与 command/evidence 一致的 PASS 才保留**。缺文件或路径越界明确失败；本报告不安装 npm 包，不验证软件许可，也不替代真实运行日志。正式 SDK/生产构建/浏览器仍需要可执行环境。

## FFmpeg Core 授权与构建（E19）

包声明包含 `@ffmpeg/ffmpeg@0.12.15`（JS wrapper）及 `@ffmpeg/core@0.12.10`（大体积单线程二进制，GPL-2.0-or-later）。**默认不复制核心 WASM，也不把 E19 标成已运行。** 仅在完成目标分发形式的许可证、编解码器和 NOTICE 审核后，设置 `LIBRARY_LAB_FFMPEG_CORE_LICENSE_REVIEWED=true` 再运行 `pnpm --filter @reactloom/library-lab build`。构建脚本会校验准确版本/许可，生成带 SHA-256 的同源 `public/ffmpeg-core/`，卸载旧生成资产时不碰用户手工文件。核心资源不提交 Git、不自动从 CDN 拉取。开关并不代表法律授权；实际交付仍需手动核验许可证与浏览器 WASM/Worker/CSP。未设置开关时用户访问 E19 看到真实阻塞，而不是假演示。官方来源：https://www.npmjs.com/package/@ffmpeg/core

## 本机真实验收与锁文件恢复（显式执行）

`pnpm verify:library` 默认只打印步骤，不访问 registry、不改锁文件、不启动浏览器；专门避免在受限环境反复无效安装。需要 **Node ≥22.18 和 pnpm 10.x**：

```sh
pnpm verify:library                                      # 只查看固定执行计划
pnpm verify:library --execute                            # 冻结安装 → 目录/Node逻辑 → tsc → Vite
pnpm verify:library --execute --sdk-entry=D03             # 上述门槛通过后运行指定真实SDK
pnpm verify:library --execute --browser --setup-browser   # 上述门槛通过后安装并运行Chromium
pnpm verify:library --execute --resolve-lock              # 仅干净的feat/library-lab分支，真实pnpm解析锁
```

必须先确认当前分支与 `pnpm-lock.yaml` 工作区改动；`--resolve-lock` 会用真实 pnpm 执行 `install --lockfile-only --no-frozen-lockfile`，然后立即运行 `install --frozen-lockfile`，从不手写 integrity。分组开发分支不得使用此开关修改公共锁文件。结果按命令写入本地、被 Git 忽略的 `packages/library-lab/.local-evidence/<timestamp>-<sha>/`，含分步 stdout/stderr、状态、当前 Git SHA、工具版本与锁摘要；不会自动上传到 GitHub。正式发布前仍需审查真实日志并将合法根锁文件提交到集成分支，把 CI bootstrap 切回冻结安装。

每个测试阶段只在前面阶段真实通过后执行。日志中 `PASS` 是**具体命令级结果**，不是给 119 个库自动赋予 SDK/浏览器 PASS；现有 GitHub Actions Runner 分配前失败时仍标 BLOCKED／NOT_RUN。新增选项、解析规则的 Node 单测不替代软件依赖的构建。
