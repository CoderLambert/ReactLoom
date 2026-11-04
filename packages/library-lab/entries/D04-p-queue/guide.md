# p-queue 10.0.0｜并发槽、滑动窗口和可结算的取消

Lab 锁定 `p-queue@10.0.0`（MIT，ESM，Node 声明 `>=22`，运行时依赖 0）。它是当前进程内存里的任务队列：能限制同时运行的数量，也能限制一段时间里新启动的次数，并支持优先级、暂停和事件。进程退出，队列消失。它不持久化、不去重、不缓存 HTTP、不代替 BullMQ。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。页面创建真实的 `PQueue`。每个任务是本地 `sleep`，会监听 `AbortSignal`。不发外部 HTTP。

- basic：只设 `concurrency`（1、2 或 3），提交 7 个任务。界面显示运行数、等待数和峰值。
- business：同一并发，再加 `interval: 600`、`intervalCap: 3`、`strict: true`。第 8 个任务（下标 7）`priority: 5`，只影响还在等待的顺序。12 个任务。暂停调用 `queue.pause()`，恢复调用 `queue.start()`。暂停不中止已经在跑的 sleep。
- advanced：第 4 个任务抛出固定业务错误，其余继续 `Promise.allSettled`。取消走共享 `AbortController`，并先 `pause()`。源码注释写明不要用 `clear()`：在这条实现路径上，`clear()` 会让仍在排队的 `add()` Promise 停在未结算状态，`allSettled` 因此结束不了。

离开层级或卸载时，effect 增加 generation、暂停队列并 abort。代际不一致的 `setState` 直接返回。连点启动在 `current.current` 已存在时被挡住。

没有挂载：本地 HTTP 假服务、按次重试、`Retry-After`、`EventTarget` 监听器演示、`onSizeLessThan` 反压生成器、自定义 `queueClass`。那些仍是生产教学。v10 文档里的 `clear()` 语义以官方 readme 为准；Lab 选择的可观察路径是 abort，而不是 `clear()`。

## 什么时候用

需要长期存活、可暂停、可观察积压，并且同时卡住并发和启动速率时用它。批量拉 RSS 元数据、批量处理图片、同一进程里的外部 API 保护都属于这类。

只要“同一组 Promise 最多 N 个在飞”，用 D03 p-limit 更小。页面数据的新鲜度用 TanStack Query。CPU 密集计算用 Worker，队列仍在调用它的线程上跑。跨进程、崩溃后续跑、至少执行一次，用持久队列加幂等键。

| 场景 | 选择 |
| --- | --- |
| 最多 4 个 HTTP 同时飞 | p-limit |
| 最多 N 个在飞，且每 600ms 最多启动 3 个 | p-queue，`strict: true` 才是滑动窗口 |
| 要暂停、改等待优先级、看 `size` / `pending` | p-queue |
| 缓存、失效、去重 | Query，不是队列 |

## 模型

`queue.size` 是等待数，`queue.pending` 是运行数。`concurrency` 限制后者。`intervalCap` + `interval` 限制新启动次数。两个帽同时生效。Lab 的 business 是“同时最多所选并发，且 600ms 内新启动不超过 3”。

默认窗口是固定窗，边界上可能突发。外部配额用 `strict: true`，用更多时间戳换滑动窗口。Lab 的非 basic 级别打开了它。

入队的是 thunk：`queue.add(() => work())`。写成 `queue.add(fetch(url))` 时，请求在限速之前就已经发出。

优先级只排序等待中的任务，数字大的先启动，不抢占正在跑的函数。Lab 把其中一个任务标成 5，用来说明这一点。

`onEmpty()` 只表示等待队列空了，运行中的可能还在。`onIdle()` 才是等待和运行都为零。`onSizeLessThan(n)` 只数等待，不计正在跑的。

`.add()` 的 Promise 是任务结果，不是“已入队”。循环里 `await queue.add(...)` 会把并发打成 1。Lab 先组装全部 `tasks`，再 `Promise.allSettled`。

v10 用 `EventTarget`：`addEventListener('completed', event => event.detail)`。`.on()` / `.off()` 是旧写法。Lab 没有挂监听器，状态来自任务函数里的更新。

`timeout` 从任务真正开始算。信号 abort 之后，任务代码若不读 `signal`，槽位可以释放，I/O 仍会继续。Lab 的 `sleep` 在 abort 时清掉计时器并 reject。

`.pause()` 不再启动新任务。`.clear()` 在本示例里不作为取消手段。取消必须让每个已提交的 `add()` Promise 结算，所以示例把同一个 `signal` 传进 `queue.add` 的选项，并让 sleep 遵守它。

## 三层示例

### 基本

选并发，点「启动批次」。七个格子从 `queued` 到 `running` 再到 `done`。峰值不超过所选并发。工作是 160ms 量级的本地延时，时间戳不是性能基准。

### 业务

十二个 RSS 格子。除了并发帽，还有严格的 600ms 启动窗。可以暂停新任务，再恢复。优先级只改变还没开始的那一个何时拿到槽位。

### 进阶

第 4 个格子变成 `failed`，其他成功项仍结算。点取消后，运行中的变为 `cancelled`，还在排队的也会结算为拒绝，而不是永远停在 `queued`。摘要写明拒绝数量。

