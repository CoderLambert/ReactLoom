# ReactLoom Library Lab — CD 进度（43 项）

## 恢复与分支

- Issue #6、主 Epic #4，目标集成分支 feat/library-lab。前一批 PR #10 **已合入**，本批从最新集成提交 df4674d501bac029f8529ff940ba9b8c8707347c 新建 feat/library-lab-cd-wave2，避免在旧已合并分支继续开发。
- runCount：13 / 24（下方旧批次各自数字为历史记录）；仅写 entries/C*、entries/D* 及此进度文件。公共 package/lockfile/CI/生成器由 PLATFORM 独占。
- 本轮 Git commit / PR 见本通道新 PR；用户的主 PR #8 仍为 Draft，不写 main。

## 本轮新增 4 个完整垂直条目

|条目|三层真实 SDK 源码场景|指南与验证|
|---|---|---|
|C14 date-fns 4.4.0 + @date-fns/tz 1.5.0|严格 YYYY-MM-DD、IANA RSS 排程、DST 23/25h及回拨本地事件歧义|library.json / guide.md / agent.md / AGENTS.md / verification.json，NOT_RUN|
|D01 es-toolkit 1.52.0|分组去重、RSS 最新优先与分页、恶意URL/不可信数据隔离|同上，NOT_RUN|
|C07 TanStack Table 9.2.4|v9 useTable/tableFeatures、稳定业务 rowId、排序分页、手动模拟服务端/取消竞态|同上，NOT_RUN|
|D07 TanStack Query 5.104.1|QueryClient 分离、租户完整缓存键、AbortSignal/乐观mutation失败回滚|同上，NOT_RUN|

每条均有 examples/example.tsx 真正 import 目标 SDK，examples/demo.tsx 重导出；basic/business/advanced 三个 manifest 指向同一份按 level 呈现的源码，源码面板自动读取实际文件。所有 HTTP/服务端情形明确为内存 fixture，不宣称实网通过。

当前 CD 43 条：已经接入实际示例的 C01/C02/C07/C14/C20/C21/D01/D03/D05/D07 = **10/43**；这与“真实 SDK 已验收”是不同计数。其余33条仍待实现，不能以119个目录数代替完成数。

## 新增定向 SDK 测试文件

- entries/C14-date-fns/tests/sdk.test.mjs：date-fns + TZDate 真实计算春/秋 DST 的23/25小时。
- entries/D01-es-toolkit/tests/sdk.test.mjs：真实 es-toolkit 对 orderBy/uniqBy/groupBy/chunk 进行断言。
- entries/D07-tanstack-query/tests/sdk.test.mjs：真实 QueryClient 多租户 cache key 与 cancelQueries/AbortSignal。

本执行环境没有真实 npm 安装。本次检索官方文档确认日期 v4+tz、v9 Table API、Query v5 cancellation 和 es-toolkit/array。容器 DNS 不能解析 github.com / registry.npmjs.org，SDK/TS/Vite/Playwright **NOT_RUN**；未伪称测试通过。以上 test 文件是新增可复现测试，不是已经运行通过的测试结果。后续由 PLATFORM 汇总到合适的 test:sdk 脚本，执行后将日志与 sourceFingerprint 绑定到 verification.json。

## dependencyRequests：请 PLATFORM 统一处理，CD 禁止编辑锁文件

|依赖|固定版本|理由|官方依据|
|---|---|---|---|
|date-fns|4.4.0|C14 日期计算和 DST|https://github.com/date-fns/date-fns/releases/tag/v4.4.0|
|@date-fns/tz|1.5.0|C14 TZDate/tz |https://github.com/date-fns/tz|
|es-toolkit|1.52.0|D01 array groupBy/orderBy/uniqBy/chunk|https://es-toolkit.dev/|
|@tanstack/react-table|9.2.4|C07 v9 API/rowFeature，不与 v8 混用|https://tanstack.com/table/latest|
|@tanstack/react-query|5.104.1|D07 QueryClient/useQuery/mutation，与现有 SPA 对齐|https://tanstack.com/query/latest/docs/framework/react/overview|

PLATFORM 需使用真实注册表校验、解析 peers 并更新 pnpm-lock.yaml；本次没有自造 integrity。确认实际构建之前，各版本只表示“目标版本”，不是“已安装验收版本”。

## 后续推进队列

1. 合并后先补 C07/D07 的真正 TS/SDK/浏览器验证，并复核 v9 React Table JSX Type、Tenant 切换和 Query mutation 清理。
2. 然后继续 C09 React Virtuoso 或 C10 TanStack Virtual、D04 p-queue、D08 ky/D09 Axios；着重虚拟化稳定高度/行ID、超时取消/竞态、HTTP Retry-After。
3. 若 SDK 下载仍不可行，继续条目源码与文档，不要每轮重复跑同一个 DNS 失败；将真实未执行留 NOT_RUN。
4. 仅 PLATFORM 审核并合并本批 PR 至 feat/library-lab；本通道禁止合 main、公开部署或影响模板。

## 第三批 / 2026-10-27 — 四个真实 SDK 条目（C09、C10、D04、D08）

- 起点：当前集成 feat/library-lab @ 2b244ef44cbf8e216a0f39e77b763acae8f50c04；单独新分支 feat/library-lab-cd-wave3，避免复用已合并 wave2 分支。
- 本批新增 C09 React Virtuoso 4.18.19、C10 @tanstack/react-virtual 3.14.21、D04 p-queue 10.0.0、D08 ky 2.2.0，每项独立 library.json、三场景真实目标 SDK 源码（examples/example.tsx + demo.tsx）、中文 guide.md、agent.md、AGENTS.md、verification.json 和 tests/sdk.test.mjs。
- C09：10,000项可变高度窗口、RSS分段加载及IME提交、firstItemIndex历史前插与真实展开正文。
- C10：8,000条自主管理虚拟尺寸的列表、业务键与过滤重置、measureElement和动态高度展开，React19 使用 useFlushSync:false。
- D04：真实 PQueue并发、intervalCap/interval/strict时间窗与priority、取消和Promise结算。本地计时器只模拟任务工作，不声明实HTTP限流性能。
- D08：真实Ky v2.2 GET、JSON运行时校验、AbortSignal/epoch、503有限重试、POST409不重试、204空响应、maxResponseSize；所有fetch请求被严格限定到虚构 https://lab.invalid 的注入式fixture，不会连接互联网。
- 当前 CD 已接入真实 SDK import 示例：先前10项 + 本轮4项 = **14/43**；仍有29项缺少完整实例。12个新场景仅是代码路径，不代表浏览器通过。
- 四个新 SDK 测试文件使用 node:test 直接 import 目标包。C09/C10 SSR smoke **只能证明SSR入口**，并不证明浏览器布局与滚动。D04覆盖并发/队列中止，D08覆盖真正SDK重试/409/响应尺寸。
- 真实验证：已确认官方固定tag的包元数据、许可与接口；源文件/目录已写入 Git tree。当前环境仍无可用 npm 安装和真实 Chromium；**SDK/TS/build/browser全为 NOT_RUN**，没有用历史研究/Mock替代。下一步 PLATFOM 先更新依赖并用可用runner真实执行；验证成功后绑定sourceFingerprint/命令/日志。
- 修改范围仅 entries/C09、C10、D04、D08 与本进度。未改公共组件、package.json、pnpm-lock.yaml、main及旧模板。

### 第三批 dependencyRequests（仅 PLATFORM 统一安装）

|依赖|目标固定版本|用途|核查来源|
|---|---|---|---|
|react-virtuoso|4.18.19|C09真实变高列表，React19|https://github.com/petyosi/react-virtuoso/releases/tag/react-virtuoso%404.18.19|
|@tanstack/react-virtual|3.14.21|C10 useVirtualizer，React19 peer|https://github.com/TanStack/virtual/releases/tag/%40tanstack%2Freact-virtual%403.14.21|
|p-queue|10.0.0|D04并发与严格速率队列，Node >=22/ESM|https://github.com/sindresorhus/p-queue/tree/v10.0.0|
|ky|2.2.0|D08 HTTP请求/重试/尺寸上限，Node >=22/ESM|https://github.com/sindresorhus/ky/tree/v2.2.0|

PLATFORM 在 packages/library-lab/package.json 及真实 pnpm-lock.yaml 中统一追加以上四个实际依赖；因静态依赖契约检查会发现这些新库，worker PR 合并前可标记集成依赖阻塞，不可手工编造 lock integrity。对本轮新增库至少执行 `node scripts/generate.mjs --check` 与其四个 `node --test entries/.../tests/sdk.test.mjs`，再执行实际 typecheck/build/代表性 E2E；没有环境就不要宣称通过。

### 后续可执行队列

优先 D09 Axios（拦截器、取消、409与限流重试边界）、C15 Day.js 与 C16 Luxon（同组时区/语义差异）、D10 Zustand（selector、持久化隔离）、C11 react-arborist（虚拟树与拖拽）、D19 Fuse.js（本地检索）。优先不依赖新的共享 runner 的条目；每轮接入有实际源码与文档的批次，而不是只添加目录卡片。

## 第四批 / 2026-10-27 — 五个真实 SDK 教学条目（C15、C16、D09、D10、D19）

