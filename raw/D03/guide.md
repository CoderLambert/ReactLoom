# p-limit：让一批任务按并发上限开始

批量处理 100 条文章元数据时，直接 `Promise.all(items.map(load))` 会立刻启动全部工作。`p-limit` 接收尚未开始的函数，只让最多 N 个同时运行；空出名额后，再启动排队的函数。适合“这一批异步任务同时最多几个”，接入成本是一层调度与明确的批次清理。

Lab 使用 `p-limit@7.3.3`（MIT，ESM；Node 使用要求 >=20）。这里的工作是可取消的本地延时，**调度器是真实 SDK**，没有 HTTP 请求或付费 API。两个实验分别回答“上限怎样生效”和“失败、取消怎样结算”。

## 先理解函数、队列和结果

```text
输入任务 id → limit(() => work(id, signal)) → 运行名额 / 等待队列
                                                   ↓
                                      回调成功或失败 → 释放名额
                                                   ↓
                                 Promise.allSettled → 本批最终结果
```

- `limit(fn)` 返回这个任务的 Promise；传入的 `fn` 只有获准运行后才会调用。
- `activeCount` 是 SDK 已占用的运行名额，`pendingCount` 是仍在队列等待调用的数量。SDK 通过微任务交接名额，读数可能短暂领先于回调内的 UI 更新。
- `concurrency` 是同时运行上限，不是每秒次数。异步 I/O 可以交错等待；把 CPU 重计算写成 `async` 不会让它离开主线程。
- SDK 只管理调度。任务 id、卡片状态、实测峰值、错误展示、AbortController 和 React 生命周期由示例管理。

最小接入是把**启动工作**放进函数里，而不是先创建已经运行的 Promise：

```ts
import pLimit from 'p-limit'

const limit = pLimit({ concurrency: 2, rejectOnClear: true })
const results = await Promise.allSettled(
  articleIds.map((id) => limit(() => loadArticle(id, signal))),
)
```

`articleIds`、`loadArticle` 和 `signal` 是你的业务输入；完整可运行的本地版本见 [example.tsx](examples/example.tsx)。相反，先 `const started = ids.map(loadArticle)` 再 `limit(() => started[i])`，工作早已启动，限制不会生效。`allSettled` 等全部结果并按输入顺序返回，完成先后可以不同；它本身不负责限流或取消。

## 实验一：并发上限与实测峰值

工程问题：怎样证明“最多四个同时运行”，而不是把配置值打印成结果？

1. 打开“并发上限与实测峰值”，把“并发数”设为 1，点击“运行批处理”。
2. 观察 6 张卡片从 `queued` → `running` → `done`，运行中不超过 1。结束后，完成为 6，运行/排队/失败/取消均为 0，实测峰值为 1。
3. 改为 4，再运行同一批 6 个任务。峰值从 0 重新计量，预期结束为 4，完成仍为 6。

每个真实 `limit` 回调开始后递增 `activeWork`，取 `Math.max`，在 `finally` 中归还。峰值来自真实回调重叠，**不是**配置的 `concurrency`。卡片总计由同一个 `jobs` 数组派生；“SDK 最近一次观察”是事件时读取的 `activeCount/pendingCount` 快照，结束后应归零，不能当第二份业务状态。

关键位置：[run / activeWork / setPeak](examples/example.tsx)、[指标和卡片样式](examples/workshop.css)。每项延时为 220、330 或 440 ms，模拟等待，不把总耗时作为本机性能基准。这里列的是浏览器验收预期；当前真实执行证据见 [local-validation.md](local-validation.md)。

## 实验二：失败隔离与批次取消

工程问题：其中一项失败后，剩余任务能否完成？用户离开时，运行和排队中的任务分别怎样停止？

1. 打开“失败隔离与批次取消”，运行 10 个任务。4 号会抛出本地错误；不取消时，预期为 9 个 `done`、1 个 `error`，运行和排队为 0。SDK 在成功和失败后都会释放名额，`allSettled` 保留每项结算，邻居任务继续。
2. 再运行一次，立即点击“取消任务”。已经完成或失败的行保留；尚未结束的行变为 `cancelled`。结算后没有 `queued/running`，SDK 两个读数归零。
3. 取消后可以重新运行；也可在运行中切换场景或由宿主停止再打开。新实例初始显示“尚未运行”，旧回调不能把卡片写回新批次。

