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


## 平台持续开发第2轮（2026-10-27，Asia/Shanghai）

**本轮实际合入分组功能，而非仅巡检：**

- A/B PR #16（8个库）已由 PLATFORM 审核变更范围后 squash 合入 `feat/library-lab`，merge SHA `675704d7757ab4b3d929debccf8d9c96ec22eef5`；包括 D3、React Flow、AntV G6、Mermaid、GSAP、react-spring、dnd-kit、react-grid-layout。
- C/D PR #18（4个库）已由 PLATFORM 审核后 squash 合入，merge SHA `40fb6e9de5146c43e6431624e40222c2fdc139b8`；包括 React Virtuoso、TanStack Virtual、p-queue 和 Ky。
- 公共依赖声明统一补入9个新包及 `@types/d3`（提交 `479872535c8b2e714212a3bd0448a959e44c2c46`）；与新增条目声明的版本精确对齐。**并非已安装验证**，不能手写 `pnpm-lock.yaml`。
- 修正 Markdown 中的相对示例和测试源码链接，使其指向真实生成的 `raw/<ID>/sources/<path>`，阻止未发布的HTML/SVG/配置链接；修正根 `package.json` 重复的 `dev:library` 脚本键，清理过时静态Demo数量描述（`f34ac29e61e30ddbdb20a153ad7ddf16093eedb0`）。
- 新增 `scripts/root-catalog.mjs`，公共生成器和审计工具共用根目录机器/Markdown索引序列化逻辑；新增离线一致性测试（`97b2e443678110b23b3e19943b1b07c824b0d140`）。已根据当前条目的真实library.json逐组回写两份根索引，最终索引提交 `60307cf2666f1b80f495e9153229bdad9c7ae3de`；校验工具可用于平台集成Push及面向main的PR，不要求分组Worker修改公共索引。

**实际工作树复核：**从 GitHub `feat/library-lab@60307cf` 读取非截断 Git tree：119条library.json，47条已提交guide.md、agent.md、verification.json及各3个demo定义；根机器目录显示47个`contentState=recreated`、72个`missing`，与实际47份guide一致。六组分布：A7/B10/C8/D6/E8/F8。**47个源码/文档接入条目、141个分层配置，不等于47个SDK执行验收PASS；还有72项未接入。** 根Markdown与机器JSON均从实际条目同步，改造过程中没有发布到main。

**本轮离线证据：**在本地旧版119条目录快照上运行 `node --test tests/document-utils.test.mjs tests/generate.test.mjs tests/root-catalog.test.mjs`，**14 PASS / 0 FAIL**；对旧快照调用 `node scripts/generate.mjs` 后 `node scripts/root-catalog.mjs` 得到 `Agent index matches 119 entry manifests`。该测试验证新增的通用逻辑，**不验证本次远端47个示例的第三方SDK或TS类型**。GitHub MCP复核了远端完整树、两份索引对应条目47/47及六组分布；npm安装、真实SDK、tsc、Vite build、Chromium依旧 `BLOCKED/NOT_RUN`。

**CI边界调整：** `Library Lab` 工作流已允许对main的最终Draft PR #8启动，并在集成Push或主PR时核对根目录索引；worker PR base=feat/library-lab时跳过根索引检查，因为公共根索引只允许PLATFORM改。原仓库CI保留不变。Github Runner分配前失败的既有事实仍在Issue #12，未复跑相同阻塞；没有将无法运行的workflow标为通过。

**下批：**恢复真实pnpm仓库可用网络/Runner后生成锁文件并执行47条模块类型/官方SDK/生产预览的定向验证；同时继续安全集成新的分组PR，检查复杂库peer依赖及Worker/SW隔离。runCount：**2 /24**。集成仍为Draft PR #8，main未修改。


## 平台持续开发第3轮（2026-10-27，Asia/Shanghai）

**已直接集成三个完整分组批次**：AB PR #19（6条，squash SHA `53450048b895961925312732d87e84cf49d9a7f0`）、EF PR #20（5条，`774600c6f6b6550b59704166f6b617dfd795da6e`）、CD PR #21（5条，`c93304753ba6cafe7788ad53ea4f133edbdd63e7`）。事先复核所有 changed paths 属各自 entries 和 progress，并检查元数据/代表性目标 SDK 源码；合入的是可审查源码，不是实测通过。用户主 PR #8 保持 Draft，main 与既有 PR #3 均未修改。

公共提交 `cf54e0b324d8c68b45b1b999c1085e5a05c74b52`：登记新 16 个条目所需的 22 个生产包和 6 个开发包；根 `LIBRARY_CATALOG.md` 与 `library-catalog.json` 按实际源码收录情况同步到 **119目录 / 63份独立工作坊源码、指南、agent.md / 189项 basic/business/advanced 场景声明 / 56待完成**。六组 A11/B12/C10/D9/E10/F11；189项是场景配置总数，不是SDK 189 PASS。

**当前公共平台代码继续推进**：Node/CLI 展示规则新增真实 Storybook Story + 配置，以及 Knip 独立fixture basic/business/advanced可复制命令；仍然不在浏览器执行shell、不允许任意命令参数或文件路径。代码高亮器增加实际 source+language 身份绑定，切换源码时立即隐藏旧Shiki tokens并废弃未完成任务，避免出现"展示代码属于前一文件"。在本地隔离快照对命令规则运行 `node --test tests/reproduction.test.mjs`：**6 PASS / 0 FAIL**；高亮组件全局 TypeScript `transpileModule` 语法诊断0。以上均非真实 React build/SDK 测试。

**关键已确认集成冲突**：F07 react-pdf 11 的内部 pdfjs-dist 为6.3.289，F06条目声明6.4.299；当前Lab运行清单采用6.3.289保护F07同模块worker版本，并将F06协议不一致单独跟踪 Issue #22。F06需EF将代码/元数据/文档/测试一起改至兼容版本，或独立隔离Vite构建；在消除不一致前 `catalog:check` 的 dependency audit预期FAIL，不能削弱门禁、伪造 PASS。

**未解决的真实环境条件**：Node包实际安装、pnpm-lock冻结、TypeScript完整检查、Vite production build、目标SDK/Chromium真实执行仍BLOCKED/NOT_RUN；此前GitHub Actions runner_id=0,steps=[]，详见#12。不要用Mock、静态审计或原研究包历史结论冒充运行验收。

**下批**：先合并新增依赖的静态合法性与F06/F07版本冲突修复，再继续 worker 波次、审查React19/peer/CSS Worker、补真正锁文件及打包级隔离检查。有可用运行环境后先定向检查63条实际源码、六风险切片与关键浏览器操作，再恢复完整frozen CI。runCount：**3 / 24**。
