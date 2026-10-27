# ReactLoom Library Lab

独立前端工具库实战与 Agent 知识应用。119条目录已收录，当前仅首批示例逐步接入；目录数量不代表全部示例完成。

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
待完善：尚未接入条目的完整垂直示例与指南、Worker/SW独立 runner、真实依赖锁文件、CI与浏览器/性能证据。文档图片仅允许本地审核过的 raster 资产。

## 面向 Agent 的离线检索

无需安装前端依赖或启动浏览器，即可从库元数据定位精准条目：

```sh
node packages/library-lab/scripts/find-library.mjs --query "并发" --json
node packages/library-lab/scripts/find-library.mjs --id D03 --agent
node packages/library-lab/scripts/find-library.mjs --id D03 --related --json
node packages/library-lab/scripts/find-library.mjs --group E --limit 10
```

输出定位到 `library.json`、`agent.md`、`guide.md`、`examples/` 和 `verification.json`。条目已收录或源码已存在都不代表真实 SDK 测试通过。离线平台测试命令 `pnpm --filter @reactloom/library-lab test` **不加载 SDK**；SDK 专项测试必须单独执行 `test:sdk`，二者不可混淆。

源码面板使用 `source-index.json` 提供摘要与路径，用户选择后只下载该文件；浏览器支持 Web Crypto 时会核对 SHA-256。无需为查看某个 Demo 把该库所有源码一次下载。

## 静态依赖契约审核

`pnpm --filter @reactloom/library-lab catalog:check` 校验目录完整性及已接入 Demo 所声明的 npm 包名称、精确版本是否与此应用的 `package.json` 一致；该审核不执行安装，也不代表 TypeScript、构建、SDK 或浏览器已经通过。新增库由 AB/CD/EF 提交元数据，PLATFORM 统一确认依赖后再执行此门禁。

## Worker 演示协议

经过审查的 `executionKind: worker` 条目可以提供独立 ESM Worker 模块入口，生成器产生延迟创建的 `workerFactories`；**页面只有用户点击运行时才创建 Worker**。宿主向 Worker 发送 `{type:'start',level,runId}`，Worker 使用同一 `runId` 返回 `{type:'progress'|'result'|'error',message:string,runId}`；无效或过期消息被丢弃、文本截断，退出或45秒超时后终止 Worker。Worker 非不可信代码安全边界，不支持任意脚本执行。

`service-worker`、`persistent-network-interception`、`cross-origin-isolation` 等能力仍拒绝在主站运行，需独立 origin 审计。CLI/Node 示例仍仅提供可复制命令。该能力的生成器协议经过离线测试，但直到有真实条目、依赖安装和浏览器验收前，不能宣称 Worker SDK 运行 PASS。

## 定向 SDK 测试（避免每次运行全部库）

`node --test` 只执行实际存在的第三方库 Node 测试。新增的目标条目不存在测试文件时，运行器明确失败，不能把空集合记录为通过。

```sh
cd packages/library-lab
node scripts/sdk-runner.mjs --list                  # 查看全部实际 Node SDK 测试文件；不执行
node scripts/sdk-runner.mjs --entry=C17             # 指定一个库
node scripts/sdk-runner.mjs --entries=C17,C18,D06   # 仅执行指定库
node scripts/sdk-runner.mjs --group=F               # 仅执行 F 组实际 Node 测试
node scripts/sdk-runner.mjs                        # 所有 Node SDK 测试，包含全局测试
```

`--entry` / `--entries` 与 `--group` 不能混用；定向命令不会悄悄加入全局 `tests/sdk.test.mjs`。没有 Node 测试的 WebGL、编辑器或纯浏览器条目应通过单独的浏览器场景验证，**不能因 Node suite 为零就声称 PASS**。

## CLI workshops / 独立 Node 工具复现

F04 ExcelJS、F10 Orval、F16 dependency-cruiser、F18 rollup-plugin-visualizer 不伪装成浏览器执行。页面根据已审查的配置提供可复制命令；真实 CLI 验证统一由固定清单运行（需要 Node >=22.18、真实安装的依赖及本机权限）：

```sh
node packages/library-lab/scripts/cli-runner.mjs --list
node packages/library-lab/scripts/cli-runner.mjs --entry=F04
node packages/library-lab/scripts/cli-runner.mjs --entries=F10,F16,F18
```

CLI runner 仅执行仓库内硬编码的验证脚本，不接收外部 shell/path。未执行的 CLI 结果仍为 NOT_RUN，离线校验只能证明选择器输入和调用边界正确。Orval 8+ 需 Node.js >=22.18。


## 离线准备度报告（源码级，不执行 SDK）

```sh
pnpm library:status
node packages/library-lab/scripts/readiness.mjs --group=A
node packages/library-lab/scripts/readiness.mjs --json > /tmp/library-lab-readiness.json
```

该命令只读取本地 `library.json`、指南、Agent 规则、真实示例文件与 `verification.json`，逐源文件计算 SHA-256 和统一 `sourceFingerprint`；返回源代码接入数、三层配置声明数、运行类型数及 SDK/构建/浏览器证据状态。**只有当前源码指纹与 command/evidence 一致的 PASS 才保留**。缺文件或路径越界明确失败；本报告不安装 npm 包，不验证软件许可，也不替代真实运行日志。正式 SDK/生产构建/浏览器仍需要可执行环境。