取消包含两件不同的事：

| 对象 | 实际动作 | 边界 |
| --- | --- | --- |
| 正在工作的回调 | `controller.abort()`；本地 `pause` 清定时器并拒绝 | p-limit 不会替你停止运行中的工作，真实 I/O 必须接收 signal |
| 尚未开始的队列 | `limit.clearQueue()` | 本例显式 `rejectOnClear: true`，排队 Promise 以 AbortError 拒绝 |
| UI 与迟到回调 | `cancelUnsettledJobs`、`transitionJob`、generation | 自建策略，终态不能恢复为 running，旧批次不能更新新状态 |

在 7.3.3 中 `rejectOnClear` 默认是 `false`，仅清空队列会使对应 Promise 保持未结算；若调用方等待它们，可能永远停在运行中。本例在 enqueue 后立即挂上 `allSettled`，并启用拒绝，避免队列取消悬挂或产生未处理拒绝。

还要区分 **UI 取消** 与 **Promise 拒绝数**：运行中的 `pause` 被 abort 后，本例 catch 将卡片标为 cancelled 并返回；该回调对外是 fulfilled。排队任务被 SDK 拒绝。取消结果按 signal 和卡片状态展示，不把所有 fulfilled 误报为业务成功。普通失败则重新 throw，让外部保留 rejection。

## 迁到自己的 React 项目

需要 React 浏览器环境与 `p-limit@7.3.3`。复制 [example.tsx](examples/example.tsx)、[job-policy.mjs](examples/job-policy.mjs)、[类型声明](examples/job-policy.d.mts) 和 [workshop.css](examples/workshop.css)，保留它们的相对位置；[demo.tsx](examples/demo.tsx) 只是 Lab 导出适配器，可直接改为导入 `ConcurrencyExample` 并传 `level="basic"` 或 `"advanced"`。无资源、存储、后端或额外样式依赖。

把 `pause` 换成自己的异步函数，并让它接收同一个 signal。每个批次创建独立 limiter 和 controller；不要在 render 中创建，不要让无关页面共用一个会被清队列的全局实例。新批次、level 变化和卸载会终止旧工作；generation 只允许当前所有权写 React 状态。终态转换继续经 `job-policy`，不要另写一套状态机。兼容代码仍接受旧 `business` prop，但它仅保留旧 10 任务入口，不声明成第三个学习目标。

## 选型与生产边界

- 要间隔、优先级、暂停等完整队列能力时再评估 p-queue；要缓存或去重时交给相应数据层。限制并发不等于遵守每秒速率或服务端 `Retry-After`。
- 一次 enqueue 上万项仍会占用队列内存；先分页或控制生产速度。不要在某个受限回调中等待同一个 limiter 的子任务，名额占满时会死锁。
- 客户端并发限制不承担 SSRF、授权或重试安全。若改成用户 URL 请求，在服务端校验地址并设置自己的失败策略。
- 这里取消能迅速结束，是因为本地工作配合 signal；不支持中止的第三方函数必须另设超时/忽略迟到结果，`clearQueue` 无法改变它。

## 官方原文与证据

[上游英文 README 固定提交](https://github.com/sindresorhus/p-limit/blob/4d4ec71803d8736567249c3dde06ea82795ae7c7/readme.md) 对应 `v7.3.3`；[本地原文快照](official/readme.md) 保留 5,418 字节与原始 SHA-256。实际固定 ref 的根目录只发现 `readme.md`，未发现官方中文候选，故使用英文原文，中文教学由本页独立编写。

包声明的官方仓库兼作主页：[sindresorhus/p-limit](https://github.com/sindresorhus/p-limit)。2026-11-10 实际 GET 200 响应同时有 `X-Frame-Options: deny` 和 `frame-ancestors 'none'`，因此官网预览为 **blocked**，保留直达，不宣称已在浏览器成功嵌入。完整最终 URL、全部响应头、版本/tag/commit 与摘要见 [source-evidence.json](official/source-evidence.json)。

真实 SDK 测试与纯状态策略测试分开记录；Node 结果不能代替浏览器按钮和卸载验收。当前命令、退出码及待验项统一保留在 [local-validation.md](local-validation.md)，正式 verification 收据保持 NOT_RUN。
