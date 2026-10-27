# D03 p-limit — Agent 实施手册

解决同时运行的 Promise 数量，不解决每秒速率、自动重试或线程池。基线 p-limit 7.3.3 / MIT；Node v7 系列需20+。核对目标项目环境与锁文件，不直接升全仓依赖。

先读 `examples/example.tsx`：可迁移核心是 `limit(() => work())`、逐项结算、AbortSignal 与 generation。React 界面只是状态展示，目标项目可提取为框架无关 service。

必须保留：在 limiter 回调内启动工作；一批或一个共享服务只拥有预期的 limiter；真实工作监听 signal；卸载/新批次后旧回调不得回写；结果部分失败使用 allSettled 或明确事务策略。

禁止：先启动所有 fetch 再包装；把 activeCount 保存后当队列事实；把 clearQueue 当作正在运行任务的 abort；假设 async CPU 工作已离开主线程；一次创建无限排队任务。

运行：`pnpm --filter @reactloom/library-lab test:sdk`、`typecheck`、`build`。SDK 测试断言实际最大并发、返回顺序与拒绝；浏览器再测开始/取消/卸载，尤其确认 rejectOnClear=true 下 queued Promise 能结算且没有旧结果回写。可 mock 业务延迟，不能 mock p-limit 后算 SDK PASS。

当前依赖安装 DNS BLOCKED，SDK 与浏览器 NOT_RUN。相关库 D04 p-queue 用于更复杂队列需求，D18 Comlink 用于 Worker 通信但并不替代调度。

官方：https://github.com/sindresorhus/p-limit

## 定向实际 SDK 检查

`node --test packages/library-lab/entries/D03-p-limit/tests/sdk.test.mjs`：真实 `p-limit` 上限、clearQueue 的 queued AbortError 结算，以及 running 使用单独 AbortSignal 的边界。浏览器仍须验证任务取消后旧结果不回写；不能凭 Node 测试通过宣称 React 生命周期验收。

## 第22轮终态/层级切换迁移

同时迁移实际 import 的 `examples/job-policy.mjs` 和 `.d.mts`。使用 `transitionJob` 防迟到回调让 cancelled/done/error 回到 running；使用 `cancelUnsettledJobs` 保留已完成条目。level/组件会话变化必须 abort + `clearQueue` + generation，旧 Promise 不可回写新视图。该 UI 策略只是状态呈现，不会自动中止真实 Fetch；实际业务必须传递 AbortSignal。单测纯策略与真实 SDK 分别报告。
