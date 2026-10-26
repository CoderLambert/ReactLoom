# Library Lab CD 进度（C+D，43 项）

## 恢复状态

- 通道：CD / Issue #6 / 分支 `feat/library-lab-cd`，只拥有 `entries/C*`、`entries/D*` 与本文件。
- 最新实际源码提交：`0850fea24bde059834a3a52fec4accde8c32523d`。
- 初始集成基线：`38ed2d247bd82e4f1422b0e8904973e16bca2972`；当前平台集成分支另有目录索引提交，不要覆盖其公共文件。
- runCount：1 / 24。没有更改根锁文件、运行器、平台源码或其他分组。

## 已落地的条目（此轮不是 43/43 完工）

|条目|交付|内容状态|SDK/编译/浏览器|
|---|---|---|---|
|C01 React Hook Form|三层真实 RHF 订阅表单、useFieldArray 稳定 key、HTTPS 校验、错误回填、AbortController、中文指南及 Agent 手册|recreated / 需独立审阅|NOT_RUN|
|C02 Zod|三层真实 Zod 校验、strictObject、RSS/OPML 判别联合、跨字段 superRefine、输入输出类型与反例|recreated / 需独立审阅|NOT_RUN|
|C21 tailwind-merge|三层 twMerge/twJoin + clsx、组件变体与方向性冲突、中文说明/Agent 指南|recreated / 需独立审阅|NOT_RUN|
|D05 decimal.js|三层高精度对照、采购金额计算、税与 HALF_UP/HALF_EVEN、模块级 Decimal.clone、指南/Agent|recreated / 需独立审阅|NOT_RUN|
|D03 p-limit|在现有3层真实SDK示例上修复取消：AbortSignal + rejectOnClear + clearQueue，保证排队 Promise 可结算；同步 guide/agent|已存在并加固|新版本 NOT_RUN|
|C20 clsx|保留平台已有的3层实际示例和说明；本轮未重复改写|已有示例|沿用之前 NOT_RUN|

注：这里只把 `contentState=recreated` 表示“源码与说明在新项目中重新编写”，**并非 SDK 验证通过**。其余37条 C/D 仍以原有目录/待接入为主。

## 本次验证事实

- 已使用 GitHub connector 实际检查本次 staged tree 的 C01、C02、C21、D03、D05 五个条目：**5/5 拥有 guide.md、agent.md、AGENTS.md、verification.json；15/15 demo sourceFiles 和入口在 Git tree 内存在**。检查对象为新写入的真实Git对象，而非计划。
- 搜索并核对官方接口：RHF v7 的 useFieldArray/错误重置、Zod 4 safeParse/schema、tailwind-merge 3.7.0 的 API 及 Tailwind v4 支持、p-limit 7.3.3 rejectOnClear、decimal.js 10.6.0 Decimal.clone 与 rounding。
- 本轮容器 `curl https://github.com/CoderLambert/ReactLoom.git` 报 `Could not resolve host: github.com`；npm 依赖未安装。**TS类型检查、实际 SDK Node 单测、Vite build、Playwright 都没有执行**，验证标记保持 NOT_RUN，绝不把源文件存在/静态目录检查当成这些测试通过。
- 平台历史 17 项 Node 逻辑测试属于初始公共提交的证据，**不是本次新增四库的测试结果**。

## dependencyRequests（PLATFORM 单一 owner 安装）

|npm package|版本|用途|来源|优先级|
|---|---|---|---|---|
|react-hook-form|7.89.0|C01 三层 React Hook Form 运行时|当前 `templates/spa/package.json` 已使用；https://react-hook-form.com/|P0|
|zod|4.6.5|C02 真实运行时 Schema|当前 SPA 模板已使用；https://github.com/colinhacks/zod/releases/tag/v4.6.5|P0|
|tailwind-merge|3.7.0|C21 冲突合并；兼容现有 Tailwind v4.3|当前 SPA 模板已使用；https://github.com/dcastil/tailwind-merge|P1|
|decimal.js|10.6.0|D05 精确十进制计算|官方 package.json 与 npm 版本；https://github.com/MikeMcl/decimal.js|P1|

现有 Lab manifest 已含 `clsx@2.1.1`、`p-limit@7.3.3`，勿重复新增。
PLATFORM 需核对真实注册表/peer 兼容并统一更改 `packages/library-lab/package.json` 与 `pnpm-lock.yaml`；CD 不做锁文件操作，不手造 lock integrity。

## 后续队列（下一轮直接写代码）

1. 一旦 PLATFORM 同步依赖：对 C01/C02/C21/D05 跑真实 TypeScript/build、SDK 定向测试；据错误修正当前条目源码/guide/agent，再记录有命令/日志的证据。D03 复核 cancel clearQueue 的 E2E。
2. 继续 C14 date-fns（日期/DST 输入与 SSR）和 D01 es-toolkit（纯工具集合场景），选择成熟版本并先做完整三个层次；这两项只编辑各自目录。
3. C07 TanStack Table / D07 TanStack Query：稳定行 ID 与分页/排序、缓存键、取消及 stale-response race；这两项需要平台依赖和运行时集成，先写可独立源码/文档。
4. 每轮至少推进一个完整高价值实现，不重复打印泛泛研究。特殊依赖由 PLATFORM 接收，不覆盖其他队列。

## 交付与边界

CD 当前 PR 目标应为 `feat/library-lab`，不能 main；只由 PLATFORM 审查并合入。遇环境阻塞继续独立任务；所有代码的 SDK/build/browser 状态在实际执行前不得标 PASS，绝不调用收费 API 或公开私有仓库。
