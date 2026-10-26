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
