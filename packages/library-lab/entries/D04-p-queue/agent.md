# D04 p-queue · Agent 使用手册

## 适合哪些任务

多个同源 HTTP 请求需要 concurrency 和严格单位时间窗口上限、优先级、暂停或调度时选 p-queue v10.0.0。只需同时执行 N 个选 D03 p-limit。持久 Job Queue、跨进程保证不在此范围。注意原生 ESM 与 Node >=22。

## 可复用源码

examples/example.tsx 有真正 PQueue 构造、任务入队、AbortSignal、Promise.allSettled、暂停和卸载清理；demo.tsx 只是适配导出。迁移到生产时把本地 sleep 替换为真实 work(item,signal)，遵守实际业务超时/响应类型。

## 必须保留

- 将启动操作放入 add 回调，不提前启动请求；
- 需要速率时同时配置 intervalCap、interval 与 strict；区分 pending/size；
- 一个批次统一队列所有权，不能每次 render 建新队列；
- 每个 add 的 rejection 必须被处理；AbortSignal 传播到真实 I/O；
- **不要**在仍持有队列 Promise 时调用 `clear()`：queued `add()` 将永不结算。卸载、level 切换、用户取消时先 pause 后 `controller.abort()`；已启动的 I/O 必须传播 signal；
- 重试尝试要计入真实外部 API 频率预算，而不是只计一个外层队列任务；
- 大量任务分批生成并监控等待队列，不以并发上限代替内存背压。

## 反例提示

queue.onEmpty 不能当全部任务已完成；priority 不抢占已执行任务；v10 事件 API 是 EventTarget，而非旧 on/off。对 429/503 要在真正 HTTP 层处理 Retry-After、有限重试和幂等性。

## 验收

测试至少断言峰值≤配置并发、任务结果按输入对应、失败局部隔离、取消/clear 后所有 add Promise结算、运行中工作收到AbortSignal、队列停止后无 UI 回写。浏览器用真实 p-queue 验证；Node mock工作函数只能证明SDK调度，不是外部服务性能基准。此版本SDK/build/browser仍 NOT_RUN。

官方：https://github.com/sindresorhus/p-queue/tree/v10.0.0

## 回归重点

立即双击启动不能创建两套队列；level 切换必须结束旧批次并重置 UI；暂停时取消需要结算所有 add Promise（不是只清空 size）。测试 `node --test packages/library-lab/entries/D04-p-queue/tests/sdk.test.mjs` 必须真正加载 p-queue@10，策略/静态检查不能代替。