- runCount：**4 / 24**；基线 `feat/library-lab@688a660272775b3399a18ae34630401a19ac556c`，本批工作分支 `feat/library-lab-cd-wave4`，新独立 PR 的目标分支固定 `feat/library-lab`。本批所有修改仅在 entries/C*、entries/D* 与本进度文件；不触碰根包、锁文件、公共 src/CI/main/旧模板。
- 5个条目从 missing 改为 recreated，每条有准确 library.json、guide.md、agent.md、AGENTS.md、verification.json、examples/example.tsx、examples/demo.tsx、tests/sdk.test.mjs，共 **15 个 basic/business/advanced Demo 场景**，可见代码全部与 entryPoint 同源。
- **C15 Day.js v1.11.23**：严格 YYYY-MM-DD，utc/timezone/customParseFormat 插件，RSS 时区民用日，纽约春/秋23/25小时与回拨两种显式 UTC instant。
- **C16 Luxon v3.7.2**：DateTime/Interval、zone/locale、+1 calendar day、getPossibleOffsets 检测重叠本地时间；开发类型需求 @types/luxon。
- **D09 Axios v1.20.0**：真实 Axios.create/拦截器及 eject、AbortSignal/generation、防旧请求覆盖；仅本地严格域名自定义 adapter 模拟后端 503 GET 有限重试与 POST 409 不重试。adapter 模拟的是服务端协议，不是 mock Axios SDK。固定安全版本，避免已知 2026-03 恶意发行的 1.14.1 / 0.30.4。
- **D10 Zustand v5.0.16**：真实 createStore、useStore、persist、createJSONStorage、partialize、version/migrate；团队 A/B UI 状态隔离；示例使用独占 Map storage，绝不向用户浏览器真实 localStorage 存 token。
- **D19 Fuse.js v7.5.0 (Apache-2.0)**：字段加权模糊搜索、score、group筛选、IME防误提交、threshold 调整、动态数据后重建实际 Fuse 索引；明确搜索不是 ACL 和语义嵌入。

### 第四批可核查检查

- Git tree 静态检查：五条 library.json JSON 均成功解析；五条各8个文件齐备，15个 Demo metadata 都具备真实 entryPoint/sourceFiles，所有相对路径在 Git tree 中存在；五条 examples/example.tsx 均静态导入其声明的目标 SDK。
- 五份独立 node:test 的纯 JavaScript **语法解析 PASS（去掉 ESM import 后只做 JS Parser 语法检查）**，不是 Node 真正执行。
- 本轮未安装 npm package、未运行真实 SDK / tsc / Vite build / Playwright；五个条目 verification.json 的 sdk/build/browser 保持 NOT_RUN。平台现有环境与 CI Runner 运行限制仍待集成负责人复核，绝不把静态通过称为 SDK 通过。
- 特别注意：C15/C16 的日期与 DST 结论尚需 Node 真正按目标版本核对；D09 自定义 adapter 不证明实际 HTTP 请求对 409/503 的默认行为；Zustand 教学内存存储不证明浏览器跨刷新持久化。

### dependencyRequests — 仅 PLATFORM 管理 package.json 与 pnpm-lock.yaml

| 包名 | 目标版本 | 类型/许可 | 核验依据 |
|---|---|---|---|
| dayjs | 1.11.23 | dependency，MIT | https://github.com/iamkun/dayjs/releases/tag/v1.11.23 |
| luxon | 3.7.2 | dependency，MIT | https://www.npmjs.com/package/luxon |
| @types/luxon | 3.7.6 | devDependency，MIT | https://www.npmjs.com/package/%40types/luxon |
| axios | 1.20.0 | dependency，MIT | https://github.com/axios/axios/releases/tag/v1.20.0 |
| zustand | 5.0.16 | dependency，MIT；现有SPA曾用5.0.15，不要跨模板改依赖 | https://security.snyk.io/package/npm/zustand |
| fuse.js | 7.5.0 | dependency，Apache-2.0 | https://www.npmjs.com/package/fuse.js |

依赖安全：Axios 禁止自动浮动至历史恶意版本。上述目标版本已在公共来源检索，尚未由本执行环境真实 npm 解析/验证 peers，PLATFORM 负责安装、冻结锁文件及实际运行。不得手工伪造 lock integrity。

### 进度与下一批

- CD累计 **19/43 条已编写真实目标 SDK 导入示例**（此前14 + 本批5）。实际 SDK 运行通过数量本批新增仍为0，待 PLATFOM 安装并验证后再更新 sourceFingerprint 证据。
- 后续建议先 C11 react-arborist / D11 Jotai，再 C17 i18next / C18 react-i18next / D15 Dexie / D18 Comlink / D20 MiniSearch；继续处理生命周期和边界，避免仅生成目录卡片。
- 本批每条新增定向 tests/sdk.test.mjs；由 PLATFORM 合并进入统一 sdk-runner 机制并复核 SDK / TS / browser，当前不强行编辑公共工具脚本。

## 第五批 / 2026-10-27 — 五个多工作区/本地状态 SDK 实战（C17、C18、D06、D11、D20）

- runCount：**5 / 24**；基于 `feat/library-lab@fc3e3d3e18d3599333d001cae5c45b44704e5211` 新建 `feat/library-lab-cd-wave5`。之前 PR #10/#14/#18/#21 已合入集成分支，未复用已合并/落后的 worker 分支；本轮未修改 main、公共平台或锁文件。
- **C17 i18next 26.4.3**：createInstance + initAsync:false、英中切换、插值、英文单复数、common/news namespace、缺失键 fallback，实例销毁与语言切换 generation。明确不是机器翻译和 React 订阅实现。
- **C18 react-i18next 17.0.16 + i18next 26.4.3**：I18nextProvider/useTranslation/Trans 实际调用、两组独立实例隔离、多个命名空间、受控 strong 富文本映射；有独立 SSR SDK 测试文件，不拿 SSR 冒充浏览器 hydration。
- **D06 Immer 11.2.9**：produce 深层更新和结构共享、RSS read 状态、enablePatches/produceWithPatches/applyPatches；进阶示例禁止新写入与旧逆向 Patch 交错，生产要求版本/任务身份。
- **D11 Jotai 3.0.1**：原子、派生 atom、写入 atom、createStore/Provider；两个团队共用 atom 配置却互不影响。v3 为 ESM-only，v3.0.1 修复 v3.0.0 useAtomValue 回归。
- **D20 MiniSearch 7.2.0**：真实倒排索引、boost/prefix/fuzzy、autoSuggest、按类 filter 先于前20条限制、输入法 composing、源文档变更后 rebuild。不是授权 ACL；评分方向与 Fuse.js 不同。

### 本批交付与静态校验

- 新增 **5条 × 3级 = 15个真实 SDK import 示例场景**，每库都有 library.json、guide.md、agent.md、AGENTS.md、examples/example.tsx、examples/demo.tsx、tests/sdk.test.mjs、verification.json，共40个库级文件。源码展示与运行代码同源。
- GitHub staged tree：初版 `cb6fa0a663c9450599d15d37c1ad4efd7ca37773`，修复两个测试断言后为 `0543d8cc4424b60a7b0f2dd5262712b16f248cff`。已用 GitHub Git Tree 核对五条每个文件存在、JSON manifest 均可解析、5×3个源码入口和文件声明完整。使用 V8 Function 检查 **5份剥离 ESM import 后的 Node 测试语法，5/5 PASS**；不等于真正执行 SDK、tsc 或 Vite。
- 本轮**没有完成 npm 实际安装、SDK Node 执行、TypeScript 类型检查、生产构建或 Playwright**；五条 verification.json 的 sdk/build/browser 均为 **NOT_RUN**。执行容器先前多次 DNS/CI Runner 阻塞，本轮避免重复失败。没有用旧研究或模拟服务冒充 SDK PASS。
- C17/C18 采用当前 SPA 模板依赖版本；Jotai v3.0.1、Immer v11.2.9 和 MiniSearch v7.2.0 参考官方 tag/npm 核对。仍需 PLATFORM 解析实际依赖/peer/React19 和 Node 环境。

### dependencyRequests — 仅 PLATFORM 管理

|包|目标版本|来源|用途|
|---|---|---|---|
|i18next|26.4.3|https://www.i18next.com/overview/api|C17/C18 共用 SPA 锁定版本|
|react-i18next|17.0.16|https://react.i18next.com/latest/usetranslation-hook|C18 React hook/Provider/Trans|
|immer|11.2.9|https://github.com/immerjs/immer/releases/tag/v11.2.9|D06 patch/rollback|
|jotai|3.0.1|https://github.com/pmndrs/jotai/releases/tag/v3.0.1|D11 ESM-only/React18+/Node22.12+|
|minisearch|7.2.0|https://www.npmjs.com/package/minisearch|D20 搜索索引|

依赖只能由 PLATFORM 统一写 packages/library-lab/package.json 与根 pnpm-lock.yaml，不能手造 lock integrity。待依赖接入，先执行本批五份真实 SDK 定向测试，再 typecheck/build/代表性浏览器 E2E，随后按 sourceFingerprint 与执行日志记录 PASS。

### 汇总与下一队列

- CD 真实 SDK import 示例源码累计从19/43增至 **24/43**，剩余19条无完整示例；本批新增真实 SDK 通过数为0。
- 下轮优先 C11 react-arborist（树形虚拟列表/拖拽）、C19 nuqs（URL 历史和 IME）、D15 Dexie（事务/迁移）、D18 Comlink（Worker 生命周期）、C06 IMask（中文输入/光标）、C03 Valibot（schema 和错误）；遇 Worker 环境阻塞继续独立条目。
- 本 PR 只能以 feat/library-lab 为 base，主 Draft PR #8 保持不动，PLATFORM 单一 owner 审核合入。

## 第六批 / 2026-10-27 — 六个独立 SDK 实战条目（C03/C06/C11/C19/D15/D18）

- runCount：**6/24**。基于集成 `feat/library-lab@a9441528ea68d2daa56f2c0bbbc0e4fbe7cf5ae1` 新建 `feat/library-lab-cd-wave6`，不复用已合并 wave5 的旧分支；目标是集成分支，绝不写 main。
- 本批 **6 个条目、18 个 basic/business/advanced Demo 入口**：每条均具备 library.json、guide.md、agent.md、AGENTS.md、examples/example.tsx、examples/demo.tsx、tests/sdk.test.mjs、verification.json。D18 另外有真正模块 Worker `examples/worker.ts`。共49个新/改文件（加本进度文件共50个）。
- **C03 Valibot 1.4.2**：安全解析 unknown JSON、HTTPS RSS 数组导入合同、partialCheck + forward 的跨字段日期错误。测试实际 SDK safeParse、字段剔除和 issue。
- **C06 IMask/react-imask 7.6.1**：onAccept/unmask、编号和金额掩码、日期格式与真正日历日期的区分、中文自由输入不强加数字掩码；Node test 真正导入 imask。
- **C11 react-arborist 3.16.0**：受控 RSS 分组树、ID 稳定、官方 adjustMoveIndex 处理 pre-removal drop slot、1800 节点的虚拟化与中文输入法过滤。Node test 只验证官方 helper，不冒充浏览器拖拽。
- **C19 nuqs 2.10.1**：TanStack Router 适配器、独立 ll_c19_ 参数命名空间、URL 搜索分页、push/replace 历史、IME 和非法整数降级。TanStack 集成仍需真实浏览器验证。
- **D15 Dexie 4.4.7**：真实 IndexedDB 索引、单事务重复主键回滚、v1→v2复合索引；演示仅在随机独占数据库写 fixture，退出删除自身库。Node SDK 测试用 fake-indexeddb 模拟 IDB 底层，不能冒充 Chromium。
- **D18 Comlink 4.4.2**：真实模块 Worker+Comlink.wrap/expose、4千项分组计算、Uint8Array transfer、Comlink.proxy 回调、releaseProxy/terminate/epoch 取消。Node test 用真实 MessageChannel+官方 Node adapter；Browser Worker/CSP 仍待验收。

