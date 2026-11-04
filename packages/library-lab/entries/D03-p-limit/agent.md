# D03 p-limit — 工程手册

## 适用

限制同时运行的 Promise 数量。不负责 QPS、重试、去重、缓存或 Worker。更复杂的队列看 p-queue。

## 版本

`p-limit@7.3.3`，MIT。使用 `pLimit({ concurrency, rejectOnClear: true })`。

## 迁移

带走 `examples/example.tsx` 的批次所有权和 `examples/job-policy.mjs`。在 limiter 回调里启动真正的工作，并把 AbortSignal 传进去。换成真实请求时不要保留本地 `pause`。

## 不可删的清理

取消和卸载：先 abort 运行中的信号，再 `clearQueue()`。level、租户或批次变化时增加 generation，旧回调直接返回。`transitionJob` 禁止终态回到 running。一个界面批次不要共用别人的 limiter。

## 反例

- 先 `fetch` 再包 limit。
- 认为 `clearQueue` 会停掉已经在跑的任务。
- 关掉 `rejectOnClear`，队列 Promise 不结算。
- 把 `activeCount` 存起来当事实来源。
- 一次排进无限任务。
- 在 limit 内部吞错，外面却以为全部成功。
- mock 掉 p-limit 再写 SDK PASS。

## 测试断言

- 并发 2 时峰值 active 为 2，结果顺序与输入下标一致，结束后 active 和 pending 为 0。
- `clearQueue` 后排队任务是 AbortError，且那些函数没有开始。
- 运行中的任务只在自己的 signal 上取消。
- UI：取消后没有 queued 或 running；切换 level 后旧状态不可写。
- 浏览器按钮和 Node 套件分开记账。

## 真实限制

示例没有网络。客户端并发限制不是 SSRF 防护，也不是速率限制。`activeCount` 只在读取的那一刻有效。

## 证据

没有收据不要写 PASS。DNS 或锁文件不再是阻塞理由；缺的是本条目的执行收据。
