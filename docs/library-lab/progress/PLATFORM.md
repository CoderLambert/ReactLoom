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


## 平台持续开发第4轮（2026-10-27，北京时间）

### 完成的实际 GitHub 集成与代码

- AB wave5 PR #23（6条：A16 MapLibre、B07 MUI、B08 Mantine、B10 Base UI、B11 Radix、B12 React Aria）审查只改 A/B 条目与进度，6份 library.json、18个分层入口，已 squash 到 feat/library-lab：`dba70e9137239f80518020da857ac5cafdb3a89d`。
- CD wave5 PR #24（5条：C17 i18next、C18 react-i18next、D06 Immer、D11 Jotai、D20 MiniSearch）审查只改 C/D 条目与进度，5份 library.json、15个分层入口，已 squash 到 feat/library-lab：`289282a4ada7a5ce34dc381cf9d034adabafed90`。
- 公共依赖通过 `534e7e7c1feefc55420ccdaf21ca064efadff0b0` 提交：新增/调整14个 package 条目，与这11份元数据记录的版本完全一致；同时重建追踪的根目录 `library-catalog.json` 与 `LIBRARY_CATALOG.md`（119条）。这只是**静态依赖合同匹配**，不是 npm 已解析的证明。
- 公共 SDK runner `53e6c93003b08f6aac14da9c375e210e6b12540a` 增加 `--entry`/`--entries`/`--group`/`--list`，缺失指定的实际 SDK Node 测试时直接报错，避免空测试误报 PASS。默认仍运行全量真实 Node SDK 测试。新增测试保护选择、跨组排除与注入参数校验。
- 增加移动端分类、Radix Tabs 手动键盘激活、文档不预加载 Monaco 的 Playwright 回归场景，并补 README 运行入口。新增浏览器测试**仅提交源码，未执行**。

### 真实进度与验证边界

- 完整身份目录仍 **119/119**；有独立 `guide.md`、`agent.md` 与示例实现的条目 **74/119**；演示选择元数据为 **222**（主要是每条basic/business/advanced复用实现），剩余 **45条** 仍无完整垂直实现。
- 通过非截断 Git Tree 逐路径统计：119个 entry，74个含真实源码/双指南，**23个条目**有实际提交的 `tests/*.test.mjs` SDK Node suite。其余库可能需要浏览器验证，但不能当作已经验证；23 是“测试文件存在”而不是 SDK 已经 PASS。
- 在离线本地平台工作副本（部分模块版本可能早于当前远端集成）运行SDK选择器及公共纯 Node 测试：`node --test ...` **57 PASS、0 FAIL**；SDK runner 新增测试 **6 PASS**；静态 TSX 语法解析 0 诊断。由于本地副本不是最新74库完整版本，此结果仅证明公共逻辑/新选择器，不是远端74条目构建或浏览器运行证据。
- npm依赖真实安装、可信 `pnpm-lock.yaml`、完整 TypeScript、Vite build、SDK runtime、Chromium E2E依旧 **BLOCKED/NOT_RUN**。最近GitHub Actions run 40408615999 两个 job 均 `steps=[]` / 无Runner执行证据；旧共享阻塞维持Issue #12。不修改计费配置、不自造锁文件、不通过Mock冒充SDK。
- F06/F07 PDF.js runtime/Worker 版本不一致仍是Issue #22硬阻塞，继续由 EF 修复并交由PLATFORM统一依赖；不得把 catalog:check 当成功，直到不一致真实消除。

### 下一批

1. 优先审核下批 worker PR：已接入条目全量静态依赖审计，统一包版本；若 PDF.js #22有 EF 修复则立即集成并核对Worker版本。
2. 寻找真实可用的Node22+/pnpm10执行环境，**生成真正锁文件而非手造 integrity**，冻结CI安装后执行SDK入口与真实TypeScript构建；如 Runner仍无法分配，继续不受阻的公共安全与可用性开发。
3. 继续推进独立frame/SW运行器安全边界、Markdown/示例完整源码展示、移动端键盘和视图卸载专项验证，先用离线确定性测试保护公共协议。

runCount：**4/24**。main与旧模板保持未修改，Draft PR #8维持待最终验收状态；本轮非完整生产验收。


## 平台持续开发第5轮（2026-10-27，北京时间）

**已实际集成17个新库、3个分组PR；不是仅更新进度：**

- EF wave5 PR #25：审核后squash合入 `d3e26d54b12bf972840ed3151d3bd067a0d0d452`，5个库：E13 PhotoSwipe、E14 react-easy-crop、E15 pica、F16 dependency-cruiser、F18 rollup-plugin-visualizer。
- AB wave6 PR #26：审核后squash合入 `d2445e91844e0b5ffccc75f4004b4c3a05de63fe`，7个库：A13 Three.js、A14 React Three Fiber、A17 deck.gl、B09 shadcn/ui、B14 Pragmatic drag and drop、B21 react-motion现代迁移、B22 react-beautiful-dnd现代迁移。
- EF wave6 PR #27：与#25的EF进度追加发生合并冲突，未强推覆盖。审核49个PR变更后，仅将48个EF条目文件叠加在当前集成树，EF进度保留原258行并安全追加wave6 56行；使用two-parent Git commit `21ba998181fc680b38831842821f790e39580b1e` 合并到feat/library-lab。GitHub确认PR #27为merged。该批5库：E18 wavesurfer.js、F04 ExcelJS、F08 @react-pdf/renderer、F09 pdf-lib、F10 Orval。
- 公共依赖与根索引：`419011568efbe6d41ec64cb91b78ef9fc72625ff` 添加新条目实际声明的生产/开发包及`@types/three`，保持Node/CLI构建工具为dev-only；同步119条`library-catalog.json`和`LIBRARY_CATALOG.md`。这只是严格静态版本合同，不是npm安装成功。
- 公共 CLI 真实复现：`8162548a2f49467760e932d8698b20e97cf7dd2d` 引入固定4条Node/CLI verifier(F04/F10/F16/F18)，浏览器仅复制真实命令不执行shell；F16和F18的“展示命令”指向真正的Node runner和独立Vite fixture。发现GitHub提交过程的反斜杠转义问题，立即用`e1e1e4bf70460ef5e394e74f1ddd81e021eef3c7`修正表达式；`4c5be0ecc9d570b5c5f30d6e714c795c8a697b19`阻止不可信demo.level注入可复制CLI命令。

**可核对的全量文件结构（GitHub完整递归树，非截断）：**119份library.json，91份guide.md和agent.md，剩余28条未接入完整文档/示例；三层basic/business/advanced配置共273个。库目录A17/B22/C22/D21/E19/F18未变。91条是已提交源码及笔记，不是91个真实运行通过。

**本轮实际测试：**在本地部分旧版平台快照执行`node --check scripts/cli-runner.mjs`与`node --check tests/cli-runner.test.mjs`成功；`node --test tests/cli-runner.test.mjs tests/reproduction.test.mjs`在新注入防护前13 PASS、补丁后**14 PASS/0 FAIL**。只证明新CLI/命令安全通用逻辑，不代表完整远端91个SDK或TypeScript/Vite经过运行。远端新依赖下载、实际pnpm-lock、tsc、Vite build、Chromium E2E仍**BLOCKED/NOT_RUN**；GitHub Actions最新run显示失败，原已证实Runner分配前失败，Issue #12保持开放。F06/F07 PDF.js Worker版本不一致#22继续阻断依赖合同，不通过弱化门禁掩盖问题。

**下一轮优先队列：**一是EF修复F06/F07版本冲突后合入；二是核查AB/CD/EF剩余28条的PR并同步公共版本/索引；三是完善Worker/SW/frame隔离与证据展示；四是可用Node>=22.18/pnpm10/Runner出现时立即解析可信锁文件、执行受影响SDK/CLI/真实构建/浏览器测试，逐项写入可追溯证据，不继承历史PASS。

runCount：**5/24**。本次只向`feat/library-lab`集成，`main`和既有PR #3未改，最终PR #8仍Draft。不会因某次失败而假装已跑过完整生产验收。


### 第5轮并行任务同步追加：CD PR #28

在本轮进行期间，CD分支新增 PR #28（C03 Valibot、C06 IMask、C11 react-arborist、C19 nuqs、D15 Dexie、D18 Comlink，共6条/18个分层入口）。PLATFORM审查所有50个变更路径均属于C/D条目和自己的进度文件，结合官方资料核查 react-arborist adjustMoveIndex 已在v3.15正式导出、nuqs TanStack Router adapter 的实验性支持；squash合入`c58f18ea8656aebebc09c204b89739065c643150`至集成分支，无main改动。

统一新增valibot/imask/react-imask/react-arborist/nuqs/dexie/comlink及fake-indexeddb（仅dev）真实版本声明，再同步两个根目录索引。远端GitHub提交结构总计 **119目录、97份指南和Agent手册、291个分层配置、剩22条待完整接入**，不代表运行验收已过。C19路由兼容、D15 IndexedDB事务/迁移和D18实际Worker需要真实浏览器跟踪；新增6条SDK测试仅存源码，未执行。PDF.js #22、pnpm-lock/Actions #12仍为阻塞。本轮runCount保持5/24，下一轮从实际分支head恢复。


### 本轮平台完整性门禁（第5轮收尾）

提交 `f6a397dc80ad122f82133a411c7e5cf2942ebeb1`：在完整119目录生成时新增 `entryCompletenessIssues` 检查。标成`reviewed/imported/recreated`的库必须同时具有`guide.md`、`agent.md`、`AGENTS.md`、`verification.json`，且basic/business/advanced各自准确一个，示例入口必须包含在实际`sourceFiles`中；标记missing的库不得暴露可运行Demo。单条生成器fixture仍可独立测试而无需铺119个目录，旧目录的PASS过期机制保留。

**本地局部平台快照**执行`node --check scripts/entry-gate.mjs`、`node --check scripts/cli-runner.mjs`和`node --test tests/entry-gate.test.mjs tests/cli-runner.test.mjs tests/reproduction.test.mjs`，共 **18 PASS / 0 FAIL**，仅覆盖离线纯Node规则与命令防护。远端新生成器未在完整当前依赖集运行，不把本记录当作 `pnpm install/typecheck/build/SDK/E2E` 通过。

最新静态GitHub完整树（truncated=false）：119份library.json、97份guide.md、97份agent.md、97份AGENTS.md、97份verification.json，剩下22个缺条目明确在Git树中。开发分支持续保存；runCount仍是本次**5/24**，下轮继续集成剩余22条、阻塞修复与全量真实构建证据。


## 平台持续开发第6轮（2026-10-27，北京时间）

- **真实集成**：审核AB Draft PR #29 共26个文件（仅 A09/A10/B05 条目及AB进度），因为GitHub拒绝直接merge Draft PR，改用精确双亲非强推合并 `10e7311b3a2247a9af948b8d7c2e0b444c367d0a`；GitHub已确认PR #29 merged。接入 Excalidraw、tldraw、Rive 三条源码/指南/agent/验证记录。tldraw自定义许可保留生产锁，不提供或绕过license；Rive使用引用的远程素材，不复制资产。
- **公共依赖与索引**：`01cdbdd7cf8abb1bf1435e4dc1ad776a4908681b` 统一登记 `@excalidraw/excalidraw@0.18.1`、`tldraw@5.5.2`、`@rive-app/react-webgl2@4.37.0`，根目录119条索引同步，准确文件树为 **119 manifest / 100 guide / 100 agent.md / 100 AGENTS.md / 100 verification.json / 300场景声明 / 19待接入**。版本通过npm/官方网页核对，但不是实际pnpm安装或React19 peer验收。
- **新公共能力**：`59bb1e668ceee7f15e418c77ba248cf2b6feed25` 新增离线 `library:status` 源码准备度CLI与共享 verification-contract。读取实际源码字节并计算 SHA-256，生成SDK/build/browser分项状态和无SDK依赖的JSON报告；未附当前指纹/命令/证据的旧PASS自动降为NOT_RUN。现有 catalogue generator改用同一份指纹算法，避免前端展示与Agent状态统计漂移。附7项定向Node单测。
- **本轮实际执行**：在本地部分旧版119目录副本，执行 `node --test tests/readiness.test.mjs tests/generate.test.mjs tests/catalog.test.mjs` 为 **29 PASS / 0 FAIL / 0 SKIP**，`node scripts/generate.mjs --check` 回报119身份目录；只验证新增公共纯Node协议，不代表远端100条SDK、TypeScript或浏览器已运行。Github完整树 `truncated=false` 再次核对100份四件套。npm/corepack仍无法访问registry，Actions最近运行40428722496等显示失败，未得到可靠Runner构建日志；因而真实锁文件/tsc/build/SDK/Chromium仍BLOCKED或NOT_RUN，Issue #12仍开放；F06/F07 PDF.js冲突Issue #22尚未得到可执行验证。
- **后续**：公共离线readiness加入专属CI并产出独立artifact，跟踪剩余19条worker内容和合法依赖、PDF.js配对；有可执行pnpm10环境时优先生成真实锁文件并恢复frozen CI，执行受影响SDK与浏览器验收。未修改main、旧模板或PR #3；主PR #8保持Draft。

runCount：**6 / 24**。

## 平台持续开发第7轮（2026-10-27，北京时间）

