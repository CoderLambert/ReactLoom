# 2026-11-18 主控闭环补充

六项本地质量PASS。真实SDK3项、非作者独立过滤/缓存复用/失效409/abort consumer通过；浏览器4项覆盖共享订阅、租户/定向失效409及800ms后稳定、业务IME搜索恢复、官方来源。候选25及独立试用证据见[逐库结果](../../../../openspec/roadmaps/upgrade-library-quality/results/D13.md)。正式收据仍NOT_RUN。下文为作者停写检查点，原浏览器/共享检查待办已由本补充关闭，初始失败仍保留。

# D13 本地验证（2026-11-18）

条目独占改动，不触碰共享文件。实际 SDK `@reduxjs/toolkit@2.13.0` + `react-redux@9.3.0`；RTK Query 随 Toolkit 发布。README 固定提交 `370f7eb6403bdfdb1a2ab5b90fbcfd8eaee7d57b`，原文 bytes 与 metadata 摘要匹配。正式 verification.json 三项仍 NOT_RUN，未提交/推送/发布。

|六项|状态与层级|证据|
|---|---|---|
|技术准确|PASS：真实 SDK 与源码复核|SDK tests 直接导入 UI 的 runtime.ts，覆盖缓存合并、参数隔离、成功失效、409/404、dispose；官方缓存/查询文档与安装包类型匹配|
|解释清楚|PASS：静态内容复核|guide 从 RSS 问题、Redux 选型到 API/store/middleware/Provider/参数键/标签，再到三条操作链与迁移|
|Demo 有用|NOT_RUN：浏览器待主控|独立目标：同参数双订阅、参数隔离/currentData、成功失效与409/取消；真实浏览器提案 validation/browser.spec.ts|
|源码可迁移|PASS：静态 + 源 runtime 执行|完整两源文件，无 Lab 内部导入；guide 列明包版本、React/DOM、TS解析、无需样式/环境/后端，所有 timer/listener/请求/store订阅所有权|
|官方来源可靠|PASS：固定原文 + 实际 HTTP|official/readme.md 为 Toolkit 包官方 README，source-evidence 记录 tree 候选、commit、首页 GET/最终URL/headers；无中文包README，iframe unknown|
|结果可复核|NOT_RUN：浏览器未执行|实际SDK原始日志、格式日志保留，浏览器/共享构建与独立试用待主控冻结候选执行|

cwd `/home/lambert/githubRepos/lambert/ReactLoom`：

- `node --test packages/library-lab/entries/D13-rtk-query/tests/sdk.test.mjs` exit 0，3 actual SDK tests PASS，0 policy tests。日志 validation/sdk.log。使用 Node 26.13.1 原生剥离 runtime.ts 类型，未生成第二份可执行副本。
- 初次 SDK 测试 2 PASS / 1 FAIL 保留 validation/sdk-initial.log。失败为 dispose/reset 后 query.unwrap 可返回 undefined，不能强断言 reject；改为 await 查询 settled，保留 mutation rejection、active=0、cache empty、fixture未写入等实际生命周期断言。实现未为迎合断言伪造错误。
- `pnpm --filter @reactloom/library-lab exec biome check --write entries/D13-rtk-query/examples entries/D13-rtk-query/tests entries/D13-rtk-query/validation/browser.spec.ts entries/D13-rtk-query/library.json entries/D13-rtk-query/official/source-evidence.json` exit 0，日志 validation/biome.log。
- `git diff --check -- packages/library-lab/entries/D13-rtk-query` exit 0。
- typecheck/build/browser NOT_RUN，留给主控输入稳定屏障。浏览器提案覆盖双订阅共用查询、refetch、tenant切换、成功刷新/409不刷新、慢mutation取消、卸载重挂载种子恢复。真实 IME 人工输入另行验收，不冒称合成事件等于真实输入法。

清空缓存只 reset 本 API，不重置 fixture；新 runtime 才重建种子。诊断 reads/mutations/active 统计内存 baseQuery 实际执行，不是外网流量或授权证明。正式收据需获准提交后的当前完整候选。
