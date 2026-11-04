# p-limit 7.3.0 系列｜同时运行数，不是速率也不是线程

Lab 锁定 `p-limit@7.3.3`（MIT）。v7 面向当前 Node。它只限制**同时开始的任务数**。它不限制每秒次数，不去重，不缓存，也不把 CPU 工作搬进 Worker。

根锁文件已经能解析这个包。依赖「DNS 解析不了所以 BLOCKED」的旧笔记作废。没有 `evidence/runs` 收据时，状态仍是 NOT_RUN，不是 PASS。Actions 41779873259 跑过的仓库级测试不能写进本条目。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 直接 `import pLimit from 'p-limit'`。队列策略在 [`examples/job-policy.mjs`](examples/job-policy.mjs)。

- 构造是 `pLimit({ concurrency, rejectOnClear: true })`。`clearQueue()` 会让还没开始的 Promise 以 AbortError 结算，而不是永远挂起。
- 任务在 **limiter 回调内部** 才开始 `pause`。暂停函数监听调用方的 `AbortSignal`。
- basic 6 个任务，其它 10 个。默认并发 2，可以改。advanced 的 4 号任务抛本地错误，其它继续。没有 HTTP。
- `generation` 防止旧批次 `setJobs`。level 变化会 abort、`clearQueue`、清空 UI。
- 取消先 `controller.abort()` 再 `clearQueue()`。`transitionJob` 不允许 cancelled / done / error 回到 running。`cancelUnsettledJobs` 保留已经结束的行，把未结束的标成 cancelled。
- 卸载同样 abort 和 clearQueue。

Node 套件 `tests/sdk.test.mjs` 用真实的 `p-limit` 断言峰值并发、完成顺序，以及 `rejectOnClear`。文件存在不等于已经有收据。

## 1. 四种不同的问题

| 问题 | 工具 |
| --- | --- |
| 同时最多 N 个 Promise | p-limit |
| 每秒最多 M 次 | 令牌桶或 p-queue 的 interval，本库不做 |
| 相同键不要打两次 | 去重表，和并发上限是两件事 |
| 结果可以复用 | 缓存，和并发上限是两件事 |
| 重 CPU 离开主线程 | Worker / Comlink（D18），不是把 async 函数包进 limit |

先把 Promise 全部 `fetch` 再包一层 limit，那些请求已经发出去了。

## 2. 运行模型

```text
limit(async () => work(signal))
        │
   未到并发上限 → 立即执行，activeCount + 1
   已满         → 留在队列，pendingCount + 1
        │
   完成后启动下一个
        │
 clearQueue + rejectOnClear → 队列中的 Promise reject
 abort signal               → 正在跑的 work 自己停
```

`activeCount` 和 `pendingCount` 是读取瞬间的数字。不要抄进 state 之后把它当成队列本身。Lab 只为了展示才写入 `counts`，并且在代际不符时不再写。

一个批次一个 limiter。不要把全局单例 limiter 交给互不相关的页面，否则卸载 A 会清掉 B 的队列。

## 3. 三层

### 基本

6 个本地延迟，并发 2。界面上同时 running 的行数不应超过设定值。返回顺序由 `Promise.allSettled` 等待全部结算，不要求完成顺序等于启动顺序。SDK 测试另断言在并发 2 时峰值就是 2，并且结果按下标排好。

### 业务

10 个任务。可以把并发调高。这里仍然是 `setTimeout`，用来代表「批量拉 RSS 元数据」时的占位。真的去抓 URL 时，把 signal 传给 fetch，并在服务端做 SSRF 限制。客户端的 limit 不会阻止对内网的请求。

### 进阶

4 号失败，其它成功，`allSettled` 让失败不影响已经开始的邻居。取消后：运行中的进入 cancelled（因为 pause reject），排队的被 `clearQueue` 拒绝，然后 UI 用 `cancelUnsettledJobs` 补上还停在 queued 的行。切换 level 等于新的所有权，旧批次不能把行写回来。

## 4. 反例

### 反例 1：先启动再限制

```ts
const tasks = urls.map((url) => fetch(url))
await Promise.all(tasks.map((task) => limit(() => task)))
```

`fetch` 在 map 时已经开始。正确是 `limit(() => fetch(url, { signal }))`。

### 反例 2：把 clearQueue 当成 abort

`clearQueue` 只处理还没开始的。正在跑的函数必须自己看 `signal.aborted`。Lab 两个都做。

### 反例 3：rejectOnClear 仍是 false

队列里的 Promise 可能永远不结算，`Promise.all` 不返回，React 一直停在「运行中」。v7 要把 `rejectOnClear: true` 写进构造参数。取消前先挂上 `allSettled` 或 catch，避免未处理拒绝。

### 反例 4：迟到回调把 done 改回 running

失败或取消之后，慢一拍的 `update(id, 'running')` 不能覆盖终态。用 `transitionJob` 这种单向转换。代际不符直接 return。

### 反例 5：一个全局 limiter

路由 A 卸载时 `clearQueue` 会伤到路由 B。按批次或按页面创建。

### 反例 6：无限排队

limit 不限制队列长度。一次 `map` 一万个 URL 仍会把一万个闭包放进内存。先分页，再 limit。

### 反例 7：用 activeCount 做业务真相

它会变。持久化的「当前在跑谁」以你自己的任务 id 为准。Lab 的行状态是 `jobs`，计数只是展示。

### 反例 8：在限制器外面吞掉错误

`limit(async () => { try { ... } catch { return null } })` 会把失败伪装成成功，峰值测试也看不出来。让它抛，外面 `allSettled`。

## 5. 和 React 的生命周期

effect 的清理必须 abort + clearQueue + 增加 generation。只在卸载时清、不在 level 或租户变化时清，旧结果会画到新页面。

不要在渲染期间创建 limiter。放进事件或 effect，并放进 ref，取消按钮才找得到同一实例。

## 6. 组合

**p-queue**：要优先级、间隔、超时再换。不要两层都限一次还不画出来。

**Query**：Query 负责缓存和窗口焦点重新请求。p-limit 只包在「这一批还没进缓存的 id」外面。不要把 limit 的队列再存进 Query。

**ky / fetch**：signal 传到请求。429 的 `Retry-After` 是另一层，不要靠把并发改成 1 来假装遵守。

## 7. 练习

1. 把并发调到 1 和 4，看同时处于 running 的个数。
2. 开始后立刻取消，确认没有行停在 running 或 queued。
3. 切换 level，旧批次的失败不能写进新列表。
4. 在 Node 里跑 `tests/sdk.test.mjs`，把日志留给 `verify:record`，不要手改 PASS。

## 8. 证据

策略测试不 import p-limit。SDK 文件 import 了真实包。两者都不是浏览器里的按钮证明。

## 9. 资料

- https://github.com/sindresorhus/p-limit
- https://www.npmjs.com/package/p-limit
