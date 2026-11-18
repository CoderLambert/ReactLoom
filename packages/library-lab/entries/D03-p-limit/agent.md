# D03 p-limit — 接入与复核

需要限制一批 Promise 同时运行数量时使用 `p-limit@7.3.3`（MIT，ESM；Node >=20）。它不负责 QPS、重试、缓存、去重或把 CPU 工作送进线程。先读 [guide](guide.md)、实际 [example.tsx](examples/example.tsx) 和 [verification.json](verification.json)。

## 真实边界

SDK 管 `pLimit({ concurrency, rejectOnClear: true })`、队列、`activeCount/pendingCount` 和名额释放。本地 fixture 只有可取消的定时等待；任务 id、卡片、峰值、generation 和终态保护是自建 UI 逻辑，没有外部 HTTP。`limit(() => work(signal))` 内才启动工作；已启动的 Promise 包进 limit 无法补做并发限制。

声明的两个目标：basic 同批6任务对照并发1/4及实测峰值；advanced 10任务中4号失败，其余完成，再验证取消。兼容旧 `business` prop，不增加第三个声明 Demo。峰值在每个真实回调进入时累加、finally递减；卡片总计来自同一 jobs 数组，SDK计数仅为瞬时展示，交接时可以短暂不同。

## 迁移文件与所有权

保留 `examples/example.tsx`、`job-policy.mjs`、`job-policy.d.mts` 和 `workshop.css`。`demo.tsx` 是 Lab 适配导出；业务可直接传 basic/advanced。把 pause 换为接收 signal 的真实异步函数。每批拥有独立 limiter/controller，别与无关页面共用。切换批次/level/卸载增加 generation 并 abort + clearQueue，旧结果不可更新新批次。保留终态转换，不允许 cancelled/done/error 被迟到回调复活。

取消先 abort 运行中工作，再 clearQueue 清未开始队列。7.3.3 的 rejectOnClear 默认 false，本例显式 true 令排队 Promise 以 AbortError 结算；在清队列前立即注册 allSettled/catch。运行中 abort 在本例被捕获并返回，因此是 UI cancelled 而非一律对外 rejected；普通失败必须重抛。清队列不终止运行中工作，不配合 signal 的函数仍需自己的退出策略。

避免无限 enqueue、同一个 limiter 中嵌套等待同一个 limiter、以 activeCount 作为持久业务状态、把并发上限当每秒速率。客户端限流不替代服务端 URL/权限校验。

## 定向验证和浏览器交接

在 `packages/library-lab` 下运行 `node --test entries/D03-p-limit/tests/sdk.test.mjs`，真实 SDK 覆盖并发1/2/4的峰值与输入顺序、失败后继续、clearQueue拒绝和运行任务自己的signal。`tests/job-policy.test.mjs` 只覆盖自建策略，不计SDK通过。当前退出码/日志见 [local-validation](local-validation.md)。

浏览器保持 region `p-limit 真实并发调度` 与“运行批处理”“取消任务”，保留旧 @D03 入口语义。新增 `d03-metrics` 包含运行/排队/完成/失败/已取消/实测峰值，`d03-peak` 是实际峰值，`d03-sdk-counts` 是SDK观察。basic并发1/4分别完成6且峰值1/4；advanced未取消为9done+1error，取消后无queued/running；切换或停止重开不接收旧状态。Node与静态检查不能替代这些真实浏览器断言。

## 官方来源与状态

匹配 v7.3.3 的 annotated tag `4740323a1eba455aaef666a8faab519663fb0cb9` 指向 commit `4d4ec71803d8736567249c3dde06ea82795ae7c7`。固定ref根目录仅官方英文 `readme.md`，原文快照 [official/readme.md](official/readme.md)，SHA/日期/完整响应在 [source-evidence](official/source-evidence.json)；没有另造译文充当官方原文。官方仓库主页 GET200 但 X-Frame-Options deny、CSP frame-ancestors none，展示blocked并提供直达。

正式 sdk/build/browser 均保持 NOT_RUN；本地SDK与策略结果、完整六项和剩余browser/收据边界见 local-validation。不得把策略、公共构建或已有历史CI当作本条目正式SDK/浏览器收据。