原始研究里的 503/429 重试、16KiB 响应上限和十万条反压没有出现在按钮上。生产若做重试，每一次 HTTP 尝试单独 `queue.add`，否则 `intervalCap` 只会计第一次启动。

## 反例

### 反例 1：循环里 await add

```ts
for (const id of ids) await queue.add(() => fetchItem(id))
```

`concurrency: 5` 仍是串行。

```ts
const tasks = ids.map(id => queue.add(() => fetchItem(id)))
await Promise.allSettled(tasks)
```

Lab 的 `execute` 用的是第二种。

### 反例 2：把已经启动的 Promise 送进队列

```ts
queue.add(fetch(url))
```

```ts
queue.add(({ signal }) => fetch(url, { signal }))
```

### 反例 3：v10 还用 EventEmitter

```ts
queue.on('error', handler)
```

```ts
queue.addEventListener('error', event => { void event.detail })
```

每个 `add()` 仍要被 `catch` 或放进 `allSettled`，只挂监听器不够。

### 反例 4：把 intervalCap 理解成任意滑动一秒

固定窗在边界可以突发。要滑动窗口就设 `strict: true`，像 business 那样。

### 反例 5：重试循环写在同一次 add 里面

第二次 HTTP 不再经过限速器。每次尝试重新入队，并设总次数和等待上限。

### 反例 6：用 clear() 等 allSettled

```ts
queue.clear()
await Promise.allSettled(tasks)
```

Lab 的注释说明这条路径会留下未结算的排队 Promise。

```ts
queue.pause()
controller.abort()
```

运行中的函数必须读取同一个 signal。

### 反例 7：onEmpty 就关掉数据库

等待空了不代表运行结束。释放连接前 `await queue.onIdle()`，必要时先暂停并 abort。

### 反例 8：一次 add 十万个闭包

用生产者配合 `onSizeLessThan`，丢掉已完成的 Promise 引用。Lab 的 7 或 12 个任务只是演示，不是十万级测量。

### 反例 9：以为优先级会打断长任务

长任务要拆开，或快慢分开两条队列。

## 组合

**Query + Ky**：Query 拥有缓存和失效，Ky 发单次请求，p-queue 只调度需要共享配额的启动。缓存命中不要再排队。Query 的重试和队列里的重试只能有一处计数，并且每次真实网络尝试都过队列。signal 从 queryFn 传到 `add` 再传到 Ky。

**Dexie + Workbox**：待同步记录和幂等键放 Dexie。Workbox 管静态资源和离线响应，且不能在 Library Lab 主源上注册。p-queue 只活在页面还在的时候。刷新会丢掉内存队列，恢复靠持久 outbox，不靠队列对象本身。

## 生产核对清单

1. 任务函数接收并遵守 `signal`。超时、取消、卸载走同一条信号。
2. 用 `allSettled` 或逐个 `catch`，避免未处理拒绝。
3. 重试的每一次网络调用都重新入队。
4. 429/503 有次数上限和等待上限；401/403/校验失败不自动重试。
5. `strict` 是否打开，和外部配额的窗口定义一致。
6. SSR 或测试里的队列按请求或用例创建，不把用户 A 的任务留在模块级单例里给用户 B。
7. React effect 在清理时暂停并 abort；Strict Mode 下不要双倍提交不可重复的写入。
8. 不要把本进程队列当成崩溃后仍在的投递保证。

## 升级

钉 `10.0.0`。从 v7–v9 教程迁过来时：

- `queue.on` / `queue.off` 改成 `addEventListener` / `removeEventListener`，载荷在 `event.detail`。
- 自定义 `queueClass` 要实现 `remove`。
- 不要假设 `clear()` 会让等待中的 Promise 维持挂起或一定变成某种错误。Lab 的可运行示例避开 `clear()`，用 abort 让 `allSettled` 结束。官方 v10 readme 仍要对照你要依赖的那一种行为，并写成测试。
- `ERR_REQUIRE_ESM` 时改成 `import`，包是 `"type": "module"`。
- `engines` 要求 Node `>=22`。浏览器能否打包取决于 `EventTarget`、`AbortSignal` 等，本 Lab 还没有浏览器收据。

## 验收

- 峰值运行数不超过所选并发。
- business 在并发之外还有 600ms / 3 次的严格启动窗。
- 第 4 个任务失败时，其他任务仍结算。
- 暂停期间已运行的 sleep 继续；新的任务不启动，直到 `start()`。
- 取消后，运行中的和尚未开始的 `add()` Promise 都结算，且不调用 `clear()`。
- 卸载或切换层级后，旧 generation 不再改界面。
- `tests/sdk.test.mjs` 覆盖真实 p-queue 的并发、取消前结算，以及暂停中 abort、不用 `clear()`。没有收据就不是 sdk PASS。

练习：把 v9 的 `queue.on('idle')` 改成事件监听，并在卸载时 `removeEventListener`。再把内部 `while (retry)` 改成每次请求重新入队，断言滑动窗口内的启动次数不超过 cap。

## 资料

- https://github.com/sindresorhus/p-queue/releases/tag/v10.0.0
- https://github.com/sindresorhus/p-queue/blob/v10.0.0/readme.md
- https://github.com/sindresorhus/p-queue/blob/v10.0.0/package.json
- https://github.com/sindresorhus/p-queue/blob/v10.0.0/source/index.ts
- https://github.com/sindresorhus/p-queue/blob/v10.0.0/license
