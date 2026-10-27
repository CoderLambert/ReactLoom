# ReactLoom Library Lab — CD 进度（43 项）

## 恢复与分支

- Issue #6、主 Epic #4，目标集成分支 feat/library-lab。前一批 PR #10 **已合入**，本批从最新集成提交 df4674d501bac029f8529ff940ba9b8c8707347c 新建 feat/library-lab-cd-wave2，避免在旧已合并分支继续开发。
- runCount：4 / 24；仅写 entries/C*、entries/D* 及此进度文件。公共 package/lockfile/CI/生成器由 PLATFORM 独占。
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
