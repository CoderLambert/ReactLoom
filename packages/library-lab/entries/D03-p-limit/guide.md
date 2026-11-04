# p-limit：并发上限不是请求限流

## 用在哪里

对一批独立异步工作限制“同时执行几个”：批量处理图片、读取文件、请求摘要。它不是完整调度器，也不自动提供超时、重试、任务取消或每秒请求额度。需要暂停、优先级或时间窗口速率时再评估 p-queue。

## 安装与最小引入

```bash
pnpm add p-limit@7.3.3
```

```ts
import pLimit from 'p-limit';
const limit = pLimit(2);
const results = await Promise.allSettled(items.map(item => limit(() => processItem(item))));
```

完整实现位于 `examples/example.tsx`。演示仅用本地延迟模拟工作负载，调度由真实 p-limit 执行；没有网络请求，也没有付费服务。v7 系列要求 Node.js 20+，浏览器集成由当前应用构建器处理。

## 三层实验

入门：6 个任务、并发 1–4，观察运行与等待队列。业务：10 个新闻摘要任务，展示逐项状态，不等待整个批次结束才更新 UI。边界：第 4 个任务故意失败，其他任务仍执行；点击取消终止运行中的等待并跳过尚未开始的业务工作。

预期：同批次执行中的任务不超过选择上限；一个失败不会隐藏其他结果；取消或卸载后旧回调不再改写当前视图。

## 机制与所有权

`limit(fn)` 接收尚未执行的函数。库在空位可用时调用函数，以返回 Promise 的结算作为释放槽位依据。`activeCount` 与 `pendingCount` 是观测值，不是可以保存下来替代内部队列的状态。

本 Demo 每批创建一个 limiter，一个 AbortController 和一个 generation。AbortSignal 控制实际工作，generation 避免上一批结果写入下一批。组件卸载递增 generation、abort 正在运行的任务，并清空未执行队列；所有 Promise 都会结算，不删除全站数据。

## 至少三组必须理解的反例

### 1. Promise 已经启动才套 limit

错误：先调用 fetch 创建所有 Promise，再 `limit(() => promise)`；网络已开始，无法限制启动数。正确：把启动操作放进回调。

### 2. 将并发数当每秒额度

错误：并发 2 就认为每秒最多 2 次。任务足够快时吞吐可远超该数字。正确：并发和时间窗口限流分别设计，不混用指标。

### 3. 把清空队列等同取消

错误：认为 clearQueue 会中断已运行 fetch 或所有版本都会拒绝排队 Promise。正确：取消实际工作用 AbortSignal；审查所用版本的 clearQueue/rejectOnClear 语义。本示例明确使用 p-limit@7.3.3 的 `rejectOnClear: true`：取消时先通过 AbortSignal 中断运行中任务，再调用 `limit.clearQueue()`，使等待队列里的 Promise 以 AbortError 拒绝并由 `Promise.allSettled` 统一结算。

### 4. 在 render 每次创建 limiter

错误：每次重渲染产生新队列，多个队列各自限流但总并发失控。正确：批次局部所有权，或通过受控的长生命周期服务维护唯一 limiter。

### 5. 单个失败让进度全部消失

错误：只用 Promise.all，捕获第一个错误后丢弃已完成项。正确：需要批量部分结果时用 allSettled，逐项反馈；业务要求全-or-nothing 时另设计事务，不靠 Promise.all 实现回滚。

## 组合项目

p-limit + HTTP 客户端：先统一重试/超时预算，再决定重试是在持有槽位期间发生还是重新排队，不能嵌套多个 limiter 导致不可观察。p-limit + Worker：它限制提交数量而不是创建线程池；CPU 密集任务仍需真实 Worker/任务池，主线程异步函数不会自动变成后台计算。

## 性能与安全

大型输入应分批生产任务，不能仅限制执行数却一次性制造百万个 Promise。UI 不应为每次状态变化重绘巨大列表。只对当前任务资源清理。不要从用户输入执行任意函数或 URL。进度通过文本与状态播报提供，颜色只作辅助。

## 练习

将 1000 条任务改为有界分批生产，比较排队对象数而不是虚构吞吐基准。把已有全并发请求改为共享 limiter，加入单任务失败、用户取消和卸载后无回写的断言。

## 验证状态

真实包 import 已写入，依赖下载在当前环境受 DNS 阻塞。官方 SDK 和浏览器测试尚未执行，不能用目录测试证明并发库正确。`test:sdk` 将加载实际包，缺依赖直接失败，不静默跳过。

## 官方来源与许可

- [官方源码 v7.3.3](https://github.com/sindresorhus/p-limit/tree/v7.3.3)
- [发行记录](https://github.com/sindresorhus/p-limit/releases)

MIT；本地任务输入为原创 fixture。

## 新增独立 SDK 回归（真实包，不以 Mock 替代）

`tests/sdk.test.mjs` 使用目标 `p-limit@7.3.3` 验证上限、`rejectOnClear` 下排队任务是否全部以 AbortError 结算，以及 AbortSignal 如何处理已启动任务。测试**定义并不等于运行**；安装后执行 `node --test packages/library-lab/entries/D03-p-limit/tests/sdk.test.mjs`。如果 pending Promise 无法结算，测试将超时失败而不会误报成功。

## 第22轮：任务终态不可回退与演示层级所有权

`examples/job-policy.mjs` 现由真实 p-limit 演示 UI 引用：只允许 queued → running/cancelled，running → done/error/cancelled；done/error/cancelled 为终态，旧 Promise 迟到后不得把 cancelled 标为 done。批次取消一次性把尚未结束的卡片转为 cancelled，但**不将本策略的纯 Node 检查误记为 p-limit SDK 测试**。

切换 basic/business/advanced 时，旧 batch 的 generation 失效，AbortController 中断运行中的本地延迟，`clearQueue()` 结算未开始的 promise，重置仅该 Demo 的状态。取消按钮仍等待旧批次 allSettled 收尾后才允许新批次，避免误把仍在结算的任务算作消失。

新增 `node --test packages/library-lab/entries/D03-p-limit/tests/job-policy.test.mjs`（纯策略）。官方 SDK `tests/sdk.test.mjs` 保留真实 p-limit import；需已安装依赖后另行执行。多批次共享全局限额需进一步上移 limiter 所有权，不能因每批自身上限正确就宣称跨批次不会超额。