### 实际文件范围、代码与测试事实

- GitHub Git Tree SHA：`5e5a6da00b1b443821644422e922e9a23ef7ba21`（添加进度前）；前五个条目的目录树递归检查已确认为 guide/agent/AGENTS/verification/json/源文件/sdk test 均存在。D18 的所有文件由单独 create_tree 创建，后续用 git diff 核对完整变更范围。
- 本轮没有运行实际 npm SDK、TypeScript 类型检查、Vite 生产构建或 Chromium。四类检查均为 **NOT_RUN**。已有 Runner 无法分配与本地 npm DNS 失败均不应靠一遍遍重试来替代开发；新文件的结构完整性不等于 SDK PASS。
- GitHub 分支只新增授权的 `entries/C*`、`entries/D*` 和本进度；不改公共 package/lockfile/CI/索引/旧模板。

### dependencyRequests（只由 PLATFORM 统一写 package/lock）

| 包名 | 固定目标版本 | 用途、已核查资料 | 集成注意 |
|---|---|---|---|
| valibot | 1.4.2 | C03, https://valibot.dev/guides/parse-data/ | MIT，Node/Vite 实际 import 后验证 |
| react-imask | 7.6.1 | C06, https://imask.js.org/api/modules/react_imask.html | MIT，与 imask 版本一致，React19 onAccept 必须跑浏览器 |
| imask | 7.6.1 | C06, https://imask.js.org/guide.html | MIT，Node SDK 测试使用底层 createMask |
| react-arborist | 3.16.0 | C11, https://github.com/jameskerr/react-arborist/releases/tag/v3.16.0 | MIT，核查 react-dnd 等 peer/transitives |
| nuqs | 2.10.1 | C19, https://nuqs.dev/docs/adapters | MIT，TanStack Adapter 实验性，与 validateSearch 需实测 |
| dexie | 4.4.7 | D15, https://dexie.org/docs/Version/Version | Apache-2.0，浏览器持久化检查 |
| fake-indexeddb (devDependency) | 6.2.6 | D15 Node SDK 测试, https://www.npmjs.com/package/fake-indexeddb | Apache-2.0，不应进入生产浏览器包 |
| comlink | 4.4.2 | D18, https://github.com/GoogleChromeLabs/comlink | Apache-2.0，Node adapter 和 Vite Worker 产物需实测 |

固定版本基于 2026-10-27 可访问的官方文档、npm 发布和公开安全版本列表；依赖尚未由 PLATFORM 的 pnpm 真实解析，不手写 lock integrity，旧模板版本不变。

### 当前范围与继续队列

- CD从 **24/43 → 30/43 条拥有真实 SDK import 示例源码**，剩余13项。该数字是写入源码的条目数，不是已通过实测数量。
- 优先继续 C04 JSON Forms、C05 Ajv、C08 AG Grid（社区许可限定）、C12 FullCalendar、C13 Frappe Gantt、D02 lodash-es；之后处理 D12 Redux Toolkit、D13 RTK Query、D14 XState、D16 Workbox、D17 Yjs、D21 Pagefind 和 C22 Moment 迁移。
- PLATFORM 应先对本批新增8个包解析真实版本/peer，执行对应6份 sdk tests、typecheck/build 和有代表性的 Browser 场景，再按 sourceFingerprint 与日志更新 PASS；不会把新增 tests 文件冒称为已运行。
- 此轮结束后 CD worker PR 必须 base=feat/library-lab；仅 PLATFORM 可以审核合并，后续再从最新集成分支续作。

### 第六批补强（提交到 PR #28）

- 交互修订：C19 nuqs 在浏览器后退/前进后同步输入框草稿，页码按真实筛选结果页数夹取，防止分享非法/过期页码导致有结果却显示空页。
- D18 Comlink 对 `new Worker` 的 CSP/模块兼容失败显式反馈而非 unhandled rejection；Worker 代理进度回调等待 RPC acknowledgment，保证最终结果不超前于进度事件。
- 仍未实际安装依赖或运行浏览器；这些是源码级风险修正，验证状态保留 NOT_RUN。PR 需 PLATFORM 集成/依赖和浏览器复核。


## 第七批 / 2026-10-27 — Schema、ESM 工具、Redux Actor 与离线 CRDT（C05/D02/D12/D14/D17）

- runCount：**7/24**。从已验证集成基线 `feat/library-lab@9340aa9d42cd0318a31eda8e5a1ee840dd2d5108` 延续事先创建但无差异的 `feat/library-lab-cd-wave7`。原 `feat/library-lab-cd` 已落后，**未覆盖或重写旧分支**。本批仅改 `entries/C*`、`entries/D*` 与本进度文件。
- 新增 **5 个独立条目 / 15 个 basic-business-advanced 分层场景**。每库 8 个事实文件：library.json、guide.md、agent.md、AGENTS.md、verification.json、examples/example.tsx、examples/demo.tsx、tests/sdk.test.mjs；展示代码直接引用运行示例，真实 SDK 在示例和 Node 测试中导入。
- **C05 Ajv 8.20.0**：静态可信 JSON Schema + strict / allErrors / 不隐式转换，RSS 导入合同与 if/then 条件必填；明确 core 不自带 formats，校验不等同 SSRF 安全。
- **D02 lodash-es 4.18.1**：uniqBy 首次保留语义、groupBy/orderBy 稳定排序、chunk 分批、debounce.flush/cancel 和中文输入法 composition 期间不错误提交。
- **D12 Redux Toolkit 2.13.0**：真实 configureStore/createSlice、两个独立租户 store、状态订阅、请求身份守卫及异步回包次序；切换租户/卸载时取消演示计时器和活跃请求标记。
- **D14 XState 5.33.3**：真实 setup/createActor/assign、draft-reviewing-rejected-published 审批转换、两次重试预算 guard、Strict Mode actor 创建/订阅/停止所有权。
- **D17 Yjs 13.6.33**：真实 Y.Doc / Y.Map、离线两个副本、encodeStateVector / encodeStateAsUpdate / applyUpdate 增量同步和同键冲突收敛。无真实网络、鉴权、永久存储/awareness，不能宣称完整协作后端。

### 本批真实检查

- Git staged tree 逐项核对：5 个目录均存在 library.json/guide/agent/AGENTS/verification/examples/{example,demo}/tests/sdk.test.mjs；**40 个库级文件**。
- 5 份 `library.json` 实际 JSON.parse 成功，合计 **15 个声明 Demo**，每个 `entryPoint` 在 sourceFiles 中且目标路径存在。
- 5 份 `tests/sdk.test.mjs` 使用 V8 的 Function parser 去除顶层 import 后**仅语法解析 5/5 PASS**。这不是导入/执行真实 SDK，也没有解析 TSX 的类型。
- 当前执行容器目标 SDK 未安装，历史 npm DNS、GitHub Runner 分配限制仍需 PLATFORM 排查。为避免重复已知失败，本批没有重复 npm 安装尝试。**SDK Node = NOT_RUN，TypeScript = NOT_RUN，Vite production = NOT_RUN，Chromium = NOT_RUN**。上述四项严格不标 PASS，旧研究结果不继承。
- 文档/示例只用了原创 fixture 和官方公开 API，未提交外部实际数据，未启动对外请求或付费服务。

### dependencyRequests（PLATFORM 单一 Owner）

| npm 包 | 固定目标版本 | 范围和许可证 | 已核对官方信息 |
|---|---|---|---|
| ajv | 8.20.0 | dependency / MIT；C05 JSON Schema compile | https://www.npmjs.com/package/ajv |
| lodash-es | 4.18.1 | dependency / MIT；D02 ES Modules named imports | https://www.npmjs.com/package/lodash-es |
| @types/lodash-es | 4.17.12 | devDependency / MIT；D02 TypeScript declarations（依赖 @types/lodash） | https://www.npmjs.com/package/@types/lodash-es |
| @reduxjs/toolkit | 2.13.0 | dependency / MIT；D12 configureStore/createSlice | https://www.npmjs.com/package/@reduxjs/toolkit |
| xstate | 5.33.3 | dependency / MIT；D14 Actor v5 | https://www.npmjs.com/package/xstate |
| yjs | 13.6.33 | dependency / MIT；D17 Y.Doc / binary update | https://www.npmjs.com/package/yjs |

这些版本是本轮研究的**目标版本**，并非当前包已安装。仅 PLATFORM 可以更新 `packages/library-lab/package.json`、`pnpm-lock.yaml` 和 CI；不手造 integrity；应核对 Peer/TypeScript7/React19 后跑真实 SDK+tsc/build/Browser，再将 sourceFingerprint 和持久日志绑定 verification PASS。

### 当前进度与下轮任务

- 本轮从 **30/43 提升至 35/43 有真实 SDK import 源码和文档**，剩余 **8 条**：C04 JSON Forms、C08 AG Grid、C12 FullCalendar、C13 Frappe Gantt、C22 Moment 历史迁移、D13 RTK Query、D16 Workbox、D21 Pagefind。35 只是源码接入数，不是 SDK 正式验收数。
- 下一批优先 C04 + C08；结合 v7 FullCalendar 的 React 单包结构实施 C12，防止误用 v6 拆分插件安装；随后 C13/D13 和需要 SW/CLI 隔离的 D16/D21，历史 C22 使用迁移示例而非安装旧 Moment SDK。
- 本批 worker PR 仅以 `feat/library-lab` 为 base，交由 PLATFORM 统一依赖/审查/合并。没有变更 main、旧模板、PR #3 或其他通道。
### 第七批 GitHub 交付定位