- **EF 分组集成**：审查 #32 共 15 个变更路径，均在 E12/E16/E17/F05 条目和 EF 进度范围内；因为 PR 为 Draft，REST merge 405，采用精确原始 blob 安全双亲非强推合并 `55ee60f3967ba652d3d3f3399ed9111ee55394b6`。GitHub 随后确认 #32 为 merged。内容：assistant-ui 正确取消线程运行、Video.js Blob URL commit 后回收、原生与 MSE HLS 错误清理、SheetJS 三列表头/范围/公式/输入校验。Worker 报告独立 Node 输入规则测试 7 PASS，但**并非真实 SheetJS SDK 测试**。
- **新增公共代码**：`e7515a6` 补 C05/D02/D12/D14/D17 + E11/E12/E16/E17/E19/F05 共 11 个新增条目的运行时依赖（10 个）和开发依赖（3 个）。官方 SheetJS CE 0.20.3 指向 **https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz**，拒绝旧 npm registry `xlsx` 版本误映射；`package-source.mjs` 只生成严格受审查的可复制安装命令，`validate-dependencies.mjs` 使用同一个解析合同，DemoHost 展示准确来源。补包来源的纯 Node 定向测试与 TypeScript 声明文件。
- **FFmpeg 核心交付边界**：`18f57b6` 新增 `scripts/prepare-ffmpeg-core.mjs`。默认 `BLOCKED`，不下载、不再分发 GPL 单线程 core。完成许可、编解码器、NOTICE 人工审查后才允许设置 `LIBRARY_LAB_FFMPEG_CORE_LICENSE_REVIEWED=true`，校验实际安装的 0.12.10 版本/许可证后拷贝本站同源 JS/WASM，生成 SHA-256 证据清单；只移除自己标识的旧产物，手工文件禁止覆盖。E19 真正 Worker/WASM 运行、跨浏览器和许可均尚需独立验收。
- **根目录 Agent 索引纠偏**：`5673cb2` 同步此前两批实际合入的 CD 5 库和 EF 6 库到 `library-catalog.json` 和 `LIBRARY_CATALOG.md`。按最新实际条目元数据：**119 身份目录，111 内容及示例条目，333 个 basic/business/advanced 场景声明，8 条待接入**：C04、C08、C12、C13、C22、D13、D16、D21。场景数不是执行次数。
- **真实验证**：在本轮独立 Node 22.16.0 本地测试副本运行 `node --test tests/package-source.test.mjs tests/validate-dependencies.test.mjs tests/prepare-ffmpeg-core.test.mjs`，**12 PASS、0 FAIL、0 SKIP**。范围仅为供应链字符串合同、目录依赖声明检查和 FFmpeg 核心 staging 的 mock 文件边界；不是在完整最新仓库验证依赖安装，也不是 FFmpeg SDK 或 SheetJS SDK。新增全局 TypeScript 声明尚未执行全仓 `tsc`，不称 PASS。11 条定向 package 声明逐条核对和官方 tarball 特例匹配；F06/F07 pdfjs-dist 6.4.299/6.3.289 仍冲突 #22。
- **阻塞仍在**：本环境无法解析 npm 下载源、GitHub Actions 最近 run 40429548255 等执行在 runner 分配之前失败；真实 pnpm 锁文件、完整 TypeScript、Vite build、官方 SDK、Playwright 仍 **BLOCKED/NOT_RUN**，Issue #12 继续记录。不能手造锁文件或把静态校验当作生产通过。未修改 main、旧模板或 PR #3；主 PR #8 仍保持 Draft。

**下一批**：继续接入 CD 余下 8 条 worker PR，并同步公共包版本和根索引；优先由 EF 修复 PDF.js #22 且同时升级源码/文档/测试；完善 frame/SW 隔离；有真实 pnpm10+Node22.18 环境时生成冻结锁文件并实际执行构建、六风险切片与浏览器验证，逐条写证据。下一次从最新 GitHub HEAD 恢复并核对独立分组状态。**runCount: 7 / 24**。

## 平台持续开发第8轮（2026-10-27，北京时间）

**本轮实际合入两个独立质量修复 PR（不是单纯巡检）：**

- EF #34：检查15个变更文件只涉及 F06/F07 与 EF 自身进度，标记可审核后通过 GitHub 常规 merge 进入 feat/library-lab，merge `8c54208d61c01309af20d4edfbce01e3b026f2e1`。F06/F07 与 Library Lab 根依赖在源码声明上已统一 `pdfjs-dist@6.3.289`（匹配 react-pdf 11.0.0），F06 用 `createRenderGate()` 串行化共享 Canvas 上的 PDF.js RenderTask，防止取消后未结算的前次渲染撞上新渲染。三项纯 Node render-gate 单测通过。**Issue #22 只关闭了静态版本差异，不关闭真实 Worker/Chromium 验收。**
- AB #33：检查15个变更文件限于 AB 条目与进度，通过常规 merge `f052e8b478d604ccefb6cf8f3569b80055c68f2a`。针对 A09 Excalidraw、A10 tldraw、A17 deck.gl、B04 dotLottie、B05 Rive 完成异步结果失效、真实配额语义、GPU上下文释放、timer和播放错误/卸载清理。未声称SDK运行PASS。
- PLATFORM `a28ce7dff06f9ffef277da209ffe6c47b1710bbc`：新增 `catalog-search.tsx`，在中文IME候选词组合期间仅维护本地草稿，结束后180ms合并提交URL，保留原分类/筛选条件和浏览器深链接；新增 catalog-payload 合同，在客户端检验条目Schema、重复ID/slug、源码指纹、SDK/build/browser状态，损坏数据时 fail closed 并提供重试。
- 本批后续改进：进一步拒绝无匹配源指纹、实际命令、证据的伪PASS，并在取消后的异步JSON读取中检查 AbortSignal。新增离线测试7项和生产预览E2E草案（中文IME、分类URL保持、损坏目录恢复）。

**文件树确认**：通过 GitHub 不截断递归树检查，119个 `library.json`，111组 `guide.md/agent.md/verification.json`，按三层为333项场景**声明**，8条仍需内容完成：C04、C08、C12、C13、C22、D13、D16、D21。111是源代码和文档接入，不是111个SDK PASS。

**实际可重复证据与边界**：本地 Node 22.16.0 隔离文件执行 `node --test /mnt/data/platform-turn8/tests/catalog-payload.test.mjs /mnt/data/ef-wave9-test/render-gate.test.mjs` 得到 **10 PASS、0 FAIL、0 SKIP**（7个payload/查询纯逻辑 + 3个Canvas队列纯逻辑）；TAP摘要写入 `docs/library-lab/evidence/platform-turn8-offline.tap`。TypeScript `transpileModule` 对新搜索组件和E2E草案为0语法诊断，不等于完整 `tsc`。合并远端全部代码的 `pnpm install/typecheck/build/test:sdk/Chromium` 均仍 **BLOCKED或NOT_RUN**；E2E文件只提交未运行。
GitHub最新run 40432842277（主CI 7 job）与40432842202（Lab 2 job）全部 `runner_id=0, steps=[]`，属于分配Runner前失败，未产生测试日志；不能推断为代码执行失败，也不能声称根锁文件冻结。共享阻塞 #12 不重复触发同样的失败workflow。

**后续优先级**：审查CD余下8库PR、公共依赖后统一生成根索引；实际Node>=22.18/pnpm10可用时先生成真实锁文件并恢复frozen安装，再完成PDF Worker双库与AB异步生命周期浏览器回归、中文IME E2E；未取得执行环境仍继续公共安全与Agent可用性改进。保持 Draft PR #8，不改main/旧模板/PR #3。

runCount：**8 / 24**。

## 平台持续开发第9轮（2026-10-27，北京时间；GitHub 集成）

**实际集成及代码变更：**

- CD #35：常规 squash `43f06fee237f8666697279ea1a6b457b23ba1ab8`，6 个内容条目 C04、C08、C12、C13、C22、D13；50 个文件仅属 CD 条目和进度。
- AB #36：常规 squash `eae0b8eec2a0a3d3281170c6dcda3159f8d6945d`，B13/B14/B22 固定槽位跨越与键盘逻辑修复，纯 helper 回归由 worker 记录，不等于浏览器拖放验证。
- EF #38：常规 squash `f019c76c3b5923112bc1171d6d780b7b151da8f5`，F11 MSW 浏览器路由隔离、E19 FFmpeg 操作代次/输入预检、F05 SheetJS ZIP 预算预检；这些预检不能代替沙箱。
- AB #37：因与 #36 同写 progress/AB.md，平台以双亲 Git merge `aa67e9e19d3287644263926e97daeaaab98c96d8` 合入 30 个 A/B 所属文件，并保留双方进度：A13动画、A15/A16地图、B17中文IME、B20 toast 异步竞态修复。
- CD #39：因与 #35 同写 progress/CD.md，平台双亲 merge `fdb34344f848b994958ef00b386dfd0ef0e6991a` 保留两批进度，新增 D16 Workbox、D21 Pagefind 隔离 Node 构建工作坊。
- PLATFORM `731eda9e3b77ec2850db5cd30d4fe90f151db9ba`：单点增补 9 个真实浏览器库依赖和 Workbox/Pagefind 两项 dev 依赖，CLI 白名单扩展 D16/D21 各 3 种层级，增加不可注入路径/禁用 shell 的 Node 单测（新增测试**已提交，未在当前完整远端树执行**）。
- PLATFORM `1faca0c9b6b80d9887693ac9191990248a85d73d`：重建根目录双索引，与8个新条目 contentState 和用途一致，未将已编写内容等同于SDK验收。

**只读 Git Tree 独立核验：**集成分支完整递归树 `truncated=false`，119 个唯一 ID 目录，A17/B22/C22/D21/E19/F18；每个目录具有 `library.json/guide.md/agent.md/AGENTS.md/verification.json` 和示例源文件。与此对应 **119/119 内容源码与文档已接入、357项三层场景声明、0项本轮新增真实SDK PASS**。文件存在性检查不是 TypeScript、运行时 API、浏览器或教学质量验收。

**本轮执行证据边界：**GitHub PR #35/#36/#37/#38/#39 变更范围已逐文件审查；部分 worker 先前报告纯 Node 回归和静态语法，但本平台未复跑完整代码。版本交叉核对包括 FullCalendar v7 的 `@fullcalendar/react/daygrid` 新路径与 `temporal-polyfill` peer，AG Grid Community 36.2.0、JSON Forms 3.8.0、Frappe Gantt 1.2.2、react-redux 9.3.0、Workbox 7.4.1、Pagefind 1.5.2（来源见PR提交及 npm/官方文档）。**未执行真实包安装、tsc、Vite build、SDK导入或Chromium。** 最近 GitHub Lab workflow `40435506801` 两个作业 `runner_id=0,steps=[]`，在Runner分配前失败；并非运行过构建后失败。受限网络无完整registry依赖；根 `pnpm-lock.yaml` 尚未真实解析，不能造 integrity。维持 #12 阻塞。

**下轮：**一旦 Node>=22.18/pnpm10 与网络或Runner恢复，真实生成lock并保留 `--frozen-lockfile`，对全部导入条目先做分组型检查与构建；重点测试 C13 Frappe 文档级监听器风险、F06/F07 PDF Worker、F11 MSW origin、D16 SW 构建及 D21 Pagefind 原生索引，处理真实失败。仅因缺安装而重复跑相同失败不计进度；可以继续补隔离runner、文档质量和Agent迁移测试。

runCount：**9 / 24**。PR #8 继续 Draft；main/旧模板/PR #3 未修改，未公开部署。

## 集成增量：AB/CD/EF 条目加固与两级目录加载（2026-10-27）

