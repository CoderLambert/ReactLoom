# PLATFORM 进度

状态：PLATFORM_INCREMENTAL_DEVELOPMENT；本轮公共应用/Agent 检索/源码加载/静态依赖门禁已提交。运行环境尚未完整验证。
初始代码提交：38ed2d247bd82e4f1422b0e8904973e16bca2972，Draft PR #8，主Issue #4。119条身份目录，2库真实SDK import示例（clsx/p-limit，各3层），不代表119个Demo已实现。

## 本次真实验证

- `npm test`：17 PASS / 0 FAIL / 0 SKIP（目录、输入安全、来源路径、关联和实际源码生成器）。原始日志见 ../evidence/bootstrap-node.tap。
- `node scripts/generate.mjs --check`：119 entries / 6 loaders。
- 17个TS/TSX文件静态语法解析0错误；这不是依赖完整的类型检查。
- npm安装：容器DNS BLOCKED。
- `test:sdk`：真实包缺失，ERR_MODULE_NOT_FOUND，BLOCKED；没有以Mock替代目标SDK。
- 完整React构建/浏览器：NOT_RUN。
- GitHub PR工作流40373203132：2 jobs均在Runner启动前失败，steps=[]，runner_id=0；日志BlobNotFound404。尚不能确定原因。不得标成执行过typecheck/build/test。

## 已持久化

packages/library-lab公共框架/协议/源码，root LIBRARY_CATALOG.md；生成器可重建library-catalog.json、站内catalog、raw文档和动态loaders。4条每小时有限开发任务已启用，详见 SCHEDULE.md。AB/CD/EF分支均从初始提交建立，未来合并前读取最新head。

## 下批优先

1. 根AGENTS/README增加最小导航，root dev:library脚本；不要重写既有规范。
2. 审核worker依赖/PR；有真正可用运行环境时解析并提交pnpm-lock，恢复frozen门禁，不手造integrity。
3. Markdown目录/高亮/相对资源、移动端分类、异步读取竞态防护。
4. ECharts/Floating UI/RHF/p-limit/Monaco/MSW六风险切片；Worker/SW独立runner。
5. production preview烟测、资源卸载与源码同源证据。

定时runCount当前为0；这次人工批准后的启动实现不算定时运行。只记录实质变更，不重复发相同阻塞报告。main/旧模板/PR #3保持未动。


## 平台持续开发第1轮（2026-10-27，Asia/Shanghai）

实际集成分支新提交：

- `1bac1ac5a59e7d60ca049b7d9b93b9d7f18da239`：离线 Agent 检索 CLI `scripts/find-library.mjs`；支持中文场景、分组、准确 ID、JSON、按需阅读单个 agent.md。解决了此前“必须先运行 SPA 才知道如何检索知识”的缺口；根脚本 `library:find`。
- `3d4507c15bb4ed77f52be3a9172193fd36403ab3`：源码索引只保留元数据，示例实际源文件分别存放在 `raw/<ID>/sources/<path>`，页面只下载所选文件；切换时取消旧请求，Web Crypto 可用时校验 SHA-256；同步 Node/Playwright 回归源。
- `9ef9eff2ecee1c5a32649dc6760019fbded02ed2`：依赖契约检查 `scripts/validate-dependencies.mjs`；检测已接入示例的缺包、版本漂移、非法/重复包名，在无依赖 catalogue CI 中执行。`npm test` 修正为明确的离线单测文件列表，原先的 `tests/*.test.mjs` 会意外包含依赖 SDK 的 `sdk.test.mjs`，导致未安装 npm 时失败。这一问题现与 `test:sdk` 分离。

### 已整合与真实验证边界

本轮开始前已合入 AB PR #9（4库）、CD PR #10（4库+加固 D03）、EF PR #11（5库），连同原 C20/D03 共 **15 个条目有示例源码，45 个层级配置**；其中 F11 为 Node/MSW 实例入口，其余十四项是 React 示例入口。119条目录仍完整；**尚有104条未接入示例**，不将其计为完成。SDK、TypeScript 全量、生产构建、浏览器真实执行仍未验证通过。

- 在本轮本地容器源码副本执行 `node --test tests/catalog.test.mjs tests/document-utils.test.mjs tests/generate.test.mjs tests/find-library.test.mjs tests/validate-dependencies.test.mjs`：**28 PASS / 0 FAIL / 0 SKIP**。副本仅用于验证通用逻辑，不等于远程15个SDK已编译；该输出不含依赖测试。
- `node scripts/generate.mjs --check`：本地副本 **119 entries / 6 loader 配置**（只含最初两个集成 Demo），不是远端15个条目完整构建的证据。
- 全局 TypeScript 的 `transpileModule` 对新的 `demo-host.tsx` 作静态语法检查：0解析诊断；不等于 `tsc` 类型通过。
- 静态依赖审核已按15条远端 `library.json` 与当前 Lab package manifest逐项人工对照；新 CLI 的完整远端运行仍待真实 CI。
- 当前 GitHub Actions CI 与 Library Lab 工作流仍在分配 Runner 前失败（`runner_id=0, steps=[]`）；无构建日志。宿主容器无法解析 npm registry，不能生成可信 `pnpm-lock.yaml`。**不能声明 build/test:sdk/E2E PASS**。

### 下一轮最优先

1. 找到可运行的 pnpm/Node 依赖环境，真正解析并提交 `pnpm-lock.yaml`，恢复 `--frozen-lockfile`；保留原仓库 CI。
2. 验证全部 15 条示例真实模块类型/API 兼容，重点 Monaco Worker、MSW Node/浏览器 SW、RHF/FloatUI 等；逐条修复而不牺牲隔离或 SDK 真实性。
3. 将通用 schema/清理/隔离契约扩展至 frame、worker 和受限 SW；检查生成器在新条目扩容时的资源占用。
4. 继续审核和合入分组 PR，优先消除尚未接入的 104 条；公共变更针对性执行测试，保持 Draft #8。

runCount：1 / 24。所有后续自动开发从实际最新 GitHub commit/PR 恢复；记录不代表后续轮次一定执行成功。
