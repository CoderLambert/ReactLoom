# D04 p-queue — 工程手册

## 适用

同一进程里要同时限制并发和启动速率，并且需要暂停、优先级和积压观察。批量任务的调度器用它。单次 HTTP 的超时和重试交给 Ky 或 Axios。缓存交给 Query。

只限制同时执行数时用 p-limit。崩溃后续跑用持久队列。队列不加速 CPU，也不提供服务端配额。

## 版本

`p-queue@10.0.0`，MIT，ESM，Node `>=22`。v10 用 `EventTarget`，没有 `.on()` / `.off()`。

Lab 示例从包的默认导出构造 `PQueue`。不要用 v7–v9 教程里的事件 API 改这份源码。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走队列构造、`sleep` 对 signal 的遵守、generation，以及 `Promise.allSettled`。`demo.tsx` 只是重导出。

basic 只传 `concurrency`。business / advanced 额外使用 `interval: 600`、`intervalCap: 3`、`strict: true`。优先级写在仍会等待的任务上。

取消保持现在的写法：`pause()` 加上共享 `AbortController`。不要改成 `clear()` 之后还 `await Promise.allSettled`。

## 不可删的清理

切换 `level` 和卸载时递增 generation，暂停队列，abort，并丢掉 `current`。过期 token 不能 `setJobs`。

启动前若已有活动队列，直接返回，避免连点叠两批。

`queue.add` 的选项和 `sleep` 使用同一个 signal。abort 必须让排队中的 Promise 拒绝，界面才能从 `queued` 走到 `cancelled`。

## 反例

- 循环内 `await queue.add`。
- `queue.add(fetch(url))` 在入队前发请求。
- v10 调用 `queue.on`。
- 把固定窗 `intervalCap` 当成滑动窗口，却不设 `strict: true`。
- 重试循环包在同一次 `add` 里。
- `clear()` 之后指望 `allSettled` 结束。
- `onEmpty()` 时释放仍被运行中任务使用的资源。
- 一次提交十万个闭包。
- 用优先级抢占已经运行的任务。

## 测试断言

- 真实队列的峰值不超过 `concurrency`，失败任务仍让整批结算。
- 取消发生在启动之前时，排队的 `add()` Promise 结算。
- 暂停期间 abort，运行中的和排队的都取消，并且不调用 `clear()`。
- 第 4 个任务的业务错误不取消其他格子。
- generation 变化后不再回写。
- `tests/sdk.test.mjs` 导入真实 `p-queue`。无收据则 NOT_RUN。

## 真实限制

延时是 fixture。没有外部 HTTP、没有重试预算、没有 `Retry-After`、没有持久化。`priority` 只在等待队列里比较。

浏览器后台计时器会漂移，示例的 600ms 窗口不是移动端 SLA。React Strict Mode 会跑清理函数，所以清理必须幂等。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