- AB PR [#41](https://github.com/CoderLambert/ReactLoom/pull/41) 经逐文件范围审查后 squash 合入 `98e0f9d9b20a372bfd52616c0573cb4218b0da03`：A01 ECharts 后台暂停与减动策略、A06 React Flow 有向无环连接守卫与删除关联边、B18 cmdk 中文 IME 尾随 Enter 防误触。worker 声明的 19 项 Node 纯函数测试不能算 ECharts/React Flow/cmdk 真实浏览器通过。
- CD PR [#42](https://github.com/CoderLambert/ReactLoom/pull/42) squash 合入 `74100474aae54166dae9e8ce0620c20b7d2e2cae`：C01 RSS URL 规范化/草稿变化取消旧提交，D03 p-limit 真实 SDK 定向测试源，D07 TanStack Query 租户切换异步结果所有权；未运行完整官方 SDK 验证。
- EF PR [#43](https://github.com/CoderLambert/ReactLoom/pull/43) squash 合入 `1fe213f97464a9eff2c4036f093d7a736e23b651`：F03 CSV 严格表头/非法列/公式防护与真实 Papa Parse 解析路径、F04 ExcelJS 行规则和安全合计；新增 Node 契约单测，不代表 ExcelJS 生产 I/O 已验收。
- 平台提交 `1231d040048e00417490588b9da4f6dcc24c1b5e`：生成轻量首页 `catalog-index.json`、按库 `raw/<ID>/detail.json`，保留原 `catalog.json` 兼容离线流程；提供纯逻辑校验、源码指纹和路由一致性校验。
- 平台提交 `1c5b0b359110c32fa5d6603a32a4925f21d26f2a`：首页只请求精简索引，进入详情才读取该库完整元数据；导航 abort 陈旧 fetch，详情失败支持重试，Playwright 增加首页不拉取119份详情的回归用例（**尚未运行浏览器**）。
- 后续平台纠偏：详情 Effect 依赖改为完整稳定的 `summary,key,entryId,attempt`；README 更新真实结构、未完成项和查看约束。

**本轮实测边界**：在隔离的**旧版119条目录小型副本** `/mnt/data/library-lab-integration-8/testapp` 执行 `node --test tests/catalog-index.test.mjs tests/generate.test.mjs tests/catalog.test.mjs` → **26 PASS、0 FAIL、0 SKIP**；该副本不是 GitHub 最新完整代码，也不包含其所有SDK示例，因此仅证明本次目录协议、生成器、输入检查的离线纯逻辑。旧副本 `node scripts/generate.mjs --check` → 119 entries、6 loaders；这里的6 loaders**不代表集成分支真实Demo数量**。当前完整 GitHub tree（truncated=false）列出 119 library.json、119份四件套目录文件，集成分支延续 **357个场景声明**；0个SDK/浏览器PASS由本次任务新增。

**CI 证据**：当前 head `1c5b0b359110c32fa5d6603a32a4925f21d26f2a` 的 [主 CI 40446175862](https://github.com/CoderLambert/ReactLoom/actions/runs/40446175862) 七个 job 和 [Library Lab CI 40446175858](https://github.com/CoderLambert/ReactLoom/actions/runs/40446175858) 两个 job 均 `runner_id=0,steps=[]`，未启动任何测试命令。原因尚未证实，不归咎于代码或账单。宿主无法解析 npm registry，根 `pnpm-lock.yaml` 不生成伪造 integrity。真实依赖安装、TS7 typecheck、Vite 构建、SDK/Worker/PDF/MSW 和 Chromium E2E 继续 **BLOCKED／NOT_RUN**。

**下一批**：有可用 Node >=22.18 / pnpm10 registry 或 CI runner 时先真实解析 lock 并恢复 frozen，之后以实际构建错误为依据修复未验证的 API/peer 版本；聚焦六大高风险条目、C13 全局监听、F06/F07 PDF Worker、F11 MSW origin 与 D16 Workbox。页面新型拆包路径增加生产预览验证，不以离线测试替代网络和构建。主 PR #8 保持 Draft，main/旧模板/PR #3 未改。



## 公共平台持续开发第10轮（2026-10-27，北京时间）

**实际集成：**将 A/B PR #44 squash 合入（`c44a18ebdff45ff579c52630dccc265f6caef14c`），C/D PR #45 squash 合入（`811eb894747f37764a34edc5ed2a0588985c42ae`），E/F PR #46 squash 合入（`448420fd788d309a0b389f6d80346153ee6478aa`）。分别审查过变更文件范围（AB 24、CD 22、EF 23），均只修改受授权条目和各自进度文件；非公共依赖/锁文件。首批改善 uPlot X轴自动范围/减少动态、G6 viewport/observer、AntD 撤销原子性、Embla稳定ID；CD分页和IME、可复现503 fixture、Zustand严格旧数据迁移；EF Monaco Worker租约、pdf-lib异步操作门禁、MSW精确 scope 与实际 fetch 拦截守卫。MSW需要独立iframe runner，故本轮仍**不称浏览器验收**。

**公共平台实质修复：**提交 `8ab32f97eff0b27c4fbdac9bc7630c01b3600f5c` 将 `test:sdk` 候选套件限定为显式 `sdk.test.mjs` / `node-scenarios.test.mjs`，不再把 `page-policy.test.mjs` 等纯逻辑回归当作真实 SDK 执行。新增 `scripts/policy-runner.mjs` / `tests/policy-runner.test.mjs`、`test:policy` 命令、缺少目标测试时明确失败，保留按 entry/group 选择。仅套件名称本身也不能证明内部导入，真实 PASS 需实际 SDK 和日志。

**准确实测范围：**本地 Node 22.16.0 独立材料重新执行了 A/B 四份纯策略测试 `--experimental-strip-types --test`：**16 PASS、0 FAIL**；本地隔离平台策略/SDK 发现器类比代码：**5 PASS、0 FAIL**。这些证据只覆盖纯函数与测试选择器模拟，不代表完整远端HEAD的 `npm test` 或任何目标SDK；已对 GitHub 提交代码的正则和语法作静态复核。实际依赖安装、生成合法 pnpm-lock、TypeScript、Vite、全部真实SDK和 Chromium：**BLOCKED/NOT_RUN**。GitHub Actions依旧在Runner前失败，继续单点追踪#12，勿无限重试同一已知失败。

**目录不变：**119条身份/源码/guide/agent/验证记录与357场景配置声明；零个SDK可因本轮纯Node PASS自动改成PASS。可执行的异步网络/Worker/Canvas/浏览器证据仍待环境恢复。主PR #8继续Draft；未改main、PR #3或原模板。**runCount 10/24**。下一轮优先获取真正pnpm解析/锁文件与运行证据，并补独立MSW iframe及PDF/Monaco/图表浏览器对照；在执行环境仍受限时继续非依赖型平台改进。

**本轮同一批后续CI接线：** `dd6ef7e734c2ee31e4df038387ecd230675e9e3a` 在无安装的 `catalogue` job 加入 `node scripts/policy-runner.mjs`，将纯逻辑回归与需要真实包安装的 `runtime-bootstrap/test:sdk` 严格隔离。GitHub Runner 尚未执行这个新步骤，状态 NOT_RUN，不能将接线视为 CI PASS。


## 平台第10轮同批集成与可执行验收通道（2026-10-27）

**本轮实质提交/合并：**分别读取并审查 AB #47、CD #48、EF #49 的所有修改文件与关键风险 diff，确认各自仅写入授权条目及自己的进度。三个 Draft PR 在保留主 #8 Draft 的前提下转为 Ready，使用 GitHub 官方 squash merge 与 expected-head SHA 门禁：
- [#47](https://github.com/CoderLambert/ReactLoom/pull/47) → `5c88c50f2bcf6afaa33db0fc0c75201eba577b03`：MUI/Mantine 编辑状态与撤销原子化，D3 筛选共源/尺寸钳制，Konva Stage 窄屏和节点容量限制。
- [#48](https://github.com/CoderLambert/ReactLoom/pull/48) → `9f3b363fc90b62921ac698e36fdbacae1facb802`：RTK Query 租户缓存呈现与Mutation取消，Dexie完整字段回滚比对，Comlink Worker终止/错误处理。
- [#49](https://github.com/CoderLambert/ReactLoom/pull/49) → `00ddd37d583a6fb2114e196c5eb9c927a1239dd9`：react-markdown 外链与资源限制、DOMPurify固定标签/属性表、FFmpeg 初始化/切场景清理、react-dropzone 8KiB 有界预览。未引入新依赖声明，119条目录和357个三层**配置声明**不变。

**公共平台直接开发：**提交 `73b5b60e702bb89b87c9d681c09315f2bca42d84`，新增 `scripts/local-verify.mjs`、五项参数/门禁测试及根 `verify:library`、包 `verify:local` 命令。默认只打印计划，只有显式 `--execute` 才执行；仅集成分支且锁文件干净时可 `--resolve-lock` 使用真实pnpm生成锁文件，再强制冻结安装；后续顺序为目录、纯逻辑、typecheck、build，可显式追加单库SDK/Chromium。所有shell关闭、可执行命令固定，不接受用户命令路径；保留每步骤日志和 SHA/工具版本/锁摘要于未跟踪的本地证据目录，遇首个失败立即停止，杜绝一串假PASS。
同一批后续安全修复对 `safeLink` 与本地文档 HTTPS 链接禁止 userinfo 和无效片段，增加对应回归，避免研究引用携带凭据的误导性站点。

**本轮真实测试：**在 Node 22.16.0 隔离原型运行 `node --test /mnt/data/local-verification/tests/local-verify.test.mjs`，**5 PASS/0 FAIL/0 SKIP**，测试范围仅 CLI 参数解析及步骤选择；安全URL回归源码已提交，未在完整远端 HEAD 运行；当前 Node 低于验证脚本 `--execute` 的最低22.18；项目真实pnpm10和依赖仍无法从 registry 安装。未执行真实锁解析、frozen安装、TypeScript、Vite、第三方SDK或 Chromium，全部依旧 BLOCKED/NOT_RUN，既有 Issue #12 继续单点跟踪。CI run `40452198662` catalogue/runtime-bootstrap 两作业均失败且没有steps日志，无法认定任何测试曾执行。条目自身 verification.json 未擅自标 PASS。

**后续优先：**有授权的 Node≥22.18/pnpm10 且registry可达的工作树时，执行 `pnpm verify:library --execute --resolve-lock`，审查与提交真实锁并修改 CI 为 `--frozen-lockfile`；之后针对 PDF.js Worker配对、MSW隔离origin、Monaco、FFmpeg、C13 Frappe Gantt监听生命周期、Chromium无障碍逐项形成准确证据。无法安装时继续独立公共协议与定向测试，不循环尝试相同DNS/Runner失败。**runCount仍记录10/24，本子批属于同轮续作**。主 #8 Draft、main/PR #3/三个模板均未触及。


## PLATFORM 第11轮：三组质量 PR 集成 + 源码同源/生产烟测修复（2026-10-27）

**实际集成操作**：先在 GitHub 读取 COORDINATION/IMPLEMENTATION/根与本包 AGENTS、本进度、Issue #4/#5/#6/#7、开放 PR 和 CI；复查 PR 当前 head、base 和逐文件变更范围，确认新增均只落在各 worker 的 entries 与专属进度文件，没有公共 package/lock/CI 变更。三个 PR 原为 Draft，仅 worker PR 转 Ready；保持最终 #8 Draft。GitHub 使用 `expected_head_sha` + squash merge，未 force/未合 main：

- [AB #50](https://github.com/CoderLambert/ReactLoom/pull/50) `8c0f97e2c44e10c356355bffa60fed0bfc3d4637` → 集成提交 `28356257852edaec18ae1a0034d3332b45f2b267`；25项改动仅 A12/B02/B03/B09 和 AB.md：react-konva 宿主窄屏/拖拽世界坐标、GSAP 后台暂停与减少动态、react-spring 焦点/有界列表、shadcn 状态代次与定时器。
- [CD #51](https://github.com/CoderLambert/ReactLoom/pull/51) `c442ded0306d7a874920680d8b76b3499f2374bc` → `013c70a3966c32e26646aecf0f4f02794a278845`；22项改动仅 D16/D17/D21 和 CD.md：Workbox 公共匿名 GET 精确路径、Yjs 文档/租户 envelope 与乱序重放、Pagefind 明确公开分级与 HTML 转义。
- [EF #52](https://github.com/CoderLambert/ReactLoom/pull/52) `f0a21656aa6a5d4cdb77d37e6d44f8cbd9ca96a7` → `a63ecb0708211d1779d8e233030c5ecd041c9885`；仅 E07/E08/E09/F12 和 EF.md：remark AST 有界审计、rehype 严格白名单、Shiki 场景重置与 Vitest 异步取消所有权。所有变更属于示例源码和对应文档、entry-local测试；没有新全局依赖需求。

**PLATFORM 直接写代码并推送**：

- `15ef29936345b866e036c3ac9c0d33dc50d24cdb`：修复 E2E 仍拦截已废弃 `catalog.json` 的假阳性；现在拦截真实首页 `catalog-index.json`，断言错误可恢复、仅两次索引请求、没有旧目录下载，并增加单库 `detail.json` 损坏后的隔离和重试回归。
- `41484f31699daf1b0febde8a7ee67c23f1d5f76b`：修复 SourceViewer 在选择另一个文件后、Effect 更新状态前可能短暂展示并复制上一个文件却标注为新文件 SHA 的竞态。显示和复制都绑定 `entryId/path/sha256`，复制只允许当前文件 **实际 SHA 校验成功**；浏览器缺 WebCrypto 则仅能手动查看而不冒称已核验。
- `91870744d18c3ec8d2597e29bfb89b67aad43e11`：新增生产预览源码请求拦截测试，控制第二文件请求，确保切换期间旧源码/校验标记不可见，篡改内容会被拒绝且复制按钮仍禁用。
- `3d1fa6d60e1ca169e53520783c590672be85e4e2`：修复 `React.lazy` 失败重试仍复用已拒绝 Promise 的问题；显式重试会重新建立 lazy 组件和 ErrorBoundary，而非只复位错误外壳。
- `f2c8cae0bbb0d9951a0768aac0a3b9538d2ec2fe`：新增 clsx 真组件在重置、停止卸载、重新启动时丢弃旧状态的浏览器回归案例。

**实际执行及证据状态**：

- PASS：三个 PR 的 GitHub squash merge 成功；PR #50/#51/#52 关闭且 merged，#8 仍 open/draft。GitHub 当前分支的修改文件和源代码已回读。worker 在各自独立材料环境报告 AB 16、CD 9、EF 9 项纯策略 Node PASS；这些不是 PLATFORM 在本轮完整 HEAD 复跑的测试，**不增加任何 SDK PASS**。
- NOT_RUN：本轮新增 Playwright case 尚未执行；本轮平台未执行完整源码 `pnpm typecheck`、`pnpm build`、真实 SDK、MSW/iframe、Chromium 或 Preview。不能把已提交的回归源码当作通过。
- BLOCKED：本执行容器只有 Node `v22.16.0` 和 TypeScript `5.8.3`，无 pnpm、无本次私有仓库完整可执行工作树，不能执行要求 Node >=22.18 / pnpm10 的真实冻结安装/解析。根 `pnpm-lock.yaml` 未获得合法解析，未手工伪造。
- CI：最新 `f2c8cae0` 对应 [Library Lab 40462784376](https://github.com/CoderLambert/ReactLoom/actions/runs/40462784376) 两个 job 与 [CI 40462784369](https://github.com/CoderLambert/ReactLoom/actions/runs/40462784369) 七个 job 均 `conclusion=failure` 且 `steps=[]`，没有可信构建日志；不能断言具体失败原因或已测试过上述代码。

**当前维度**：119/119 目录，119/119 条目源码/指南/Agent/状态文件（文件覆盖，非质量验收），357种场景**配置声明**；原始研究资料117份+E11/F05按重建标记，资料审核数没有本轮新增证明；真实 SDK PASS 本轮新增 **0**。11个本轮加固条目不是新条目，故总目录和Demo场景声明数量不增加。

**下一批**：优先取得真实 Node>=22.18/pnpm10/registry 或可执行Runner，执行 `pnpm verify:library --execute --resolve-lock` 获得可信根锁、随后恢复 CI frozen 安装并跑定向构建/SDK/浏览器；处理真实失败后再建立 PDF.js、MSW iframe、Workbox SW、Monaco Worker 的隔离运行证据。若运行环境继续受限，优先对公共安全与生命周期产生可合并的增量，而不重复同一安装失败。**runCount 11/24**。main、PR #3、SPA/SSR/Mobile模板及生产公开部署均未改动。


## PLATFORM 第12轮：三组质量改进集成、共享宿主 capability 与 Worker 终态修复（2026-10-27）

**代码与合并证据**：按 COORDINATION/IMPLEMENTATION/根和包级 AGENTS、#4/#5/#6/#7、开放 PR 与 CI 恢复实际 GitHub HEAD，逐文件检查每个 worker PR 的 base/head 和所有路径所有权；三组均未写公共 src/scripts/package/锁/CI/生成索引，未提出新增 package 版本。仅将 worker PR 自 Draft 转为 Ready，保持对 main 的主 #8 为 Draft，并以 `expected_head_sha` 做 GitHub squash merge：

- [AB #53](https://github.com/CoderLambert/ReactLoom/pull/53) 头 `089d00c3bdf5214c5cc3a9b7434150d7db2bdb88`，25个授权路径，集成 `e7ef67f2b18d46fc182463eb89dde9d21f01199a`：A03 Chart.js 可见性采样与数据同源、A14 R3F 按需帧、B01 Motion 有界卡片/键盘焦点、B15 宽/窄布局独立维护。
- [CD #54](https://github.com/CoderLambert/ReactLoom/pull/54) 头 `0aa418fe90b3c89295984086aef52de87f4791bc`，19个授权路径，集成 `0efa843e84416f904bfecb47e95b39566f92f2a6`：C08 AG Grid 行 revision CAS、防过时快照覆盖；D04 p-queue 对运行和等待任务使用共享 AbortSignal，避免 `clear()` 遗留永不结算的 add Promise；C06 IMask 日历闰年边界。
- [EF #55](https://github.com/CoderLambert/ReactLoom/pull/55) 头 `9f4b4c8b31a0a661c1fa96475afe753c5642856f`，37个授权路径，集成 `144f3d330b704f91754b5f7a284f4a615e6f0f20`：Tiptap/BlockNote/Lexical/CodeMirror 6 的快照大小、结构、存储恢复及不同场景编辑器生命周期。第三方 Schema 和 UI 仍须实测。

**PLATFORM 实际代码提交**（全部写于 feat/library-lab 公共 owner 范围）：`f0b8c6da`、`45004740` 禁止在主 SPA React/Worker 组件直接使用 `network-interception` 或 `node-process`，仅对固定 Node-CI 显示可复制的 CLI 命令，保持 SW/不可信执行在隔离环境；`7a2b16b2` 修复 Worker 终态后仍处理消息、遗漏 `messageerror` 和资源处理器清理；`7fcf7781`、`1dc6a477` 规范日志控制符、Bidi 伪装和 4KiB 输出边界；`23320d93`、`64c41faa`、`dd0c79b9`、`2a1261da` 实现并接线最多40条日志但**始终保留末尾 result/error** 的同源策略与声明、回归测试。相关源码与 GitHub Blob SHA 已回读。

**实际执行结果（不要跨越证据范围）**：

- **PASS**：隔离环境复制 GitHub 当前字节的 `src/lib/worker-protocol.mjs`、`tests/worker-protocol.test.mjs`、`src/components/worker-host.tsx`，`git hash-object` 分别为 `fb9695f7833b3cf01e4a2cb293d91ac36471220e`、`660d37db07dc7bd4a39921eab688dc7954160686`、`992d6f4344928a299ed35ee395ebb82efa485f51`，与远端当前 blob 完全一致。执行 `node --test /mnt/data/library-verify/tests/worker-protocol.test.mjs`：**4 PASS / 0 FAIL / 0 SKIP**，涵盖 Worker 协议、旧消息拒绝、控制符/Bidi 和40项上限终态；全局 TS 5.8.3 `transpileModule` 对对应 WorkerHost TSX：**0 语法诊断**（不是完整 TypeScript typecheck）。另在 V8 对读取的 GitHub `catalog.mjs` / `demo-policy.mjs` 原始纯函数作10项直接执行断言：**10 PASS / 0 FAIL**，涵盖共享 origin 隔离、Node-CI、非法入口；它不是完整 `node --test` 也不是 SDK。
- **同批补验 PASS**：在同一隔离目录额外复制 GitHub 当前 `catalog.mjs`/`demo-policy.mjs`/`tests/demo-policy.test.mjs`，`git hash-object` 为 `7ea2c56632e69d9f02d35afce317fff8b5e3b4fa` / `400e8ca1a30c876d2125eeaae620f8e059d7ee8d` / `b0205c3015765e1c2b4ff519972e1a04b87c9832`，均与 GitHub blob 相同。执行 `node --test /mnt/data/library-verify/tests/demo-policy.test.mjs /mnt/data/library-verify/tests/worker-protocol.test.mjs`：**12 PASS / 0 FAIL / 0 SKIP**（8项capability纯政策 + 4项Worker纯协议），这仍不代表实际宿主浏览器执行或 SDK 验证。此前仅 V8 的10项断言被此更强的、精确提交字节Node定向测试补充，不计入SDK。
- **NOT_RUN**：本轮完整 HEAD 的 `pnpm test`、真实第三方 SDK、React/Worker 浏览器挂卸载、TypeScript 7 typecheck、Vite production build、Chromium E2E/Preview。本轮加入的政策 Node 测试文件并未在完整 pnpm 工作树执行；worker 自报纯策略测试不等于平台复跑或 SDK PASS。
- **BLOCKED**：本地 Node v22.16.0 低于执行器 Node>=22.18，缺 pnpm10 与真实可联网的完整工作树。GitHub 仓库 `pnpm-lock.yaml` 虽存在，**实际读取确认缺 `packages/library-lab:` importer**，不能称为已完成本包锁定，也不手造 integrity。PR #53/#54/#55 对应 Library Lab Actions `40466964978`/`40467062343`/`40468062129` 的 jobs 均 failure、`steps=null`（无作业步骤可核），真实原因仍在 #12 跟踪，未证明代码构建失败或成功。

**覆盖维度**：119/119 条目目录；119/119有示例源码、guide/agent/verification 文件，357个三层 **Demo 配置声明**；实际浏览器成功 Demo 与官方 SDK 实测 PASS 不能由上述数字推得，**本轮新 SDK PASS=0**；资料原包117份，E11/F05为重建材料，本轮没有增加可核对的来源审核数。未重新生成/伪造 pnpm 锁或 runtime 证据，也未更新 verification.json 为 PASS。

**下一批**：首先恢复符合 Node>=22.18 / pnpm10 / registry 的执行工作树或能实际分配 runner 的 CI；执行 `pnpm verify:library --execute --resolve-lock` 并审查真实 lock，再冻结安装、定向 SDK/TS/Vite/Chromium 测试，逐项修复实际失败。尤其对 Monaco Worker、MSW iframe/Service Worker 独立 origin、PDF.js Worker 版本配对、Workbox scope 和本批编辑器存储恢复/Canvas 焦点做目标 SDK/浏览器验收。在环境受阻期间可继续公共宿主的无副作用静态保护，避免重复刷 DNS 或冒称 SDK 验证。

**可持久复核的原始 Node TAP**：`docs/library-lab/evidence/platform-wave12-node.tap`（实际命令见上，SHA-256 `fa7a284ebc3e96bc825adc09bcd22633960007c9e10d00bf28c8c7fb42684e7c`，Git Blob `6fd7d506aad4c8671c916b17a6b697da0a95db08`）直接保存在本私有分支，供下次对照真实代码与命令；它**仅证明12项无第三方依赖政策/协议测试**。额外核查集成后 CI [Library Lab 40469860871](https://github.com/CoderLambert/ReactLoom/actions/runs/40469860871) 2 jobs、[主 CI 40469860873](https://github.com/CoderLambert/ReactLoom/actions/runs/40469860873) 7 jobs 全为 failure 且 `steps=null`，不能归类为构建测试 FAIL 的代码诊断；仍待 #12 处理。

**runCount 12/24**。#8 仍为 Draft、main / PR #3 / 模板与公开部署未动；三个本批 worker PR 均已合入，仅使用项目授权的集成分支。


## PLATFORM 第13轮：AB/CD 合入 + 生产源码索引/字节上界（2026-10-27）

**实际集成**：基于 feat/library-lab@9a5778a9 阅读 COORDINATION、IMPLEMENTATION、根/本包AGENTS、progress、Issue #4/#5/#6/#7、开放PR及CI。逐路径审核 ownership/head/base 与 patch 后，squash 合入 [AB #56](https://github.com/CoderLambert/ReactLoom/pull/56)，head f5e45366、23个A/B授权路径、集成提交 10669259；[CD #58](https://github.com/CoderLambert/ReactLoom/pull/58)，head 3b55ca41、39个C/D授权路径、集成提交 4c994169。修复覆盖 Mermaid异步串行与取消、deck.gl GPU尺寸、dotLottie减少动态、移动面板、日期时区DST输入消歧、decimal.js发票精度。AB/CD 自报纯策略测试不计入SDK。

**集成阻塞**：[EF #57](https://github.com/CoderLambert/ReactLoom/pull/57) 审查发现 F01与F08新增 tests/policy.test.mjs 引用了错误的 ../preview-policy.mjs、../report-policy.mjs，真实文件在 ../examples/，从仓库原路径运行将找不到模块。已留下明确PR review，**不合入**直至EF修正并在原始测试目录复跑。

**PLATFORM 直接开发**：
- 提交 cd65cbd5/e9e4733e/4d37c1c2：source-integrity.mjs + .d.mts + 6项Node回归，对元信息唯一路径、sourceFiles完整性、SHA256格式、2MB大小、UTF-8跨chunk、伪造内容长度/HTML/404/无效编码进行检验。
- 提交 b7c1c86e：SourceViewer使用完整索引校验与有界stream读取，不再不受控response.text()；只在实际字节和SHA256均匹配时允许核验/复制。
- 提交 add2c36a：两个生产预览Playwright case涵盖畸形索引及字节长度造假；**源码已提交但测试NOT_RUN**。

**实测边界**：Node v22.16.0隔离目录执行 node --test /mnt/data/library-lab-wave13/tests/source-integrity.test.mjs，**6 PASS / 0 FAIL / 0 SKIP**。精确参与测试的新源码/声明/测试 Git Blob SHA：5b76d9f55fddc44fd8f34eecb0419804ea07e520、e779cf0d5d996f6395c1c67ab3649187fd90b20b、8b412703df73ab151c765f2c8c40f23b9c4b0d1e，已核与远端一致；其依赖的safeRelativePath在本地为从远端catalog.mjs复制的函数，**不等于完整仓库测试**。实际Playwright、TypeScript、生产构建、第三方SDK均 NOT_RUN/BLOCKED。

**CI**：2026-10-27最新 [Library Lab 40475998122](https://github.com/CoderLambert/ReactLoom/actions/runs/40475998122) 2jobs和 [主CI 40475998093](https://github.com/CoderLambert/ReactLoom/actions/runs/40475998093) 7jobs均failure且steps=null，没有可信测试步骤，不能据此给代码构建判FAIL。当前工作环境缺pnpm10、完整可联网仓库工作树且Node版本低于CLI执行最低22.18；根pnpm-lock.yaml仍未真实解析Library Lab importer。没有手造锁文件或伪造证据。本轮新增SDK PASS=0。

**覆盖维度**：119身份目录、119有源码/guide/agent/verification文件，357个**配置**场景；可浏览器运行的Demo数量与SDK真实PASS不能从此推断。原包117资料，E11/F05为重建，新增资料审核数无有效证据。下一批：先修复合入EF #57；争取真实pnpm锁/冻结安装，继而TS7、Vite、SDK及Worker/MSW/Monaco/PDF.js关键浏览器验证；继续独立平台工作，不重复无步骤CI。主 #8仍 Draft；main、PR #3、SPA/SSR/Mobile模板未动。**runCount 13/24**。


**同批补证（精确提交字节）**：原始Node TAP已提交 docs/library-lab/evidence/platform-wave13-node.tap，Git Blob 3cf55953073c6409dc1f9ce1e980426ff17843d8，实际容器日志SHA-256 b3ce3d5dc2a79b03701519fb774d32e3e99df24872810dd2d29cb139f17d2849，6 PASS/0 FAIL/0 SKIP。独立执行 tsc --noEmit --pretty false --lib es2022,dom --module nodenext --moduleResolution nodenext /mnt/data/library-lab-wave13/src/lib/source-integrity.d.mts：TS5.8.3声明语法PASS（不是全包类型检查）。本子批仍属于第13轮。

## PLATFORM 第14轮：四组PR集成及依赖合同修复（2026-10-27）

**实际集成（仅 feat/library-lab，不碰main）**：先读取最新COORDINATION/IMPLEMENTATION、根/包AGENTS、Issue #4/#5/#6/#7、进度、开放PR、diff和CI。严格检查worker所有权、base和expected head，合入：
- EF [#57](https://github.com/CoderLambert/ReactLoom/pull/57) 30路径（E17 HLS、E18 WaveSurfer、F01 Uppy、F08 React PDF），修复两处Node测试导入后，squash commit a329a46af03f24e25922a15b53df80728c8b606f。
- AB [#59](https://github.com/CoderLambert/ReactLoom/pull/59) 26路径（A02 Recharts、B10 Base UI、B11 Radix、B12 React Aria），squash commit e73374d56a45f1810cddff9b31f8c5b3c72304d8。
- CD [#60](https://github.com/CoderLambert/ReactLoom/pull/60) 28路径（C17/C18 i18next、D20 MiniSearch），squash commit 122f6dbc5f09864c1abc34ffc91d2674bc7ccc85。
- EF [#61](https://github.com/CoderLambert/ReactLoom/pull/61) 25路径（F13 Playwright、F14 Storybook、F17 axe-core）。GitHub常规squash返回405：与#57只冲突progress/EF.md。确认其他24个EF文件无交叉修改后，取其准确Git blob，保留#57进度再追加#61第17轮进度，创建双亲提交 b11fd218aa34ef5942660d246133b1a69bcb19e6（第二亲为#61 head 20654c8ecf0062e128b252affda7d1e23cdb6be3），以非force fast-forward更新集成分支。GitHub已确认#61 merged/closed。无覆盖、未改其它worker文件。

**PLATFORM源码提交**：逐一读取119个library.json，将每条packages/版本与公共package.json核对，仅缺4项：E03 lexical@0.52.0、@lexical/react@0.52.0，F01 @uppy/core@6.1.0，F17 axe-core@4.14.0。已据npm发布信息与官方使用文档核对版本及许可（Lexical MIT、Uppy MIT、axe MPL-2.0），静态核验React19与Lexical React18+边界；真实peer安装仍待pnpm解析。统一加入package依赖，并将已存在的6项source-integrity Node回归接入默认test：commit 2286f37fc5c94ba21bc9e4fa99b8d1161bd40917。补真实E03/F01/F17 manifest/包声明定向回归：commit 81ec09ac04a05b6bb8264292e07f9359c2a58365。参考 https://uppy.io/docs/uppy/、https://www.npmjs.com/package/@uppy/core、https://www.npmjs.com/package/@lexical/react、https://www.npmjs.com/package/axe-core。这不是包实际安装或SDK实测。

**实际执行/证据界限**：
- PASS：GitHub四个worker PR成功合入或双亲保真合入；PR #8仍open/Draft；119条manifest静态差异完成、上述4项依赖声明已在远端补齐。纯静态比对不能算Node PASS。
- NOT_RUN：本轮完整集成分支Node tests、新增声明回归、实际SDK import、TypeScript typecheck、Vite build、Chromium、Storybook play/axe DOM、HLS/PDF/Worker/SW。Worker独立声称EF #57 9个和#61 4个Node纯策略通过，非本平台在该HEAD运行，绝非SDK通过。verification.json不升PASS。
- BLOCKED：执行机 node --version = v22.16.0，未安装pnpm；registry.npmjs.org DNS不可达，也没有可运行完整私有repo工作树。不能执行pnpm10合法解析/冻结安装，未生成根pnpm-lock importer，未伪造。GitHub当前HEAD 81ec09ac04a05b6bb8264292e07f9359c2a58365 的 [Library Lab #40484809233](https://github.com/CoderLambert/ReactLoom/actions/runs/40484809233) 2 job及 [主CI #40484809244](https://github.com/CoderLambert/ReactLoom/actions/runs/40484809244) 7 job均failure且steps=null，表明没有可信步骤日志，不能据此推断构建代码FAIL。
- 维度：119/119身份目录、119份源码/guide/agent/verification文件、357个三层Demo配置声明；本轮新增实际SDK PASS=0，真实可运行Demo与原始117资料审核数不从静态覆盖推导，E11/F05仍为重建。

**下一批**：有Node>=22.18/pnpm10/registry/Runner时先 pnpm verify:library --execute --resolve-lock，审查真实lock恢复frozen，再逐项执行catalog、Node政策回归、E03/F01/F17 SDK、tsc/Vite、Chromium及F06/F07 PDF Worker、E05 Monaco、F11 MSW、D16 Workbox SW隔离；无安装环境不重复伪运行，继续公共协议可独立代码修复。主PR#8继续Draft，不改main、PR#3、模板、生产或公网部署。

runCount: **14/24**。本轮依赖/测试阶段最新提交 81ec09ac04a05b6bb8264292e07f9359c2a58365；progress自身提交见本次GitHub历史。

## PLATFORM 第15轮：三组质量 PR 合入、CLI 白名单修复与条目级增量策略 CI（2026-10-27）

**先读与隔离确认：**恢复最新集成分支的 COORDINATION/IMPLEMENTATION、根和包级 AGENTS、本进度、Issue #4/#5/#6/#7、PR #8、开放 PR 与最近 Actions。三个 worker PR 均以 `feat/library-lab` 为 base，审核所有变更路径（CD 27 / AB 23 / EF 25）严格仅位于各自 A+B/C+D/E+F 条目与独立 progress，没有公共依赖、锁文件、CI 或跨组写入。核对合并时的准确 HEAD，转 Ready 的仅为本批 worker PR；最终主 PR #8 继续 Draft。GitHub 用 expected_head_sha + squash 合并（无 force、不合 main）：

- [CD #62](https://github.com/CoderLambert/ReactLoom/pull/62) head `e7371a869d8be86a4911024f6c3e5a2e3c3c32d2` → 合入 `33cfc9ecc2de9b94bc2840bd581c9faadc548151`：D06 Immer inverse patch 的同步所有权、C13 Frappe Gantt DAG 拓扑环检测、C12 FullCalendar 显式 offset/DST 与单调事件 ID；C13 全局监听器浏览器卸载风险仍未验证。
- [AB #63](https://github.com/CoderLambert/ReactLoom/pull/63) head `9cc7e85f8ae24993533894fe758897d157bf820c` → 合入 `699deb5b8982907ddaa6c92d6ced153df2516cbb`：A13 Three.js 停止闲置 GPU 循环、A15 Leaflet marker 与选中状态同步、B13 dnd-kit 固定项重排边界、B14 原生拖拽手柄隔离。
- [EF #64](https://github.com/CoderLambert/ReactLoom/pull/64) head `152ef44dc95bd69d1e266249af0cfe604e3ed33b` → 合入 `e201fa54e3bd9c2a387d45e97208f9cb2516f3e0`：F15 Knip 结构化 JSON/CLI 状态验证、F16 dependency-cruiser 双报告器校验、F18 visualizer 清理旧产物并要求真正分包。三者新增的是**可执行校验源码**，此平台运行中尚未执行实际第三方 CLI。

**PLATFORM 本轮实际代码（仅公共 owner）：**

- `2c5b05de01e692d478df664e624e7b15562e9956` + `24c1c8b579bd4f893764e5134b007ae44db886d7`：修复公共 CLI 注册表**实际只有4项而已提交测试预期6项**的可复现缺陷，补 D16 Workbox、D21 Pagefind 与新 F15 Knip，形成 D16/D21/F04/F10/F15/F16/F18 **7条固定 CLI 配方**及注入/无 shell 断言；无任意路径执行入口，不自动执行 SDK 或 SW 注册。
- `456a46a221960709bd2991e13dd2257689b83eb5` + `f2e0bde4378b934b8a5122946ab3355e279a69ee`：新增 Git diff SHA 驱动的纯策略测试选择器：条目源、manifest、tests 改动选对应条目；公共平台 src/scripts/tests/package/lock/CI 改动覆盖全部纯策略；指南/Agent/进度文案不重复跑119库。无可用 diff 则保守回退全部策略；无匹配政策 suite 只报 SKIP，**不生成 SDK PASS**；新增三项边界测试。
- `cdf17dcbb391a1fa9ff2fe1eab865e62358dd795`：Library Lab catalogue CI checkout `fetch-depth: 0` 并对比 PR base / push before SHA，先保留默认 Node 平台目录/依赖测试，再运行按变更范围选取的条目**政策**用例；不删除根 CI、不将旧 bootstrap 当最终锁验收。
- `75988b5f94ffc5e10caa04b7afb369b45ba2165a`：更新 README 的七项实际 CLI 复现和变更路径增量门禁说明。原始离线 Node TAP 由 `3f5d500d27d0d8c691e17f222035264b97e86027` 保存至 [platform-wave15-node.tap](../evidence/platform-wave15-node.tap)。

**本轮已执行（精确范围/命令/原始证据）：**

- PASS：从 GitHub 拉取运行文件的精确文本到隔离目录 `/mnt/data/reactloom-exact/packages/library-lab`，以 `git hash-object` 对比五份 GitHub blob：CLI源码 `ddf011a0c8154a0d800ea001f487809bb25f0b95` / CLI测试 `456597ebf384ed4ade09191f4e1c10b29d31fcb1` / SDK筛选器 `068c1f32c89ef436bce57543dc895668789083db` / 政策runner `8024ebb324e7449f825176018b50054bc0003a2e` / 政策测试 `244f47bfdf6ae6697328d04d5eaf8f94d112b4f5`，全部一致。
- `node --test tests/cli-runner.test.mjs`：**7 PASS / 0 FAIL / 0 SKIP**，验证7个配方、固定路径、无 shell、伪造路径拒绝；TAP SHA-256 `80444552d858e0be514321fc9039501aad8927ac45cc98b85654e3ad8bf9d01b`。
- `node --test tests/policy-runner.test.mjs`：**6 PASS / 0 FAIL / 0 SKIP**，验证SDK与政策分离、单库选择、跨库互不干扰、docs-only SKIP、公共平台变更全策略回退；TAP SHA-256 `10d1992cf9e6ec5c48df55b0bf8ea6f4a6cbdd4c69f7d9a9a2a341f8e4c9328a`。
- 隔离**合成 Git fixture**：两库 A04/C07 都有策略测试，只提交 A04 源文件改变；`node scripts/policy-runner.mjs --changed-base=08db4c638b87a430b3b1e50bb42d68240de4516d` → `affected IDs: A04`、仅1条政策测试 **PASS**，退出码0，输出 SHA-256 `78a6c49b54d71a3c4251f57d548058b09b343725914bd394013de1368263a73e`。它证明 exact policy runner CLI diff+spawn 接线，但**不表示在完整ReactLoom树执行**。
- 运行 Node `v22.16.0`，低于项目声明 Node≥22.18，本轮这13项仅为脱离SDK依赖的 Node 平台逻辑，不等于第三方SDK/构建/浏览器通过。
- NOT_RUN：本轮完整集成HEAD的全部 `pnpm test`、`pnpm test:sdk`、`pnpm typecheck`、`pnpm build`、Chromium E2E、Worker/SW/iframe、F15/F16/F18真实 CLI、GitHub CI的真实 shell 步骤。
- BLOCKED：仍无完整可联网 pnpm10 + Node≥22.18 工作树；根 `pnpm-lock.yaml` 缺本包合法解析 importer，未伪造 integrity；CI 最近已审查的 Library Lab run [40485132126](https://github.com/CoderLambert/ReactLoom/actions/runs/40485132126) 与主 CI [40485132162](https://github.com/CoderLambert/ReactLoom/actions/runs/40485132162) 所有作业状态 failure，但查询 catalogue/bootstrap job steps 返回 `[]`，**无构建命令结果**；不能归因为 TypeScript/SDK 代码失败。后续最新 run 仍须检查。
- dependencyRequests：这三组 PR 没有新增公共 package；既有 Knip/depcruise/visualizer/Workbox/Pagefind 的准确 peer/许可/实际安装仍待真实锁与 Node 环境。此次没有升级SDK验证状态或伪造浏览器/第三方工具结果。

**覆盖口径**：沿用上一轮已核对的 A–F 119 身份目录及119份源码/指南/Agent/verification文件，**357个三层配置场景声明，不代表357个已在浏览器成功的Demo**。本批改进均为已有条目，新增目录0；原研究117份，E11/F05以重建资料处理，未新增可确认原件审计数量。本轮新增真实 SDK PASS = **0**；真实成功Demo数量和SDK总PASS不得由目录数推断。

**下批**：优先可用 Node≥22.18/pnpm10/registry 或实际执行的 Actions Runner，运行 `pnpm verify:library --execute --resolve-lock` 真实解析锁文件，再恢复 `--frozen-lockfile`，随后按失败依据修复 TypeScript/Vite并对 D03/F15/F16/F18、E05 Monaco Worker、F06/F07 PDF.js、F11 MSW和D16 Workbox隔离做真实 SDK/浏览器验收；先解决完整运行环境，不重复调用已知无 steps 的CI。保持 Draft 主 PR #8，main/PR #3/模板未改，不公开部署或调用付费API。

**runCount: 15/24**。

**同轮最新 CI 复核（不增加 runCount）**：集成分支提交 `65d4ab98734f78973f739e7402a8f58b25c5ff59` 对应最新 [Library Lab #40492117107](https://github.com/CoderLambert/ReactLoom/actions/runs/40492117107) 两个 job 和 [主 CI #40492117198](https://github.com/CoderLambert/ReactLoom/actions/runs/40492117198) 七个 job 均 conclusion=failure。分别读取 Lab 的 runtime-bootstrap job `122148359095` 和 catalogue job `122148359471`，`fetch_workflow_job_steps` 返回空数组 `[]`，因此仍**没有任何真实构建/SDK/类型/浏览器执行步骤记录**，本轮隔离 Node TAP 是唯一新平台运行证据；不能将本次 CI 失败归因于代码错误。主 PR #8 状态已回读为 open/draft、base=main，未合并。\n

## PLATFORM 第16轮：三组图片/Schema/白板质量 PR 集成；历史 FAIL 证据失效修复（2026-10-27）

**恢复事实源与边界：**在集成 HEAD `caef398bfa3568b1e9bf690366b39ae5448769de` 回读 COORDINATION、IMPLEMENTATION、根/包 AGENTS、本进度、Issue #4/#5/#6/#7、开放 PR 与 GitHub Actions。PR #8 保持 open/Draft，base=main；不合 main、不触碰 PR #3、模板、收费 API 或公开部署。

**实际合入三个非重叠 Worker PR（合入前逐条核对 base、固定 head 和变更路径）：**

- [AB #65](https://github.com/CoderLambert/ReactLoom/pull/65) head `faed8c3ad1a3876104b23495198d3e0c4f6bddd7`，22 个合法 A/B + AB 进度路径，squash merge `de335dcf7b6b48dc5f81d974484e14e0c075b4b5`。A09 Excalidraw JSON/HTTPS/附件边界，A10 tldraw 快照与 Blob URL 清理，B05 Rive 停止不可见 GPU，B17 Floating UI 剪贴板 Promise/焦点及 IME。
- [CD #66](https://github.com/CoderLambert/ReactLoom/pull/66) head `473c811b35e3c1214dfe175da817e804440a4301`，28 个 C/D + CD 进度合法路径，squash merge `d5304fbb4f70b748f0615a0a9d2173844b095855`。C02 Zod/C03 Valibot/C05 Ajv 规范化 HTTPS feed、OPML/日期/去重语义与输入变更后的状态失效。
- [EF #67](https://github.com/CoderLambert/ReactLoom/pull/67) head `48f18fd42df61c3d2233fdc7e03cff31d85f3029`，26 个 E/F + EF 进度合法路径，squash merge `385c3399b25fd8905e9d00e30dc49f32b321410c`。E13 PhotoSwipe 当前图库作用域及销毁、E14 react-easy-crop 像素/内存边界与竞态隔离、E15 pica 取消令牌与单飞保护。三批均为已有库质量修复，未增加目录/配置场景；分组自报 Node 纯政策验证不能升格 SDK PASS。

**PLATFORM 直接开发与持久证据：**

- `45e236e4` + `b1e4f868`：`scripts/verification-contract.mjs` 过去仅在 PASS 失配时降级，旧源码上的失败仍可显示为当前 FAIL。现在对实际执行态 **PASS 与 FAIL** 都要求当前 `sourceFingerprint`、非空字符串 command/evidence，失配降为 `NOT_RUN` 并标 `STALE`；不把基础设施 `BLOCKED` 错判成已执行。
- `7d779186`：`tests/readiness.test.mjs` 增加旧失败过期、伪 evidence 对象/空字符串拒绝、正确 FAIL 保留的回归断言。这份整合级测试**已提交但完整工作树未执行**。
- 在 Node v22.16.0 **隔离目录**将新合同模块按 GitHub Blob 精确内容恢复，`git hash-object scripts/verification-contract.mjs` = `3d78edfbe27ebe2bfe5e9404e47961952393eb1d`，与远端 blob 一致；`node --check scripts/verification-contract.mjs` **PASS**；`node --test tests/verification-contract.test.mjs`（独立五项边界 fixture）**5 PASS / 0 FAIL / 0 SKIP**。这是合同源码的孤立逻辑验证，不是已提交 `tests/readiness.test.mjs` 全套运行，不含第三方 SDK 或浏览器。
- 原始测试输出已提交 `docs/library-lab/evidence/platform-wave16-node.tap`（本地 TAP SHA-256 `5fd5d0910f6879cbf5cc455bb47b37b906ac61aae4a61956e5ac00576ab78e0a`）；证据文件提交 `de2e22dd12cc72b66689ce31f7956d15b57597d8`。这是**纯 Node 逻辑证据**，不计入运行 SDK 成功数。

**CI/安装核实：**集成初始 HEAD 的 [Library Lab #40492321294](https://github.com/CoderLambert/ReactLoom/actions/runs/40492321294) 两 job 与 [主 CI #40492321575](https://github.com/CoderLambert/ReactLoom/actions/runs/40492321575) 七 job 全 `failure`，返回 `steps=null`，不具备实际 typecheck/build/SDK/E2E 日志；在新提交产生可信 runner/步骤之前不可归因为代码编译错误。本环境 Node v22.16.0 低于声明的 >=22.18，pnpm 未安装且 Github/npm DNS 不可用，故根 `pnpm-lock.yaml` **仍缺真实 Lab importer 解析**，不得手造、不得改为假 frozen 成功。三个 worker PR 无新增公共依赖请求；已存在包的 peer/许可和锁仍待实际 registry 验证。

**严格计数**：沿用上轮实际目录核查，119 个身份库和 119 个源码/guide/agent/verification 文件包；357 为三层 **配置声明**，非浏览器运行成功数；新增真实 SDK PASS **0**，本轮实际成功浏览器 Demo **未测**，原始研究包117份、E11/F05仅重建，未新增可核对资料审核数。所有受影响的第三方 SDK 实测/tsc/Vite/Chromium **NOT_RUN**；真实锁解析 **BLOCKED**；没有根据纯政策验证修改 verification.json 为 PASS。

**下一批**：取得真实 Node>=22.18 + pnpm10 + registry/Runner 后，先用 `pnpm verify:library --execute --resolve-lock` 生成审查真实锁文件，恢复 `--frozen-lockfile`，运行 `tests/readiness.test.mjs`、完整 typecheck/Vite/受影响 SDK 和 production Chromium。重点验证 A09/A10/B05/B17、C02/C03/C05、E13/E14/E15 的异步清理，以及 E05 Monaco、F11 MSW、PDF Worker、D16 Workbox 的真实隔离。无此环境时继续推进可独立验证的公共功能而不刷无步骤 CI。

**runCount: 16/24**。此轮只有3个worker PR合并与实际公共代码改动；最终 [Draft #8](https://github.com/CoderLambert/ReactLoom/pull/8) 仍待用户真实生产验收。


### 第16轮后续开发：Markdown 2MB 有界流式读取（同轮，不增加 runCount）

- `c00e5bbaae8037119db59bc88eda8cdf7f4447ce`：公共 `src/lib/document-utils.mjs` 新增 `readLimitedMarkdownResponse`，拒绝非成功 HTTP、HTML fallback、缺失body与无效UTF-8；通过 `ReadableStream` 按**实际接收字节**实施 2,000,000 字节上限，异常取消 reader，按 chunk 解码多字节 UTF-8，而非信任 `Content-Length`。图文文档与运行示例继续只在自身 origin 读取。
- `7bc3a754bf8ac4bdd12adb4b56585411ba79d503`：文档 Tab 的 `src/components/document.tsx` 由不受界的 `response.text()` 改为公用有界解析；保留 AbortController、目录/链接安全过滤及原文复制，未改变用户数据或其他模板。
- `fa23769793ce6e98df1881aa9d715c4a6f065ece`：公共 `tests/document-utils.test.mjs` 增加分片中文/emoji、伪 Content-Length、超过上限时 Reader 取消、HTML/HTTP/坏UTF-8/null body 断言，并保留原4条URL与目录安全回归。
- **本轮精准实测：**Node `v22.16.0` 隔离目录，逐字节恢复 GitHub 新版 `document-utils.mjs`、`document-utils.test.mjs`；`git hash-object` 分别等于远端 blob `adfd6dcc0fd8dd9ed268f4e3e5e16f6948dbb15f` 与 `5a8e5dad89fe14d98406f0caeef8b835f1811100`。执行 `node --check src/lib/document-utils.mjs`、`node --check tests/document-utils.test.mjs` 通过；`node --test tests/document-utils.test.mjs`：**7 PASS / 0 FAIL / 0 SKIP**。原始 TAP SHA256 `b6dd7919dbb73f41cf5beed39a6d521711b8f970fcb537044c8e0c063acfed00`、Git blob `9af500d5c94a9f6276fc412ad6d9abb9fa661d71`，证据在 [platform-wave16-markdown.tap](../evidence/platform-wave16-markdown.tap)，已确认证据 Git Blob 与执行日志文件匹配。
- 这是**离线 Node 单元测试**，不是全量 React/TS 类型、Vite 构建、Chromium 或官方 SDK PASS；React 文档 Tab 的浏览器集成未执行。此前五项证据合同孤立测试另计 5 PASS，不与目标 SDK 或worker自报测试混合。本轮源代码、文档、验证记录均保持尚未运行状态；锁文件真实解析仍BLOCKED。


## PLATFORM 第17轮：三组质量PR集成与Markdown目录安全改造（2026-10-27）

**恢复与所有权：**直接从GitHub集成分支 e62650ad6d025963da9ede967125502502fd031f 读取 COORDINATION/IMPLEMENTATION、根及包AGENTS、PLATFORM、Issue #4/#5/#6/#7、开放PR与最新CI；未假定容器保留前轮代码。对3个Worker PR读取实际head、base、完整文件名及核心patch，逐文件确认仅在各自分组 entries 和progress目录，不含公共依赖、根锁、CI、模板。以expected_head_sha、squash顺序合入唯一私有集成分支，没有force或main合并：

- [AB #68](https://github.com/CoderLambert/ReactLoom/pull/68)：head 031bec686552b75f3744b2bc8f4a42893c845608，19个合法路径 → e1af5cee86e2f0e2899b6acff3495384dbba810f。ECharts尺寸合并/销毁，Floating UI剪贴板过期回调，B13/B14拖拽版本冲突。
- [CD #69](https://github.com/CoderLambert/ReactLoom/pull/69)：head c3f9df84e0ab58f72bdabafee39eb9db0265cc7f，28个合法路径 → 49efc2a97c45fdd77ac16dc70974a5ac187934cc。C04 JSON Forms条件schema、IME/422错误，C19 nuqs网址规范化，D14 XState机器内部REJECT验证。
- [EF #70](https://github.com/CoderLambert/ReactLoom/pull/70)：head f7a869ccaeb5df75f2dd1aab8e83b1ab6a7a7e5d，14个合法路径 → e1e2b91fea886c47fb7e56302cf21d6ac2d35f38。E05 Monaco初始化异常释放资源；F10 Orval固定项目真实CLI生成入口及有限输出/双次指纹策略。此批均是已有条目加固，Worker纯逻辑测试不能传递为平台SDK PASS，新增公共依赖请求0。

**PLATFORM公共源码真实提交：**

- 9a236171759ef7154f363020c29fa89bfca303e5：src/lib/document-utils.mjs 支持Setext一级/二级标题和正确源行锚点，避免带尾随代码的fence伪关闭；代码缩进/引用/列表不计入目录。文档相对链接BASE_URL仅接受站内规范路径，拒绝scheme-relative //host、..、重复斜线、query/hash污染。
- 58c4b86324618cc4adf7902f4cbe3e0d37531fd5：tests/document-utils.test.mjs添加三个独立回归，覆盖Setext重复标题、伪代码围栏、恶意base。
- eb0f266d8a00dbe99a5ae98db825fe0345ad461e：上传实际测试记录 [platform-wave17-markdown.tap](../evidence/platform-wave17-markdown.tap)。

**精确Node验证：**宿主Node v22.16.0（低于产品要求22.18），pnpm不存在，git ls-remote因github.com DNS失败。将新模块和测试逐字节恢复到隔离 /mnt/data/lab-exact：git hash-object源文件 a2975788dd16b16fef4208862564653d07b803d8、测试文件 4d3c82a5218cce54e285657a31e9559b6516e843，均与GitHub Blob完全相同；node --check src/lib/document-utils.mjs 及 tests/document-utils.test.mjs PASS；执行 cd /mnt/data/lab-exact && node --test tests/document-utils.test.mjs 得 **10 PASS / 0 FAIL / 0 SKIP**，原始TAP已提交。另运行独立原型4 PASS但不与精确Blob结果相加。以上严格属于平台纯Node安全/目录逻辑，不是完整仓库依赖构建或SDK。

**CI与不可伪造的边界：**最新 [Library Lab 40506714819](https://github.com/CoderLambert/ReactLoom/actions/runs/40506714819) 2 job和 [主CI 40506714724](https://github.com/CoderLambert/ReactLoom/actions/runs/40506714724) 7 job全部failure，但runner_id=null且steps=[]，没有运行过的构建/SDK/类型步骤证据，原因保留#12。根pnpm-lock仍缺经npm registry真实解析的Lab importer（BLOCKED；不手造integrity）。完整pnpm test/catalog:check/typecheck/build、Worker/SW/iframe、MSW/PDF/Monaco/Orval真实SDK、Chromium生产preview与互动（NOT_RUN）。本轮worker新SDK测试源亦未执行。

**分开统计：**沿用此前核对的119个身份条目、119份源码/中文guide/agent/verification和357个basic/business/advanced配置声明；本批影响A01/B13/B14/B17、C04/C19/D14、E05/F10等9个现有条目，新增身份0。**本轮SDK真实运行PASS=0；浏览器Demo实际成功验证=0；117旧资料逐项审核数未复核，E11/F05原件缺失继续保留recreated口径。**这些静态数字不能当运行验收成果。

**下批：**在真实Node>=22.18、pnpm10和可用registry/Runner上生成审查root lock并恢复frozen；按需执行类型、Vite、目标SDK、生产Chromium，重点验证A01/B13/B14/B17、C04/D14、E05 Worker/F10 Orval以及F11 MSW、PDF Worker、D16 SW origin。运行环境仍阻断时继续无下载依赖的公共代码实做，不刷重复无步骤CI。

**runCount: 17/24。** PR #8维持open/Draft待用户验收，main、PR #3、原模板及公开部署均未触碰。


### 第17轮同批收口：生产preview导航回归与实施文档同步

- 公共提交 6a0685722da75405b9e560b1d322238c43db8c89：e2e/library.spec.ts 新增真实浏览器计划中的 Setext 标题、重复slug、围栏假标题目录点击测试，固定拦截仅 C20 guide.md 的审查用Markdown fixture；**仅提交 NOT_RUN**，不冒充Chromium。TypeScript 5.8.3 对独立新TS测试片段做 transpileModule 静态诊断=0，非完整构建。
- 公共提交 eefc0a3eaba75fa8be98b8d8cdbf3071632e5a4f：IMPLEMENTATION.md LL04 更新为已接线安全目录/按需高亮/本地链接，同时注明浏览器未验收；同步第17轮结果。未编辑任何worker所有权文件。
- runCount仍 **17/24**，后续代码与本进度提交以 PR #8 实际HEAD为准。分组PR #68/#69/#70 已合并，PR #8 仍 Draft；完整SDK/锁/tsc/Vite/Chromium状态保持 NOT_RUN/BLOCKED。


## PLATFORM 第18轮：三组Worker集成 + 目录JSON边界完整切片（2026-10-27）

**runCount: 18/24。** 恢复时读取了当前集成分支的 COORDINATION.md、IMPLEMENTATION.md、根与本包 AGENTS、PLATFORM、Issue #4/#5/#6/#7、开放PR和GitHub CI；实际初始集成 HEAD 为 `a7514e4b6354ade43a36dc39512c7ccafc688dbe`，未依赖容器中不存在的旧源码。

### 三分组已集成且仅触碰各自条目
- **AB [#71](https://github.com/CoderLambert/ReactLoom/pull/71)**：核对当前 head `2401f6a0274ec36e215873fda12950451f3d2b8f`，19个变更文件均属于 A*/B* 与 AB.md；仅对既有 A06 React Flow、A16 MapLibre、B18 cmdk 的实例切换、资源及键盘/命令状态加固。Worker报告11项 Node纯策略PASS、3个辅助TS规则静态检查；PLATFORM未重跑，SDK/Chromium仍NOT_RUN。单向squash集成 `c3d3739b9c0a6cc83595d61ec15424bb20b18a21`。
- **CD [#72](https://github.com/CoderLambert/ReactLoom/pull/72)**：head `462f534aa4fae8d174e55c5084d415867d245742`，28/28路径只在 C*/D* 与 CD.md；C09 Virtuoso分页复位、C10 Virtual行身份、D19 Fuse查询作用域。Worker报告12项 Node纯策略PASS，3份独立声明检查，目标SDK未运行；squash `f8033d525b10fa545262ed35a360e7a64924d425`。
- **EF [#73](https://github.com/CoderLambert/ReactLoom/pull/73)**：head `b14f579428cacad644d183829abc464c98242116`，27/27路径只在 F* 与 EF.md；F11 MSW独占启动租约和不跨tab注销全局SW，F06 PDF.js画布分辨率预算，F07 React-PDF Worker独立复制数据。Worker报告9项Node纯策略PASS，SDK/Chromium未运行；squash `79f29d8d98df61ee71ad7e6cc1d97117a5aa8c5c`。
- 3个Draft worker PR因GitHub REST不允许直接merge草稿，经核对base/head/变更所有权后先标记ready再以 `expected_head_sha` 合入。**只对worker进行状态转换，主 #8 始终open/Draft**，未force、未合main或修改PR #3。三组本轮没有新增公共依赖请求；旧版本/peer/许可证与实际lock依旧需要registry核验。

### 公共代码与测试切片
- 新增 `src/lib/bounded-json.mjs` 与 `bounded-json.d.mts`：三种生成JSON独立字节预算（目录512KB、条目详情512KB、源码索引128KB），按流实际UTF-8字节约束，拒绝HTML fallback、非JSON MIME、非2xx、无字节流、损坏UTF-8和不完整JSON；不信任Content-Length；超限时取消reader。不会替代已有目录shape、指纹与SHA校验。
- `src/lib/catalog-context.tsx`、`src/lib/catalog-detail.tsx`、`src/components/demo-host.tsx` 三处实际fetch不再调用无界 `response.json()`；新 `tests/bounded-json.test.mjs` 接入本包默认Node测试脚本。生产preview `e2e/library.spec.ts` 增加超额首页目录、错误详情MIME、错误源码索引MIME的3个负向回归，**仅提交未运行**。
- **本轮执行的精确Node证据**：容器 Node `v22.16.0`（低于项目要求>=22.18），新模块和测试在隔离目录逐字节恢复；`git hash-object` 分别 `91c34fe94c49ad73deb0c06c52f07fcda94b0924` 和 `b9295c8c24f1c67aa794167cd0b78b813c0305e7`，与当前GitHub Blob SHA匹配。执行 `node --check src/lib/bounded-json.mjs`、`node --check tests/bounded-json.test.mjs` 均PASS；`node --test tests/bounded-json.test.mjs` 得 **6 PASS / 0 FAIL / 0 SKIP**，原始TAP提交 [platform-wave18-json.tap](../evidence/platform-wave18-json.tap)，文件Git Blob `8d59a64241839ed3cd68ac09dd30924e56395a89`，原始日志SHA256 `7aee912fbb6bf21bfc363d697d21635778a24d6020b651edddf7deaf3c7363a0`。
- 独立TypeScript `5.8.3` 使用 `tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM src/lib/bounded-json.d.mts`：**PASS，仅新声明文件**，Git Blob `c7e4424a341029547fe68bce82177bfe52096c3d` 与远端一致。**完整React TSX/typecheck/Vite均未运行**，不能由此推断通过。

### 当前门槛、CI事实与分离计数
- 新代码GitHub Actions：[Library Lab run 40514981811](https://github.com/CoderLambert/ReactLoom/actions/runs/40514981811) 两个job均 `runner_id=null, steps=[]`；[主CI run 40514981794](https://github.com/CoderLambert/ReactLoom/actions/runs/40514981794) 七个job同样无Runner/无step，均标记failure但没有实际安装、类型或构建测试日志。根 `pnpm-lock.yaml` 仍缺针对本包的真实解析；本容器只有Node22.16、TypeScript5.8、无pnpm，github/npm DNS不可用。真实锁解析 **BLOCKED**；完整tsc/Vite、受影响真实SDK、Chromium生产预览、Worker/SW/iframe **NOT_RUN**；不得标记PASS。
- 历史核对口径：**119个身份条目、119份源码/guide/agent/verification结构，357个basic/business/advanced配置声明**，本轮变更9个既有条目但新增身份0。**本轮真实SDK PASS新增0；本轮真实浏览器Demo成功验收0（未运行）；117旧资料审核数未重新复核，E11/F05原件依旧缺失并按recreated处理。** 未修改validation.json以伪造成功。
- 本轮进度/证据均保存在私有仓库，主PR #8保持 Draft；main、既有PR #3、模板、公开部署和付费API均未触碰。

**下批**：优先取得Node>=22.18、pnpm10与可用registry/Runner，使用真实解析补根lock且恢复frozen，再执行完整类型/Vite和有实际SDK导入的定向套件，Chromium重点运行新增JSON安全回归与 A06/A16/B18、C09/C10/D19、F06/F07/F11、Monaco及PDF/MSW资源卸载；环境继续阻塞时推进其他可独立验证的公共代码，不把无Runner的CI失败当作构建结果。


### 第18轮同批依赖元数据复核（保持runCount=18）

按EF #73的现有版本声明直接读取官方维护仓库的实际 tag manifest（不照抄旧研究稿）：[msw v3.0.3](https://github.com/mswjs/msw/blob/v3.0.3/package.json) = MIT、Node >=22.12、可选 peer TypeScript >=5.9.x / Vite >=6 / graphql >=16；当前Lab声明TypeScript 7.0.2、Vite 8.3.4、Node >=22.18 在声明范围内。[react-pdf v11.0.0](https://github.com/wojtekmaj/react-pdf/blob/v11.0.0/packages/react-pdf/package.json) = MIT、React/ReactDOM ^19.0.0、可选@types/react ^19.0.0、固定依赖 **pdfjs-dist 6.3.289**；当前Lab React 19.3.0 / @types/react 19.3.0 / pdfjs-dist 6.3.289与之相符。[Mozilla pdf.js v6.3.289](https://github.com/mozilla/pdf.js/blob/v6.3.289/package.json) 上游声明Apache-2.0、Node >=22.13 或 >=24。**这仅证实真实上游tag中的版本、peer与许可元数据，不等于 npm registry成功拉取、解决传递依赖、pnpm lock或SDK运行；没有据此修改版本或验收状态。**


## PLATFORM 第19轮：三个Worker交互质量PR + Worker运行观察报告（2026-10-27）

**runCount: 19/24。** 从实际GitHub私有分支恢复并复读 COORDINATION、IMPLEMENTATION、根和本包AGENTS、Issue #4/#5/#6/#7、平台进度、开放PR与CI；起点为 feat/library-lab @ f96f43fad9ba6e227b71a85596c9b91eb1ff1dfb。未沿用旧容器工作树。

### 真实集成（共69个所有权范围内变更文件）

- AB [PR #74](https://github.com/CoderLambert/ReactLoom/pull/74)：固定head 428e8b81a57b6fccea6956426470db0d2eb80155；21/21路径仅B20/B21/B22及AB进度，squash eac59cbc77c74564ff4bda3b58e75eea6e41231a。Sonner仅最近保存可撤销、Motion reducer事务/焦点、Pangea拒绝过期拖拽索引。
- CD [PR #75](https://github.com/CoderLambert/ReactLoom/pull/75)：固定head c97f93c983a08f1e91950ad4b303bed0013c532a；19/19路径仅D11/D19与CD进度，squash 7e18962f510c786a417c91a9ae4b84f1582d7464。Jotai租户Store及Fuse增删改后真实重建索引。
- EF [PR #76](https://github.com/CoderLambert/ReactLoom/pull/76)：固定head dba7192c2f149012190595e4482fea4985a87432；29/29路径仅E12/E16/E19与EF进度，squash 02554d6f7e2632756cf0b2f255da25093a04ba3d。assistant-ui文本输入预算、Video.js文件魔数预检、ffmpeg.wasm输出RIFF/PCM约束。
- GitHub REST拒绝直接合并Draft Worker PR (405)，故仅将这三个worker PR标记ready后以 expected_head_sha squash；主 PR #8仍Draft。三组PR无公共新依赖请求，本轮未修改版本/根锁。

### 公共Worker报告切片（真实源码）

- 新 src/lib/worker-observation.mjs 与 .d.mts：浏览器仅在用户显式启动的Worker宿主产生本地观察记录，绑定本次runId、条目ID、demo层级及目录sourceFingerprint；最多40条清理控制字符的消息。超时/宿主异常/Worker自报结果分开；终态之后拒绝迟到事件。结构强制 assurance=unverified-browser-observation，禁止Worker声称result自动等价SDK PASS。
- src/components/worker-host.tsx 和 demo-host.tsx 接入报告；完成时可显式复制JSON（不自动上传或改verification.json），停止/切页销毁Worker和事件监听。浏览器/剪贴板与真正第三方Worker SDK尚未运行，属于待验收UI。
- tests/worker-observation.test.mjs 进入本包默认离线Node测试命令；新增定向测试4项验证身份绑定、40日志上限/终态保留、超时/主机错误与迟到消息隔离。

### 本轮实际命令及证据范围

- 宿主 Node v22.16.0，隔离目录 /mnt/data/library-lab-isolated：node --test tests/worker-observation.test.mjs → **4 PASS / 0 FAIL / 0 SKIP**；node --check src/lib/worker-observation.mjs → PASS。精确新模块blob 74c19c9a002836ceda152e0fc1b16c40350bbe4d、测试blob 99e18270b333b9e7a6bed4141f9e88d52f546c16，与运行时 git hash-object一致，非完整仓库回归。
- tsc 5.8.3：tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --lib ES2022,DOM src/lib/worker-observation.d.mts → PASS，仅声明文件；全局TypeScript transpileModule对新 worker-host.tsx 静态语法解析0错误（非类型检查）。独立TAP保存 evidence/platform-wave19-worker.tap。
- Node未达到package要求>=22.18，容器无pnpm10，registry.npmjs.org DNS无法解析；实际依赖安装及根pnpm-lock importer生成 **BLOCKED**。完整tsc/Vite、第三方SDK、Chromium生产preview、Worker宿主与复制UI验证 **NOT_RUN**；不将上述纯函数测试计为SDK PASS。当前Actions [Library Lab 40515750776](https://github.com/CoderLambert/ReactLoom/actions/runs/40515750776) 2个job、[主CI 40515750586](https://github.com/CoderLambert/ReactLoom/actions/runs/40515750586) 7个job全failure但steps=0，没有可审的构建日志。
- 目录覆盖沿用已核实的119/119源码+双指南+verification，357 basic/business/advanced **配置声明**（不是运行成功数）；本轮新增实际SDK PASS=0，浏览器Demo实测PASS=0，117原资料逐项审核量本轮未重新统计，E11/F05原件仍缺并以recreated处理。

**下批**：真实安装环境恢复后首先生成审查根pnpm-lock并启用frozen CI，执行完整tsc与Vite构建，Chromium重点检查本轮Worker报告的生命周期、复制JSON、迟到事件和卸载，再验证Monaco/F11 MSW/PDF.js/FFmpeg worker。无可用Runner时优先推进独立源码安全与增量回归，不用静态产物冒充生产验收。主 PR #8保持open/Draft，不动main、PR #3、旧模板、公开部署及付费API。

## PLATFORM 第20轮：源码索引跨请求版本绑定（2026-10-27）

**runCount: 20/24。** 从私有集成分支实际HEAD `9d57ccede8413b9822a964912dec6705978727e3` 恢复，读取根/包 AGENTS、COORDINATION、IMPLEMENTATION、本进度、Issue #4/#5/#6/#7、开放PR及CI。当前开放PR仅主 Draft #8 和与本任务无关的 #3，本批没有待合并worker PR；AB/CD/EF 进度文件无新增公共依赖请求。没有触碰worker条目、main、PR #3、其他模板、部署或付费API。

### 本批实质代码交付（提交 `2dab0664a1a4098063964ff3f9720e17cfbed333`）

- 修复源码页原有的一致性缺口：此前各源码文件虽然按 `source-index.json` 的SHA-256核对，但索引本身不受已选库详情约束；当部署/caching不同步、整个索引与源码一同过期时，仍可能显示另一套文件及其自洽摘要。
- 公共生成器现在为每条库的完整、确定性 `source-index.json` 生成 `sourceIndexSha256`，写入按需 `detail.json` 和 `catalog.json`；首页轻量索引继续只保留 `sourceFingerprint`，详情仍先与首页指纹匹配。源码页在读完128KB上限的JSON、验证路径/字节数/SHA格式后，使用浏览器WebCrypto核对规范化索引摘要；不匹配则停止源码请求/复制，提示刷新重试。旧详情缺少索引摘要会fail closed，不向下兼容未验证版本；在无WebCrypto环境也不伪造校验成功。
- 同批更新 `Entry` 类型、详情验收合同、生成器/详情/索引/源码定向单测，以及生产preview中的有效但篡改SHA索引负向E2E。共**10个公共源码及测试文件**；未增加库身份、Demo场景或新第三方依赖。页面、生成JSON、源码查看和测试合同使用同一生成事实源。

### 实际测试及证据边界

- 容器 `node --version` 为 `v22.16.0`。从新提交逐字节恢复 `src/lib/source-integrity.mjs`（Git Blob `bf7127064c3242e273cd9a085161b0b099354487`）与 `tests/source-integrity.test.mjs`（`e7660f00cbece1fb6779bc2af7ca8f413c27bf64`），`git hash-object` **2/2** 精确匹配远端。为离线运行只提供与原 `catalog.mjs` 同内容的 `safeRelativePath` 导出最小依赖替身；**不是完整仓库测试**。
- 实际命令：`node --check /mnt/data/lab-wave20-exact/src/lib/source-integrity.mjs`、`node --check /mnt/data/lab-wave20-exact/tests/source-integrity.test.mjs` => **PASS**；`node --test /mnt/data/lab-wave20-exact/tests/source-integrity.test.mjs` => **7 PASS / 0 FAIL / 0 SKIP**，原始stdout在 [platform-wave20-source-index.tap](../evidence/platform-wave20-source-index.tap)，本地原始TAP SHA256 `91ca5f2473e9f0b8c94f74a7f0fbdb33c96747ae68364508d46fcfb38900ab1f`。测试包含流式字节、目录替换与跨文件索引篡改拒绝，不等于真实SDK导入。
- **NOT_RUN**：本轮改动后的完整 `generate.test.mjs`、`catalog-payload.test.mjs`、`catalog-index.test.mjs`、完整React/TypeScript、Vite、官方SDK、Chromium生产preview新用例。独立算法原型4 PASS未计入精确源码7 PASS。
- **BLOCKED**：没有Node>=22.18/pnpm10加registry的完整依赖环境，根pnpm-lock尚无真实 `packages/library-lab` importer。最新本批基线 [Library Lab CI 40527274430](https://github.com/CoderLambert/ReactLoom/actions/runs/40527274430) 两个Job与 [主CI 40527274340](https://github.com/CoderLambert/ReactLoom/actions/runs/40527274340) 七个Job均failure，查询各样本及catalogue/bootstrap的步骤均 `steps=[]`，runner_id=0，且从开始到结束约2秒；不能将其写成真实构建/SDK失败或PASS。共享阻塞继续归 #12，不盲目重跑或伪造锁文件。

### 分离计数和后续
身份目录仍为**119**，源码/中文guide/Agent/verification结构为**119**，三层Demo声明为**357**；本轮已实际运行浏览器Demo **0**，新增官方SDK PASS **0**；117旧资料实际逐项审核数未重数，E11/F05原件继续按缺失/重建管理。新索引证据属于平台安全逻辑，不修改任何`verification.json`。

下批：可安装环境优先真实解析root pnpm lock、冻结CI、完整TS/Vite及本批generator+详情+浏览器用例；随后优先MSW SW scope、Monaco/PDF.js Worker、生产卸载和资源预算。无可用runner时继续独立公共代码，保持唯一集成分支与主 PR #8 Draft。

### PLATFORM 第20轮同批 Worker 合入（runCount仍为20/24）

- 共享源码索引安全提交与证据收口后发现新开放的AB [PR #77](https://github.com/CoderLambert/ReactLoom/pull/77)，实际head `3d27ba9718ef37eee6c48b245978d270e331eb7d`，base精确为 `feat/library-lab`，状态初始Draft。通过GitHub Compare确认ahead=5/behind=0，全部**16/16变更路径**只在 `entries/A*`、`entries/B*` 与 `progress/AB.md`。审查三份实际SDK组件、变化的纯TS helper、PR diff及dependencyRequests=0之后，仅将该**worker PR**转换为Ready，并带 `expected_head_sha` 按GitHub常规squash合入唯一私有集成分支：merge `132da5d9a50a149022b908215044828624c2ed5c`。主PR #8始终Draft、不合main。
- 接入既有 **A03 Chart.js、A15 Leaflet、B19 Embla** 三库质量改进（身份/场景数量不变）：真实Chart.js画布点选与键盘等价表格并同步选中态、到10000上界停止400ms自动采样；Leaflet实例随挂载创建并在卸载清理而非随level反复重建、过滤可见选中、删除后可重复追加本地来源；Embla真实snap数量与卡片数量区分、键盘左右与减少动画偏好、ARIA幻灯片标注。没有新增依赖/锁文件修改。
- AB报告Node22.16隔离纯政策13 PASS/0 FAIL、3个纯TS helper检查PASS，6份测试/源码Git Blob同源；**本PLATFORM未重跑**，不继承为实际第三方SDK运行验收。A03/A15/B19真实Chart.js Canvas/Leaflet Map/Embla、完整TypeScript/Vite/Chromium仍 **NOT_RUN/BLOCKED**。上文平台自身精确Blob安全回归7 PASS/0 FAIL另计；本批新增真实SDK PASS仍0。
- 当前唯一集成分支最新以本段进度提交后的GitHub实际head为准，runCount仍 **20/24**；继续优先锁文件真实依赖解析、构建、SDK/浏览器门禁并保留CI无Runner阻塞#12。

## PLATFORM 第21轮：受限网络资源事务 + CD/EF Worker 集成（2026-10-27）

**runCount: 21/24。** 从 GitHub 私有集成树恢复，读取最新根与本包 AGENTS、COORDINATION、IMPLEMENTATION、本进度、Issue #4/#5/#6/#7、开放 PR 与 CI；起点为 `feat/library-lab@7481603f18ddff3a4aabab63d543c28eb5ac2778`，未假定旧容器代码持久。平台直接开发公共源码并顺序合入2个独立通道的授权 PR。没有触碰 main、PR #3、模板、公开部署或付费 API。

### 审核集成的 Worker 成果

- **CD [#78](https://github.com/CoderLambert/ReactLoom/pull/78)**：PR base=`feat/library-lab`，固定 head `762c777f299ca851c1b8e1467e391254dd5e9215`；**30/30变更路径**严格限于 `entries/C*`、`entries/D*` 及 `progress/CD.md`。审阅 React Hook Form 异步提交/IME 捕获、p-limit 终态及切换层级的任务清理、clsx 有限类名策略；worker 报告精确策略 **8 PASS**、独立声明检查通过，PLATFORM未重复运行。这些不是SDK实测。只转换这一份worker Draft并按 expected head squash至集成分支：**`2abb3afd0991bdfc7a1a9d0c42b32853c5f10cdd`**。
- **EF [#79](https://github.com/CoderLambert/ReactLoom/pull/79)**：固定 head `b1ff7681453b625b76034d80880a3904036c59b2`，base=`feat/library-lab`，**22/22变更路径**只在 `entries/E*`、`entries/F*` 与 `progress/EF.md`；审核 ExcelJS 15位有效整数预算、SheetJS local/central ZIP 元数据/重叠校验、pdf-lib 页面数量/布局及保存尺寸。短暂 GitHub mergeable=false 后重新读取为 true，未force；按 expected head squash **`1194d25c04ac281aca25677b09bb1c1c8733b9a6`**。Worker的20项Node纯策略PASS为其独立证据，PLATFORM没有复算或升级SDK。F05旧研究原件缺失仍为 recreated。
- 两组**无新增公共依赖请求**；原有react-hook-form/p-limit/clsx/exceljs/xlsx/pdf-lib的registry真实解析、peer及最终许可审查仍待可信安装环境。没有修改 worker 自有文件和 verification.json 中SDK状态。

### 公共平台可运行的代码切片

- 新增 `src/lib/resource-fetch.mjs` / `.d.mts`：所有**实际五类生成资源入口**（首页轻目录、单库详情、文档、源码索引、源码字节）均改用根路径限定的 `requestGeneratedResource`，统一 `cache:'no-store'`、20秒同时覆盖响应头**及完整流式解析**的截止时间，合并调用者 AbortSignal 与内部超时，finally 移除监听器和超时。拒绝外站/协议相对/相对路径/点段/反斜线，已取消的请求不再启动网络，超时后可由现有重试界面恢复。原有 JSON/Markdown/源码字节限制、目录指纹与SHA-256校验**继续保持**，没有使用不受限的 response.text/json。
- 实际改动公共 `catalog-context.tsx`、`catalog-detail.tsx`、`document.tsx`、`demo-host.tsx` 四个宿主入口，本包 `package.json` 默认Node测试纳入新套件。新 `e2e/library.spec.ts` 生产预览回归要求同一个页面的五类请求具有 `no-store` 和 AbortSignal，浏览器用例**已提交但NOT_RUN**。没有引入新的第三方依赖或变更生成的119份来源。

### 真实执行及证据

- 在可用容器 **Node v22.16.0**（低于项目要求 Node>=22.18）、TypeScript 5.8.3 下运行**与 GitHub Blob 完全相同**的 `node --check src/lib/resource-fetch.mjs`、`node --check tests/resource-fetch.test.mjs` => PASS；`node --test tests/resource-fetch.test.mjs` => **7 PASS / 0 FAIL / 0 SKIP**；`tsc --noEmit --strict --skipLibCheck --target ES2022 --module NodeNext --moduleResolution NodeNext --lib ES2022,DOM src/lib/resource-fetch.d.mts` => PASS（**仅该声明文件**）。Git blobs：实现 `df78ee0f41ab89f3e488a757a4fd3a274b621a70`、声明 `6ca47a56abc7b3981e7ec9b09fb0c299dc41307c`、测试 `2d93b114404d1e286eecbfab03e2dcd14e71ebfd`，与执行环境 `git hash-object` 逐一相符。原始TAP和完整命令见 [platform-wave21-resource-fetch.tap](../evidence/platform-wave21-resource-fetch.tap)（原始stdout SHA256 `61f10421de676c21c83570829e40dacf05c476472183729ddf396268a9f5bed8`）。隔离单测只证明请求编排、边界、超时和取消逻辑，不是整站类型、浏览器或 SDK。
- **BLOCKED**：根 `pnpm-lock.yaml` 缺真实解析的 `packages/library-lab` importer；Node>=22.18/pnpm10/registry和GitHub Runner执行步骤不可用。最新 [Lab CI #40535987441](https://github.com/CoderLambert/ReactLoom/actions/runs/40535987441) 的2个job与 [主CI #40535987567](https://github.com/CoderLambert/ReactLoom/actions/runs/40535987567) 的7个job均结论failure，独立读取catalogue/bootstrap/packages job的 `steps=[]`；**没有**构建失败或成功的实际步骤证据，原因继续由Issue #12跟踪，不重跑同一空日志。
- **NOT_RUN**：本轮改动后的整个 `pnpm test` / `catalog:check`、真实React TypeScript、Vite产物、CD #78与EF #79真实第三方SDK、Chromium请求/懒加载/资源卸载、Monaco Worker、MSW SW scope、PDF/Excel真实解析。没有将新增的浏览器代码或Worker声称的PASS升级verification。
- **分开统计**：119个目录身份、119份已提交的source/guide/agent/verification结构、357个三层Demo**声明**，本轮修改6个既有worker库（C01、C20、D03、F04、F05、F09），新增目录0；浏览器真正运行成功Demo=**0（未执行）**，本轮新增实际SDK PASS=**0**；117份旧研究资料逐项审核数量**未重新统计**，E11/F05原件缺失事实不变。

**下一批**：在合格Node/pnpm registry及能执行的Runner生成/审查根lockfile importer并切回冻结安装；用真实依赖跑受影响TypeScript/Vite、C01/D03/C20/F04/F05/F09 SDK，再运行新生产preview网络超时/切换/来源校验、MSW SW/Monaco/PDF Worker卸载。若外部Runner仍无步骤，继续无下载依赖的公共源码修复，不把静态目录数量误算为运行验收。主 [Draft #8](https://github.com/CoderLambert/ReactLoom/pull/8) 持续Open/Draft待用户验收。