- 真实功能提交：`26e005da1b129c57e0876e2c4e3cbaa954553eab`。
- Draft PR：[#31](https://github.com/CoderLambert/ReactLoom/pull/31)，base=`feat/library-lab`，等待 PLATFORM 审核与依赖接入。
- GitHub compare：41/41 文件只在 CD 允许路径；五库各八个条目文件，另一个 progress 文件；当前结果属于**源码层**而非 SDK PASS。


## 第八批 / 2026-10-27 — C04/C08/C12/C13/D13 五个 SDK 垂直场景

- runCount：8/24。从最新集成 feat/library-lab@55ee60f3967ba652d3d3f3399ed9111ee55394b6 新建 feat/library-lab-cd-wave8，已确认上一批 #31 合并。只修改 entries/C*、entries/D* 和本进度文件。
- C04 JSON Forms 3.8.0：JSON Schema/UISchema/vanilla renderer，RSS 地址条件、白名单 payload、409 字段回填和取消；409/服务端只是本地 fixture。
- C08 AG Grid Community 36.2.0：AgGridProvider + AllCommunityModule、稳定 rowId、readOnlyEdit、不变更新、分页及快慢加载竞态；未用商业 Enterprise。
- C12 FullCalendar React v7.1.3：v7 子路径插件、skeleton/theme/palette CSS、日历创建、拖动回滚与纽约 DST 两个 UTC instant；没有使用 Premium。
- C13 Frappe Gantt v1.2.2：动态真正加载 SVG 甘特、复制输入防止 SDK 改动 React state、只读图和可键盘编辑表格、无效区间/409 回滚，独立 CSS 避免未暴露包子路径。真实浏览器资源释放待检查。
- D13 RTK Query 2.13.0：真实 createApi / configureStore / hooks / API middleware、租户维度完整缓存键、tag invalidation、私有 store、内存 fixture 和模拟 409。
- 五项都包含 library.json、3个 level 指向同一真实示例、examples/demo.tsx 和 example.tsx、中文 guide.md、agent.md、AGENTS.md、verification.json、node:test/sdk.test.mjs；C13 另有 examples/gantt.css。合计41个新增条目文件及本进度修改。
- 原研究包有原件，但本轮页面与 Agent 笔记基于核对过的官方 API 重新编写，标 recreated，不继承旧研究 PASS。
- 当前未取得本批真实 npm 包安装、SDK 运行、TypeScript 检查、Vite build、Chromium 测试证据；五条 verification.json 的 sdk/build/browser 均为 NOT_RUN。静态存在 != 真实验收通过。

### dependencyRequests — 仅 PLATFORM 安装并管理 lockfile

| 包 | 固定目标版本 | 用途 | 来源 |
|---|---|---|---|
| @jsonforms/core | 3.8.0 | 核心 schema | https://github.com/eclipsesource/jsonforms |
| @jsonforms/react | 3.8.0 | React renderer | https://jsonforms.io/docs/integrations/react/ |
| @jsonforms/vanilla-renderers | 3.8.0 | Vanilla 控件 | https://github.com/eclipsesource/jsonforms |
| ajv | 8.20.0 | 类型、Schema 错误 | https://ajv.js.org |
| ag-grid-community | 36.2.0 | Community 模块 | https://www.ag-grid.com/react-data-grid/installation/ |
| ag-grid-react | 36.2.0 | React Grid/Provider | https://www.ag-grid.com/react-data-grid/installation/ |
| @fullcalendar/react | 7.1.3 | v7 标准日历与插件 | https://fullcalendar.io/docs/react |
| temporal-polyfill | 1.0.4 | v7 peer，须再核查 | https://fullcalendar.io/docs/upgrading-from-v6 |
| frappe-gantt | 1.2.2 | SVG 甘特 | https://github.com/frappe/gantt |
| @reduxjs/toolkit | 2.13.0 | RTK Query | https://redux.js.org/toolkit/rtk-query/overview |
| react-redux | 9.3.0 | React Provider | https://react-redux.js.org |

上述版本是已查文档与归档的目标，不是已安装测试成功的声明；PLATFORM 统一核对 peers/许可/版本、写 package/真实 pnpm-lock，禁止手造 integrity。重点检查 JSONForms onChange 初始化、AG Grid readOnlyEdit、FullCalendar v7 CSS 与 peer、Gantt 包 CSS exports、RTK Query BaseQueryFn typing。

### 累计与下一队列

- 第七批 35/43，新增5项后达到40/43已有真实 SDK import 示例代码；不能等同40个 SDK PASS。
- 剩余 C22 Moment（历史迁移，不强装旧 Moment）、D16 Workbox（Service Worker 隔离 scope）、D21 Pagefind（真实 Node CLI 静态索引）。待公共 Runner/isolated runner 支持后实现，不能伪造浏览器 shell。
- 当前 PR base 必须是 feat/library-lab，PLATFORM 审核合并；不触碰 main、公共依赖/锁文件、旧模板和 PR #3。

### 第八批追加修复：Moment 迁移与本地表单竞态

- 增加 C22 Moment 历史迁移条目：**不安装或调用旧 Moment**，用真实 date-fns/Day.js/TZDate 演示严格日期、RSS 时区显示、23 小时 DST 民用日与重复 01:30 instant；guide.md / agent.md / AGENTS.md / 3级入口 / Node SDK 测试 / verification.json 均有独立文件。当前 CD 源码接入由40/43提升为 **41/43**，剩余 D16 Workbox 与 D21 Pagefind。
- C04 JSON Forms 修复：仅数据实际变化时清除服务器 additionalErrors；用户编辑时递增 generation 并 abort 旧保存，防止请求中旧结果覆盖新草稿。更换 additionalErrors 不再被校验回调瞬间清空；真实浏览器行为仍未运行。
- C22 迁移指南消除转义反引号，正常渲染 Markdown 代码块；时区计算显式传入 date-fns v4 `{in:tz('America/New_York')}`，避免默认环境时区参与民用日运算。
- 本批未修改公共 src、package、lockfile、CI 或其他组；测试证据仍为 SDK/build/browser NOT_RUN。C22 所需 date-fns@4.4.0 / @date-fns/tz@1.5.0 / dayjs@1.11.23 均已在集成 manifest 中，**无新增依赖**。

#### 风险交接

C13 Frappe Gantt 1.2.2 上游 `src/index.js` 的 `bind_bar_events` 会向 `document` 绑定 mouseup，且未暴露 destroy/unsubscribe。仅替换容器子节点不能释放该 document listener，连续切换示例会累积监听。**请 PLATFORM 在生产可交互前提供独立 iframe document runner 并用 Chromium 验证停止/清理**，或者限制直接加载；不要将这条标 browser PASS。本批 C13 动态代码仍为待浏览器验证的教学草稿。

### 第八批最终补充：源码边界检查与日期输入修复

- 安排了本轮 **6 个条目/18 个 Demo 声明**（C04、C08、C12、C13、C22、D13）；在最新 worker Git tree 逐条确认每个目录至少含 library.json、guide.md、agent.md、AGENTS.md、verification.json、examples/example.tsx、examples/demo.tsx、tests/sdk.test.mjs。6个 manifest 均为 basic/business/advanced 各一条，entryPoint/sourceFiles均在 Git tree 中存在。
- 对6份实际 SDK Node 测试源码移除顶层 ESM import 后进行 V8 JavaScript parser 检查：**静态语法 6/6 通过**，不是运行 SDK；本轮未在已安装目标包的环境里执行 Node test/tsc/Vite build/Chromium，全部 **NOT_RUN**。
- C12 FullCalendar 和 C13 Frappe Gantt 的 YYYY-MM-DD 用户输入增加 UTC round-trip 校验，防止 Date.parse 自动进位接受 2026-02-30 一类无效日期。这是新增代码保护，真实浏览器验收仍 NOT_RUN。
- Worker Draft PR #35：https://github.com/CoderLambert/ReactLoom/pull/35 ，base=feat/library-lab，保持待 PLATFORM 审核集成。公共依赖/锁文件不由 CD 修改。
- 累计 **41/43 源码+双指南条目**。下批剩余 D16 Workbox（安全限定 Service Worker scope/runner）与 D21 Pagefind（独立 CLI 构建产物）；不要将需要特殊 runner 的场景做成网页伪终端。

---

## 第九批 / 2026-10-27 — D16 Workbox 与 D21 Pagefind：隔离构建型 Node SDK 工作坊

- runCount：**9/24**。从集成 `feat/library-lab@101315e3bdf299047f9c2a39aa670ed59570ec4a` 创建独立 `feat/library-lab-cd-wave9`；上一批 #35 仍为 Draft，二者修改的库目录互不重叠，PLATFORM 合入时必须合并两批 progress 的历史追加内容，不得以本进度文件覆盖 #35 后续新记录。
- **D16 Workbox 7.4.1（MIT）**：真实 `workbox-build.getManifest/generateSW` 本地构建；基础预缓存、限定公开 RSS GET 的 NetworkFirst 缓存、离线 fallback 三层入口。每次在 `os.tmpdir()` 的随机专属目录生成实际 sw.js，显式排除 private 资源，skipWaiting/clientsClaim 为 false，**绝不注册到主站或浏览器 root scope**。生成成功只证明 Node 构建，不代表浏览器 SW install/activate/fetch/offline 可用。
- **D21 Pagefind 1.5.2（MIT）**：真实 `pagefind.createIndex/addHTMLFile/addCustomRecord/addDirectory/getFiles/writeFiles/deleteIndex`；两篇静态 HTML、带元信息与分类的 RSS 笔记、静态目录扫描三层入口。生成 bundle 于随机临时目录，Node CLI 结束释放 native indexer；没有伪造浏览器搜索，也不把静态索引当成 ACL。
- 两条均为 `executionKind=node-ci`，不强迫 React 页面执行 Node 程序；每条都有 library.json、guide.md、agent.md、AGENTS.md、verification.json、examples/workshop.mjs、basic/business/advanced.mjs、tests/sdk.test.mjs，合计 **20 个条目文件，6 个分层场景**。实际运行源码和展示源码是同一文件，配套中文说明与 Agent 迁移规范；本批原创示例基于官方文档重新实现，标 `recreated`，不声称恢复历史运行证据。
- 使用 GitHub Git Tree 递归核对：2/2 manifest JSON 可解析、2×3入口声明及所有 sourceFiles 存在、10份 .mjs 在 V8 异步函数解析器中**静态语法 10/10 无错误**。这是静态结构和语法检查，不是 Node 官方 SDK 真正运行。`sdk/build/browser` 在 verification.json 均为 **NOT_RUN**；npm依赖、pnpm-lock、真实生成的 sw.js/index bundle、完整TypeScript、Vite/Chromium 尚未在可用环境执行，不能标 PASS。
- 第九批独立 worker PR 必须 base=`feat/library-lab`，PLATFORM 负责审核合并。此 CD 通道仅修改 `entries/D16-workbox/**`、`entries/D21-pagefind/**` 与 `progress/CD.md`，未触碰公共 package/lock/CI/生成索引、main、PR#3 或其他组。

### dependencyRequests — 由 PLATFORM 单一 Owner 实际安装和验收

|包|目标版本|使用/许可与来源|集成前必须验证|
|---|---|---|---|
| `workbox-build` | `7.4.1`，devDependency，MIT | https://developer.chrome.com/docs/workbox/modules/workbox-build | Node>=20；真实 generateSW/getManifest；独立 Service Worker scope 浏览器隔离，主站不得被控制 |
| `pagefind` | `1.5.2`，devDependency，MIT | https://pagefind.app/docs/node-api/ | native binary 实际安装/执行，完整 bundle 输出、浏览器 search/result.data、中文索引及部署子路径 |

- 另请 PLATFORM 将 D16 的三个 CLI 入口、D21 的三个 CLI 入口按静态白名单加入其现有 `scripts/cli-runner.mjs`（CD 不可修改该文件），并更新 `packages/library-lab/package.json` 与真实 pnpm-lock；运行定向真实 Node SDK tests，必要时再做独立 browser preview。不得手造 lock integrity，也不得用 Mock SDK 代替原生构建。
- 当前累计**从第八批含 Draft #35 的 41/43 到 43/43 条拥有完整源码、指南、Agent 说明、三层场景**；这是跨待合入 PR 的 authored 数量，不代表集成分支已经接入43条，也不代表有任何新 SDK 实际 PASS。CD 代码覆盖任务达到全量；后续继续审查 SDK/build 证据、修复上游 API 不兼容、验收专用 Worker/索引 runner，而不是反复重新生成目录占位页。

---

## 第十轮（2026-10-27）— 43/43 源码完成后的边界修复

- runCount：**10/24**；基于最新集成 `0733f237ddfbc4ab3204c531255f386c46abec27` 新建 `feat/library-lab-cd-hardening-20261027`。截至本轮检查，原CD PR #35/#39 均已由 PLATFORM 合入，集成分支已有43/43套源码与双指南；这是源码覆盖，不是 SDK/浏览器验收通过。旧 `feat/library-lab-cd` 仍是初始分支，禁止覆盖集成进度。
- **C01 React Hook Form**：修复整串 RSS URL 转小写导致大小写敏感路径/query 假重复；增加独立 `feed-url-policy.mjs` 及类型声明，规范 HTTPS 主机/默认端口、移除fragment并拒绝URL内嵌凭据。重复反馈到字段路径；`useWatch` 监视编辑和字段数组变化，取消旧提交、禁止陈旧保存快照显示。测试 `tests/url-policy.test.mjs` 无第三方依赖，**Node v22.16 本地执行5 PASS/0 FAIL**。这不等于 React Hook Form 实际浏览器通过。
- **D07 TanStack Query**：防止切换租户时旧 `useMutation` 的成功/409文本写入新工作区：在 `onMutate` 的异步取消操作前捕获 tenantEpoch，回调只有相同 epoch 才更新当前视图；旧租户的 query rollback/invalidate 仍执行。A→B→A 也不会恢复旧反馈。尚需真实浏览器快速切换验证。
- **D03 p-limit**：添加真实 `p-limit@7.3.3` SDK test 对有界并发、`rejectOnClear` queued AbortError 结算、running 独立 AbortSignal 取消的断言；与既有平台全局测试互补，不重复修改演示状态机。**SDK未安装，本次仅静态语法检查，NOT_RUN**。
- 这批没有新增第三方依赖请求。PLATFORM 仍负责正式 npm/pnpm 解析、完整 tsc/build/Chromium 和最终 sourceFingerprint 绑定；纯 Node URL 检查不是 SDK PASS。所有源码、manifest、文档和测试修改仅在 `entries/C*`、`entries/D*`，另追加本进度。
- 检查建议：`node --test packages/library-lab/entries/C01-react-hook-form/tests/url-policy.test.mjs`（本轮已跑）；`node --test packages/library-lab/entries/D03-p-limit/tests/sdk.test.mjs`（待安装真实SDK）；`pnpm --filter @reactloom/library-lab catalog:check` / `typecheck` / `build` / Chromium tenant-switch/RHF E2E（待可用环境）。
- 下一队列：真实 SDK/TS 编译错误优先修复 C01/D03/D07；复审跨租户缓存/旧反馈和全组 URL/IME 边界，定位问题才做精准改动，不重复创建43条目录。达到充分可运行证据后交由 PLATFORM 统一验收。


---

## 第十一轮（2026-10-27）— 分页、旧状态迁移与反复重试真实修复

- **runCount：11/24**。从最新集成 `feat/library-lab@363009eb24230fee8c4e5103bcef950ed129a649` 创建 `feat/library-lab-cd-wave11`，未覆盖早期已合并的 `feat/library-lab-cd`；本批 [Draft PR #45](https://github.com/CoderLambert/ReactLoom/pull/45)，base=`feat/library-lab`，由 PLATFORM 单独审核合并。
- **C07 TanStack Table v9**：修复后端缩减结果时仍停留在已越界分页的问题，使用真正被演示源码导入的 `examples/page-policy.mjs` + `.d.mts`，检测 total 变小后校正 pageIndex 并发新请求；新请求清除旧行，禁用加载中翻页；加「模拟后台缩减到2条」按钮；切换 Demo 层级恢复当前 pageSize；中文 IME Enter 不误提交。三层 Demo sourceFiles 与示例代码保持同源。
- **D10 Zustand v5**：v1→v2 persist.migrate 现在调用 `examples/migration-policy.mjs`，仅接受旧 schema 的布尔字段和合法枚举，字符串 `"false"`、未知版本、错误形状不会被类型断言带入持久状态；drop token/tenant。补 `.d.mts`、纯策略 Node tests 以及需要真实 Zustand 的 SDK middleware 回归测试定义；同步三层源码清单。
- **D08 Ky / D09 Axios**：连续点击 GET 503 教程按钮时，各自重新启动一次本地 fixture 的初次 503，因此第二次及更多次点击仍会通过真实 SDK 的重试路径，而不是直接 200。此重置仅存在于业务内存 fixture，不控制实际网络端点；补充指南/Agent 使用约束。
- 开发代码实际提交：C07 `1a03c4ab15d7d05610852d8167af427b496d81e9`；D10 `3ad1205af8a5c90fa3c54b18251e7b7c896ecf04`；Ky/Axios `3e4a52ae2a88a3f75ec2107446cf2aa6ced8a261`。本次变更在进度提交前 GitHub compare 为 **21/21 路径全部属于 CD 条目所有权**；未修改任何公共平台/lock/CI/main/PR#3。
- **实际执行**：Node `v22.16.0`，对从 GitHub branch 按 blob SHA 逐字核对后重建于 `/mnt/data/cd_wave11_exact` 的两个纯策略测试运行 `node --test <C07/tests/page-policy.test.mjs> <D10/tests/migration-policy.test.mjs>`，**9 PASS / 0 FAIL**；对四份 Node 文件运行 `node --check` 无错误。使用 `git hash-object` 核对 4 份本地源文件的 blob SHA 分别为 `92b7bff0` / `0c46d5f9` / `9c67bf32` / `61ea5d1a`，均与 GitHub 同一文件 SHA 相符。本结果只证明这四份**无 SDK 的真实源文件**，不是 React UI 或 SDK 完整验收。
- **无法执行**：仅一次网络可达性检查 `curl -IL --max-time 6 https://registry.npmjs.org/axios` -> `Could not resolve host: registry.npmjs.org`；本环境没有项目依赖。真实 C07 Table v9、D10 Zustand middleware、D08 Ky、D09 Axios `sdk` 测试以及应用完整 `typecheck`、`build`、Chromium **NOT_RUN**；不把已有 package 声明或静态文件作为 SDK PASS。现有 verification.json 的 sdk/build/browser 状态保留 NOT_RUN。
- **dependencyRequests：本轮无新增**。仍依赖 PLATFORM 既有 `@tanstack/react-table@9.2.4`（MIT）、`zustand@5.0.16`（MIT）、`ky@2.2.0`（MIT）、`axios@1.20.0`（MIT）四个目标版本的正式 pnpm 安装/Peer/许可复核及锁文件；CD 不修改 package 或 lock。
- 源码/指南/Agent/三层入口继续为 **43/43**，不能据此宣称SDK验收完成。下一队列：PLATFORM 集成后先运行该四库真实 SDK、typecheck、生产构建及 C07 越界/IME、D10 hydrate、两次 503→200 浏览器路径；如持续无法安装，再挑无需公共文件的 C/D 严重生命周期缺陷和纯策略可执行测试补齐；最终按 sourceFingerprint/命令/日志绑定证据，不用历史 PASS。


---

## 第十二轮（2026-10-27）— RTK Query 缓存身份、Dexie 迁移和 Comlink 故障生命周期

- **runCount：12/24**。前一 PR #45 已由 PLATFORM 合入集成分支；本轮从最新已读取的 `feat/library-lab@e9cc2100e1fc4dfeb6a929534c60aab87c700326` 创建 `feat/library-lab-cd-wave12`，Draft PR [#48](https://github.com/CoderLambert/ReactLoom/pull/48)，base=`feat/library-lab`，未合并 main 或覆盖旧 `feat/library-lab-cd`。
- **D13 RTK Query**：以真实 SDK `useListQuery().currentData` 防止当前查询中显示旧租户成功数据；按 `[tenant,search]` 重建组件订阅，卸载时取消真实 mutation 请求句柄并用 epoch 阻止旧成功/409消息回写。增加搜索草稿/提交与 IME Enter 保护；mutation 仅成功时 invalidatesTags，409不无谓刷新。新增真实 SDK 两租户失效验证源码（未执行）。
- **D15 Dexie**：使用实际演示代码导入的 `examples/rollback-policy.mjs` 比较事务回滚前后完整业务字段，不再只看行数。切换 Demo 等级后关闭旧 Dexie 连接、废弃旧异步响应，删除失败显式提示；新增带类型声明的同源辅助模块及纯 Node 回归。真实 v1 fixture 明确包含无 `read` 字段的 `rss-legacy`，v2 `.upgrade(...modify)` 补字段并显示 `migratedLegacyRead`；对应 SDK 测试加入字段迁移断言而非仅核对版本/索引。
- **D18 Comlink**：Worker 原生 `error`/`messageerror` 加入 RPC/取消竞速；`releaseProxy` 失败也在 finally 执行 `terminate()`，并显式拆除错误监听器。新增实际 Comlink+Node MessageChannel/transfer/proxy 回调测试源码（未执行）。
- **本轮源码提交**：`37f343946252ce61797a042c552e2f76fa8dcd1f`（Dexie rollback）、`cc59ca7aa38bbc5f58c6e966f094ab62b8aed4e9`（RTK Query）、`c0708409b87dfec04e4775a0747f4592646cf7cb`（Comlink）、`6e051199d428ae5a4633d69eba4bbc7f504c6f82`（Dexie legacy migration）。本次 progress 提交接续在后，实际 PR head 以 GitHub 为准。
- **真正执行的命令/结果**：Node v22.16.0，本地仅重建 D15 两份纯策略源码并对照 GitHub Git blob SHA **`8c706239750b3b30e80239b0eba40c63a0d4efd2`**、**`e878e7b0a2353d7382c61a22bb983d1359d3cae6`** 完全一致；`node --check` 两份模块通过；`node --test packages/library-lab/entries/D15-dexie/tests/rollback-policy.test.mjs`：**4 PASS / 0 FAIL**。此 PASS 只证明无 SDK 的回滚字段比较逻辑，**不证明真实 Dexie 事务或迁移成功**。
- **未执行 / 不能继承历史 PASS**：D13/D15/D18 `tests/sdk.test.mjs`（需要已安装目标 SDK）、完整 TypeScript 类型检查、Vite 生产构建、Chromium IME/跨租户切换/IndexedDB versionchange/Worker 退出：均 **NOT_RUN**。既有 npm DNS 和 GitHub runner 无步骤故障未在本轮重复请求；仍需要 PLATFORM 的真实 lockfile 与可用执行环境，不能将源码存在或 Mock fixture 算验收。原 verification.json 的 SDK/build/browser 状态保持 NOT_RUN，最终结果必须按 sourceFingerprint+命令+持久化日志绑定。
- **改动范围**：合计 16 个条目文件（D13/D15/D18）+ 本进度文件；公共 `src/scripts/tests`、根/本包依赖及锁文件、CI/目录索引、main、PR #3、旧模板、公开部署均未修改。已接入的 **CD 源码/双指南/三层 Demo 保持 43/43**，本轮新增实际 SDK PASS 为 0，不等于 43 个 SDK 运行验收完成。
- **dependencyRequests**：**本轮无新增包**；继续请 PLATFORM 核实并安装现有 `@reduxjs/toolkit@2.13.0`（MIT）、`react-redux@9.3.0`（MIT）、`dexie@4.4.7`（Apache-2.0）、`fake-indexeddb@6.2.6`（dev，MIT）、`comlink@4.4.2`（Apache-2.0），检查真实 API/peer/锁文件，不由 CD 手改 package/lock。
- **下一队列**：PLATFORM 集成 PR #48 后优先执行 D13/D15/D18 真实 SDK 定向测试、typecheck/build、浏览器 A→B→A、IME、删除重试、Worker crash/取消。CD 有执行环境后针对真实失败精修；仍被阻塞时可独立复核 D17 Yjs 断线收敛/快照、D16 Workbox 离线缓存所有权，保留尚未完成的浏览器/隔离运行门槛。不会重复重新创建 43 项。


---

## 第十三轮（2026-10-27）— 离线缓存、静态索引、CRDT 数据边界加固

- **runCount：13/24**；从最新集成 `feat/library-lab@0b98b4ef4accd16ab3d7278d8181568c77dc6476` 新建 `feat/library-lab-cd-wave13`。上批 #48 已合并；本批复用独立分支并创建 [Draft PR #51](https://github.com/CoderLambert/ReactLoom/pull/51)，base 仍为 `feat/library-lab`，绝不合 main。
- **D16 Workbox**：原 runtimeCaching 只检查 URL，因此 Cookie 认证的同源默认请求可能命中所谓“公开缓存”。改用可被 Workbox `generateSW` 序列化的自包含 `RouteMatchCallback`：强制 `GET`、精确 `https://lab.example.test/__library_lab_workbox__/api/public/rss`、`request.credentials === 'omit'`，拒绝 Authorization/Cookie/Proxy-Authorization 头；默认 same-origin/include 凭据请求不缓存。配置真正引用 `examples/cache-policy.mjs`，新增 SDK 断言和 Node 纯策略测试。此检查不保证服务器输出确实公开，必须继续独立 origin 的实际 SW 浏览器验收。
- **D21 Pagefind**：新增 `examples/publication-policy.mjs`，真实 Node workshop 的 HTML 页面和自定义 RSS 记录在交给 Pagefind 前必须显式标记 `visibility: 'public'`、使用允许的站内路径、具有标题和正文；`documentHTML` 的文本转义防止把未来 CMS/RSS 内容拼成可执行 HTML。新增公开白名单/路径拒绝/HTML 转义测试。仅有内容标志不等于可信 ACL，构建前仍要从可信发布状态审核。
- **D17 Yjs**：实际 `Y.Doc` 同步函数使用 tenant/document/format/64 KiB 上限的二进制 envelope，先取双向 state vector 增量、后逆序应用，进阶按钮重复投递同一 update 以展示 V1 的幂等收敛；组件捕获异常显示拒绝原因。另加 `.d.mts` 类型、纯 policy 测试及对真实 `Y.applyUpdate` 乱序/重放/跨文档拒绝的 SDK 测试源码。envelope 是本地教学约束，**不能替代服务器验证租户/文档权限**。
- **实际提交**：`a4cdd70cda3918a7d6651f9df2ca9e2026379165`（D16/D21）、`d41f0225861492f6df467bb5a4ab9bd906c985bc`（D17）。GitHub compare `0b98b4e...feat/library-lab-cd-wave13` 确认进度提交之前 **21/21 修改路径全属于 CD 条目授权目录**；D16/D17/D21 各三个 demo 的 sourceFiles 与入口 **9/9 在 Git tree 中存在**。新增测试是原有 SDK 套件外独立策略，不用纯逻辑冒充 SDK PASS。
- **真实执行**：Node `v22.16.0`；从工作容器复制纯逻辑文件及对应测试到同样目录结构，六份文件分别用 Git blob `git hash-object` 对照 GitHub 最新内容完全一致（D16 源 `15ea37e1`/测 `ddef3499`；D21 源 `760aca1e`/测 `c541e5a8`；D17 源 `4918c94b`/测 `e4dcdf44`）。实际运行：`node --test packages/library-lab/entries/{D16-workbox/tests/cache-policy.test.mjs,D21-pagefind/tests/publication-policy.test.mjs,D17-yjs/tests/update-transport.test.mjs}`，**9 PASS / 0 FAIL**。仅验证无 SDK 的安全决策逻辑，并非目标 SDK、浏览器或者完整 app 的执行证据。
- **未运行/阻塞**：本地缺 `workbox-build`、`pagefind`、`yjs` 等安装，单次 `getent hosts registry.npmjs.org` 检查显示 DNS 不可用；不重复网络安装尝试。D16 SW 真实生成与 Fetch/cache、D21 native indexer 和浏览器搜索、D17 `Y.applyUpdate` 真正运行、完整 TypeScript/Vite build、Chromium **NOT_RUN**；所有条目 `verification.json` 的 SDK/build/browser 状态保留 NOT_RUN，不伪造 fingerprint/PASS。平台 lockfile 和运行环境仍为外部集成条件。
- **dependencyRequests：本轮无新增**。已有 `workbox-build@7.4.1`（MIT）、`pagefind@1.5.2`（MIT）、`yjs@13.6.33`（MIT）目标版本在 PLATFORM 清单中；需其安装真实 npm 包、锁文件并核对 API/许可。没有编辑依赖、锁文件、公共 src/scripts/CI、生成索引或旧模板。
- **累计**：CD 源码/指南/Agent/三个层级仍覆盖 **43/43**，本轮新增 SDK PASS 为 **0**。PLATFORM 审核 PR #51 并集成后再执行真实 SDK 与 Browser 门禁。下批优先修真实 SDK 运行错误与 Workbox/静态索引隔离；环境继续阻塞时，CD 独立审计 C15/C16 日期时区边界或 D17 断线后同步收敛（不重复构建已经完成的条目）。


---

## 第十四轮（2026-10-27）— 网格并发编辑、p-queue 队列结算与早期年份日历

- **runCount：14/24**。从已合入 #51 后的最新集成 `feat/library-lab@66479e8a2d3e27d65c3c581093822cb4baf6c00d` 派生 `feat/library-lab-cd-wave14`，只写 C08、D04、C06 三个条目与本进度，不改 public/platform/lock/CI、main、PR #3 或旧模板。PR base 必须为 `feat/library-lab`，交 PLATFORM 审查。
- **C08 AG Grid Community**：新增真实 React 示例导入的 `examples/edit-policy.mjs`（带 .d.mts）；`onCellEditRequest` 现在携带 stable feed ID + expected revision 做 compare-and-swap，模拟 409/过期编辑明确拒绝；刷新快照按 ID 保留比服务快照新的本地状态、且不复活删除行。新增真实 UI 按钮模拟旧 revision。更新三个 demo 的 sourceFiles、指南、Agent 和 Node 回归。
- **D04 p-queue**：修复官方明确警告的 `clear()` 导致等待中 add Promise 永不结算的风险：统一先 `pause()` 后共享 `AbortController.abort()`，已提交的 add 仍由 `Promise.allSettled` 消费；level 切换取消旧队列并恢复 UI；同步 ref 防止连点启动重建队列。真实 SDK 测试增加暂停时取消运行中+等待中任务的断言，**未安装未执行**。
- **C06 IMask**：分离复用实际源码的 `calendar-policy.mjs`（.d.mts），通过 `setUTCFullYear` 避免 `Date.UTC(0..99)` 隐式映射到1900年代；验证闰年、世纪年、0000拒绝和 DST 日历/instant 分离。更新三个 Demo sourceFiles、指南与 Agent。
- **真实执行**：Node v22.16.0，对 C08 和 C06 同源纯 JS 策略在隔离容器运行 `node --test`：**7 PASS / 0 FAIL**，两份 .mjs `node --check` PASS。策略未 Mock SDK，但也不导入 AG Grid、IMask、p-queue，**不得**计为 SDK PASS；新的 D04 SDK 测试定义尚未执行。
- **NOT_RUN/BLOCKED**：三库实际官方 SDK Node 测试、TypeScript full typecheck、Vite build、Chromium 编辑、光标/IME、队列取消实测仍未运行；当前环境缺依赖和 pnpm，历史 registry DNS/Runner 不可用。未复用历史假 PASS； verification.json 原 sdk/build/browser 均保持 NOT_RUN。按 PLATFORM 要求最终以 sourceFingerprint + 命令 + 持久日志绑定验收。
- **dependencyRequests：本轮无新增包**。沿用 AG Grid Community `ag-grid-community@36.2.0`/`ag-grid-react@36.2.0`（MIT）、`p-queue@10.0.0`（MIT）、`imask@7.6.1`/`react-imask@7.6.1`（MIT）；需要 PLATFORM 统一确认实际安装版本/API、React 19 peers 与根锁文件。
- **CD 43/43** 条目继续具备源码+指南+Agent+三层示例；这只是源文件覆盖，不能当 43 个 SDK/build/browser PASS。下一队列：PLATFORM 集成并在可用 Runner 上运行 C08/D04/C06 SDK+typecheck/build/浏览器；聚焦 C08 编辑并发 409 和快慢刷新、D04 cancel while paused、C06 闰年/DST/IME，不重造现有条目。如 SDK 出现确定兼容错误再精修。

### 第十四轮 GitHub 交付定位与本次检查的精确范围

- Draft PR [#54](https://github.com/CoderLambert/ReactLoom/pull/54)，base=`feat/library-lab`，首个完整变更提交 `b5afcdc0f6b591a4db58ed1752da36fcea83e29e`，等待 PLATFORM 审核集成；仅由 PLATFORM 合并，不合 main。
- GitHub compare 基于 `66479e8a2d3e27d65c3c581093822cb4baf6c00d`：**19/19 变更路径均在 CD 所有权**。C08/C06 各有 3 层复用同一组件的 sourceFiles，并包含新加入的真实 helper 与类型声明；D04 仍使用已有三层真实 PQueue 组件。
- 将提交后的源文件重建于隔离目录，`git hash-object` 分别与远端 Git blob SHA 一致：C08 `edit-policy.mjs=58b333e75692df5deda2d327088ae3307e6a65c6`、`edit-policy.test.mjs=8cea41aae44f3524f46f698d31966b557d5a2632`；C06 `calendar-policy.mjs=0e545a10368c7ec19392a263790d7215cf0dad53`、`calendar-policy.test.mjs=38591a7dd4d954dd0e6575474b5ed10f23f0faeb`。
- `node --check` 对上述 **4 个精确文件**无语法错误；`node --test` 对两个策略测试文件 **7 PASS / 0 FAIL**。这些不导入官方 SDK；D04 增加的 p-queue SDK 测试，以及 TS/构建/浏览器仍为 `NOT_RUN`。未更改 verification.json 的结果为假 PASS。


---

## 第十五轮（2026-10-27）— DST 时间歧义与十进制账单正确性

- **runCount：15/24**；从最新集成 `feat/library-lab@9a5778a97970119a4d811e139d81038f66042ec2` 独立创建 `feat/library-lab-cd-wave15`。上一 CD #54 已由 PLATFORM 合并，本轮保持 [Draft PR #58](https://github.com/CoderLambert/ReactLoom/pull/58) 的 base=`feat/library-lab`，不合并 main。
- **C14 date-fns**：新增由实际 React 示例导入的 `examples/instant-policy.mjs` 和类型声明，带明确 UTC 偏移的秒级事件先校验，再通过真实 `date-fns/parseISO` 转换。拒绝非法日历日（含11/12月）、2月30、世纪年闰日、缺少时分秒、无偏移、`-00:00`（偏移未知）、超过 ±14:00 的偏移、24:00 与秒=60；新增纯 Node 策略及真实 SDK 测试源码。
- **C15 Day.js**：`examples/offset-instant.mjs` 真正调用 Day.js + timezone，核对事件自带 UTC 偏移与具名 IANA 时区转换后的实际本地日期、时分及偏移是否一致；两个 2026-11-01 01:30 回拨时刻均可独立表达，2026-03-08 不存在的 02:30 和错误偏移明确拒绝。高级 Demo 增加两个可点击实战场景；SDK 回归源码尚未执行。
- **C16 Luxon**：新增独立 `wall-time-policy.mjs` 严格年月日/时分校验及真实 SDK `wall-time.mjs`。从本地墙上时间解析后回查，拒绝 DST 春季缺失时间；使用 `DateTime#getPossibleOffsets` 并强制选择回拨重叠时刻的 `-04:00` 或 `-05:00`，不默默依赖默认猜测；完整高级交互、声明和双层测试源码同步。
- **D05 decimal.js**：提取单一真实计算实现 `examples/invoice.mjs`，UI 与真正 SDK 测试复用它，金额输入由 `amount-policy.mjs` 约束为十进制字符串。展示 0.335×3 在“先舍入行小计”=1.01 与“先舍入单价”=1.02 的对照；用户修改金额、数量、税率时立即废弃旧账单和旧错误。明确不能把示例舍入阶段当成所有税务规则。
- **实际 GitHub 提交**：C14 `ae44658011ea8bf0499283b225b3208c059b2435`、C15 `d4629ca548028163d1b3841cc1b93e9d6bb6ae70`、C16 `3fd60a34dbe16c1ec5d906e2d630a8f33a277985`、D05 `12d59fab86ba4aac7af230ae145ba778c1c2d332`、C16 交互初始值修复 `11f5f5b2a9be2e234bc194f2c7fe176f815b6ebe`、C14 完整12月校验修复 `50c6109222c5acf305d6c5b2e56501d86f083db3`。本进度提交在这些源码提交之后，PR HEAD 以 GitHub 实际结果为准。
- **实际执行的定向验证**：Node v22.16.0，隔离工作目录中按 GitHub Git blob SHA 重建并逐字核对 C14、C16、D05 各1个纯策略模块及其独立测试，共 **6/6 SHA 一致**；对这6个文件 `node --check` **PASS**；`node --test C14/tests/instant-policy.test.mjs C16/tests/wall-time-policy.test.mjs D05/tests/amount-policy.test.mjs` 为 **8 PASS、0 FAIL**。该结果只证明无 SDK 的真实策略实现，目标 SDK 未 mock、也**没有**实际运行；不得据此填目标库 SDK PASS。
- **结构与写入范围**：GitHub compare 在进度更新前核实 **39/39 修改路径都属于 CD 授权 C*/D* 目录**；四条目各 basic/business/advanced 共12个真实演示声明，`sourceFiles` 全部在 Github 示例文件夹存在，且实际代码导入对应 helper。进度更新后应为 40 个授权路径（额外本文件），由 PR 对比确认。未改根/包级依赖与锁文件、PLATFORM 公共文件/CI、生成目录、其他组、main、PR #3、旧模板，也未公开部署。
- **NOT_RUN / BLOCKED**：本轮 C14/C15/C16/D05 四库 `tests/sdk.test.mjs`、全量 TypeScript typecheck、Vite production build、Chromium DST/账单 UI **均 NOT_RUN**。本地缺项目 SDK/pnpm 锁文件及可用安装路径，`getent ahostsv4 registry.npmjs.org` 单次 DNS 检查失败（exit=2）；没有再次重复网络请求。四条目 `verification.json` 仍维持原来的 SDK/build/browser NOT_RUN，不继承历史验证。
- **dependencyRequests：无新增**。当前平台 package 已声明 `date-fns@4.4.0`、`@date-fns/tz@1.5.0`、`dayjs@1.11.23`、`luxon@3.7.2`、`decimal.js@10.6.0`（对应上游代码与许可仍需 PLATFORM 在正式安装时核对，预期均 MIT），任何锁文件更新只能由 PLATFORM 执行。
- **范围进度：CD 43/43 条源码、中文指南、Agent 与三层真实调用均有覆盖；本轮新增目标 SDK/构建/浏览器 PASS 为 0**，不得视作整体运行验收完成。
- **下一队列**：PLATFORM 首先合入/审核 #58 并提供已安装真实包的 SDK 定向执行环境；逐个运行四库 `node --test .../tests/sdk.test.mjs`、`pnpm --filter @reactloom/library-lab typecheck`、`build`、Chromium 时区选择/DST gap/overlap 与账单 stale output。真实失败出现时 CD 按当前 SHA 精修并绑定源指纹/真实命令/持久化日志；不可用时只独立推进确有复现价值的 C/D 高风险边界，不重复创建43条。


---

## 第十六轮（2026-10-27）— 语言切换异步所有权与 MiniSearch 建索引前隔离

- **runCount：16/24**；本轮从 GitHub 最新集成 `feat/library-lab@b3fa3b0370f50c39078562987400d753390671ee` 建立独立工作分支 `feat/library-lab-cd-wave16`，Draft [PR #60](https://github.com/CoderLambert/ReactLoom/pull/60)，base=`feat/library-lab`，未覆盖旧已合并分支。
- **C17 i18next**（代码提交 `21f9dafdd4459cd3e92daf5addebf2e00c562682`）：此前通过请求编号拦截旧 React setState，但并发 `changeLanguage` 仍可能改变底层实例的当前语言。新增实际示例导入的 `language-switch.mjs` / `.d.mts`，串行化切换并只保留最新等待意图，旧错误不回写，销毁前 dispose。三个 Demo 的源码列表同步，新增真实 i18next SDK 回归测试定义。
- **C18 react-i18next**（提交 `df7bee6b3e2da8d661b5636c82f9ac700440d92c`）：每个 provider 内 LocalizedPanel 的 `useMemo` 队列绑定自己的 i18n 实例，卸载 dispose 且与另一个 provider 不共享，保留实际 `useTranslation` / `Trans` 订阅。补同源策略及真实 Provider SSR/SDK 测试定义。
- **D20 MiniSearch**（提交 `410834d28f0c0f02560d7c2fdebe854a6904bee5`）：修复仅 search 分组过滤、而 autoSuggest 对完整 index 联想可能泄漏其他分类词条的问题。现在预裁剪 scopedDocs，再构建 SDK 索引，ID map、空查询、search 和 autoSuggest 一致；新增真实 SDK 测试定义与纯策略测试。**生产 ACL 必须在索引原始资料进入浏览器前由服务端执行**，UI category 不等同授权。
- 三条均保留 library.json、guide.md、agent.md、AGENTS.md、verification.json、basic/business/advanced 三层实际 SDK 示例及源码展示；变更范围只有 entries/C17、entries/C18、entries/D20、本进度，没有新增条目、没有修改公共平台或生成索引。
- **实际执行**：Node v22.16.0，在独立容器工作区对与 GitHub Git blob SHA 一致的六份纯策略源文件/测试（C17 两份 `625f614d`/`dcff2065`、C18 相同两份、D20 `01db6c5a`/`4a74d498`）运行 `node --test C17/tests/language-switch.test.mjs C18/tests/language-switch.test.mjs D20/tests/scope-policy.test.mjs`：**10 PASS、0 FAIL**。对应 Node `--check` 通过。三个 `.d.mts` 与 Git blobs 一致，独立 `tsc 5.8.3 --noEmit --module nodenext --moduleResolution nodenext` 声明检查通过；不代表完整项目 TypeScript typecheck。
- **未执行**：C17/C18/D20 真实目标库 `tests/sdk.test.mjs`、全量 TypeScript、Vite 构建和 Chromium/IME/SSR hydration 验收均 **NOT_RUN**；本机 `git ls-remote` 单次网络探测报 `Could not resolve host: github.com`，没有重复联网/安装尝试。未用 Mock SDK 充当真实验收，相关 `verification.json` 的 sdk/build/browser 继续为 NOT_RUN。
- **dependencyRequests：本轮无新增**；复用已声明的 `i18next@26.4.3`（MIT）、`react-i18next@17.0.16`（MIT）、`minisearch@7.2.0`（MIT），由 PLATFORM 在实际安装中复核固定版本、license、peer 与 pnpm-lock，本通道不触碰 package/lock。
- **总量：CD 43/43 条源码与指南/Agent/三层演示配置覆盖，0 新增目标 SDK PASS**。下一队列：PLATFORM 审核 #60 后安装固定包并执行上述三条真实 SDK 定向 Node suites，随后 library-lab `typecheck`、`build`、Chromium 连续语言切换/Provider 隔离、分类切换与联想、IME；将真实日志与 sourceFingerprint 绑定。若执行环境仍缺失，CD 只针对可复现的高价值独立 C/D 缺陷继续修复，不重建43条。

---

## 第十七轮（2026-10-27）— Immer 撤销所有权、Gantt 拓扑安全及日历时间输入

- **runCount：17/24**。已先读取 GitHub 最新集成 `feat/library-lab@b1b9d2a6aba6fb8578d40937c931b07d45f7e0cd`、协调/实施合同、本包与根 `AGENTS.md`、类型/目录生成协议、CD 进度以及上批 PR 状态；PR #60 已由 PLATFORM 合并。为避免旧分支覆盖最新集成，建立 `feat/library-lab-cd-wave17`，Draft [#62](https://github.com/CoderLambert/ReactLoom/pull/62)，base=`feat/library-lab`，不合 `main`。
- **D06 Immer**：修复 `rollback()` 之前在 `setFeed(current => applyPatches(current, undo.current ?? []))` 中延迟读取 `undo.current`，但随即将 ref 清为 null，导致 React 批量更新时撤销失效。现在由实际组件导入 `examples/patch-ownership.mjs` 并同步认领 inverse，再将其闭包捕获到异步 updater；重复撤销不能消费新的 Patch 批次。真实 Immer SDK 回归测试源码同步，但并未执行。
- **C13 Frappe Gantt**：从 TSX 中提取并真实导入 `examples/plan-policy.mjs`，使用拓扑遍历拒绝 A→B→C→A、多节点循环、缺失/重复/自依赖、重复任务 ID、非法日历日期和非有限数值进度；提供「模拟依赖闭环（不保存）」交互。移除原来的恒真 SDK 测试。保留复制后传入真实 Gantt 的挂载路径；SDK 本身存在的监听器卸载疑虑未在缺浏览器时声称修复。
- **C12 FullCalendar v7**：实际演示统一导入 `examples/calendar-policy.mjs`，区分日历日与带 UTC offset 的 instant，拒绝日期自动进位、未知 `-00:00`、无偏移时间和不合法偏移；对无法安全解析的拖拽调用 `info.revert()`。本地事件 ID 由单调序列分配，替代同毫秒可能冲突的 `Date.now()`；仍演示纽约回拨时两个不同的 UTC instant。此策略本身不证明 FullCalendar 对命名时区的浏览器处理正确。
- **代码提交**：[9dde765c5b2158e77470c9b8fadd8721a635a94f](https://github.com/CoderLambert/ReactLoom/commit/9dde765c5b2158e77470c9b8fadd8721a635a94f)。 **同轮收口**：[306d97f46ee381a26b45546a1f73e39e7793116c](https://github.com/CoderLambert/ReactLoom/commit/306d97f46ee381a26b45546a1f73e39e7793116c) 删除 C13 TSX 未使用的 `validCivilDate` import（仍保留模块 re-export），规避 noUnusedLocals 风险。首批 26 个变更文件全部为 C12/C13/D06 授权条目文件，新增三个实际 helper、三个类型声明、三个纯策略测试，三层 Demo 的 `sourceFiles` 全部指向同一套真实导入源。另有本进度文件由本通道维护。
- **源码展示收口**：[275439353c42f57a6a1dfec9048f40241f163358](https://github.com/CoderLambert/ReactLoom/commit/275439353c42f57a6a1dfec9048f40241f163358) 将三个策略的 `.d.mts` 一并加入 3×3 层 Demo 的 `sourceFiles`，展示与复制时不漏迁移 TypeScript 声明；同步修正 C13 旧文档还称“必须加入闭环检测”的过期句子。该收口仅调整 3 个 manifest 与两份 CD 条目说明，不新增 SDK 或外部依赖。
- **真实执行**：Node `v22.16.0`，在隔离目录 `/mnt/data/cd-wave17/exact` 对与 GitHub Git blob SHA 一致的 **六份**纯策略源码/测试执行 `node --check` 和 `node --test packages/library-lab/entries/{C13-frappe-gantt/tests/plan-policy.test.mjs,C12-fullcalendar/tests/calendar-policy.test.mjs,D06-immer/tests/patch-ownership.test.mjs}`，结果 **12 PASS、0 FAIL**。六个 SHA 依次为 C13 `4399793a`/`8a07847d`，C12 `4517461f`/`ca8d1f9b`，D06 `269e39ba`/`003ce517`，均与已提交 GitHub blobs 一致。新增三个 `.d.mts` 文件使用本机 TypeScript `5.8.3` 运行 `tsc --noEmit --strict --module nodenext --moduleResolution nodenext --target ES2022` **孤立声明检查通过**。这不是全项目类型检查。
- **NOT_RUN / 阻塞**：真实 `immer@11.2.9` / `frappe-gantt@1.2.2` / `@fullcalendar/react@7.1.3` SDK 套件、完整 Library Lab `typecheck`、Vite `build`、Chromium 409/revert/DST/StrictMode/Immer UI 回滚均 **NOT_RUN**；当前容器有 Node、TypeScript，但缺 `pnpm` 与目标 SDK 安装。单次 `getent hosts registry.npmjs.org` 无可用解析，不重复网络请求。原 `verification.json` 的 SDK/build/browser 状态保留 NOT_RUN，不将策略测试或孤立 TS 声明冒充官方 SDK PASS。
- **dependencyRequests：本轮无新增包**。既有的 `immer@11.2.9`（MIT）、`frappe-gantt@1.2.2`（MIT）、`@fullcalendar/react@7.1.3` 与 `temporal-polyfill@1.0.4`（需 PLATFORM 按实际安装复核许可/API）仍由 PLATFORM 安装与锁定；本通道未修改任何 package/lock、CI、公共组件、生成索引、其他分组或 main。
- **当前覆盖**：CD 共 **43/43** 个源码/指南/Agent/三层入口（129 个分层选择）已有覆盖；本轮新增目标 SDK / build / browser PASS 为 **0**。覆盖不等于可运行验收。
- **下一队列**：PLATFORM 审核合并 #62；可用依赖环境先执行 C12/C13/D06 的 `tests/sdk.test.mjs`，再完整 `typecheck`、`build` 和 Chromium：同毫秒创建两个事件、DST 重叠时间拖拽/偏移缺失回滚、Gantt 闭环保存拒绝/StrictMode 动态 import 监听清理、Immer 乐观更新→立即撤销。出现实际 SDK/TS 报错后依据固定源码指纹精修，不在 CD 通道伪造 BUILD/SDK PASS。
