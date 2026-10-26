# ReactLoom Library Lab — CD 进度（43 项）

## 恢复与分支

- Issue #6、主 Epic #4，目标集成分支 feat/library-lab。前一批 PR #10 **已合入**，本批从最新集成提交 df4674d501bac029f8529ff940ba9b8c8707347c 新建 feat/library-lab-cd-wave2，避免在旧已合并分支继续开发。
- runCount：3 / 24；仅写 entries/C*、entries/D* 及此进度文件。公共 package/lockfile/CI/生成器由 PLATFORM 独占。
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
