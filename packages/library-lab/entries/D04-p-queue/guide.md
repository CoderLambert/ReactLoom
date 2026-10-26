# p-queue v10 · 并发、滑动限速与任务生命周期

## 定位与选型

p-queue 提供 Promise 队列、concurrency 限制、intervalCap/interval 时间窗口、priority、pause/start、AbortSignal 与超时。与只限制同时运行数量的 D03 p-limit 不同，它能安排请求启动频率与优先级。它并非分布式持久化队列、Redis Job Queue 或 HTTP Retry 客户端。超过应用进程寿命的任务需数据库/消息队列支持。

基线：p-queue@10.0.0，MIT，原生 ESM，Node >=22。v10 使用 EventTarget 事件协议；不要复用旧 .on/.off 假设。仓库旧研究可读，但新例子由本分支针对 v10 重写，历史验证不继承。

## 安装与真实入口

~~~sh
pnpm add p-queue@10.0.0
~~~

完整运行文件：examples/example.tsx 与 examples/demo.tsx（仅重新导出）。全部实际任务由 PQueue.add 启动，不先制造已运行 Promise 再包装。

~~~ts
import PQueue from 'p-queue';
const queue = new PQueue({concurrency: 2, intervalCap: 3, interval: 600, strict: true});
const jobs = items.map(item => queue.add(async ({signal}) => work(item, signal)));
const results = await Promise.allSettled(jobs);
~~~

## 三层 Demo

**入门**：7项本地异步任务，调节最大并发 1-3；实际 PQueue.pending、size 用于观测，并记录同时运行峰值。此处 sleep 只是业务工作负载 fixture，调度代码使用真实 SDK。

**业务**：12个虚构 RSS 来源，队列并发 1-3、600ms 内启动最多3个任务，strict 滑动窗口控制更严格的起始次数。第8项排队时可设较高 priority，它影响还没开始的任务，不会抢占正在执行的项。暂停仅停止新任务，并不终止运行中任务。

**边界**：第4项固定失败；其余任务照常结算。AbortController 同时传播给 queue.add(signal) 和真实任务 sleep；queue.clear() 移除等待队列，结果通过 Promise.allSettled 观察。进程退出或卸载时取消当前批次，不调用全局存储清理。

## 机制和易错边界

concurrency 约束同时执行数；intervalCap+interval 约束窗口中的启动次数，互不替代。默认固定窗口有边界突发；strict:true 使用滑动窗口。仅限制并发 ≠ 每秒 API 配额。queue.size 是排队数，queue.pending 是运行数；onEmpty 只代表等待队列清空，onIdle 才是完全空闲。

每个 add() Promise 都可能 reject，必须通过 Promise.allSettled/catch 消费，否则 unhandled rejection 会泄漏。超时从任务实际开始计算；仅拒绝队列 promise 不保证网络 I/O 停止，任务必须响应 signal。重试 HTTP 尝试如果放在一个 queue.add 内部循环，intervalCap 只统计那次任务启动，可能突破每窗口外部 API 调用限额；重试尝试应分别进入队列或用已核实的协调器。

## p-queue 特有反例

1. 提前调用 fetch 再 enqueue：限流无效；传函数而不是已启动 Promise。
2. 对每个 queue.add 立即 await：无意串行化；构建任务数组再并发等待。
3. 把 intervalCap 当并发上限：请求很快完成时仍可能在单位时间启动过多；正确配置两个参数。
4. 把 clear() 当作 abort：只移除等待队列；运行中必须显式取消真实 I/O。
5. 未消费 add() 拒绝：导致非预期 unhandled rejection；使用 allSettled 或逐项 catch。
6. 大数据一次入队数百万项：执行虽然受限，但排队对象本身消耗内存；优先有界生产、背压与按段生成。

## 跨库组合和实际项目

NewsHub RSS 抓取：一层外部 quota 队列控制起始频率，一层 HTTP 客户端负责 timeout/429/503 可重试性，业务记录以 idempotency key 保证重放安全。队列本身不管理任务持久化；要容灾选后端队列。与 D03 p-limit 不要在未确认语义时叠加两层限流器。

## 验证与许可

已提交真实 SDK import 示例与 tests/sdk.test.mjs 目标测试，但此轮 npm/TS/Vite/浏览器实际未执行。只有运行后才能把 verification.json 更新 PASS 并附来源指纹与日志。许可 MIT，示例无真实服务、凭据或第三方媒体。

官方：https://github.com/sindresorhus/p-queue/tree/v10.0.0
