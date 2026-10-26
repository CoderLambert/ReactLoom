# D18 Comlink — Agent 工程指南

**任务选型**：需要 Web Worker 隔离 CPU 任务并保留对象式 RPC；Comlink 不是 Promise 并发限制器，也不是远程不可信代码沙箱。

## 迁移核心代码
读取 `examples/worker.ts` 和 `examples/example.tsx`。Worker 用 expose(api)，宿主用 `new Worker(new URL(...,import.meta.url),{type:'module'})`、`wrap<WorkerAPI>`；生产入口必须测试 bundler 生成的真实 Worker 文件。安装 comlink@4.4.2（Apache-2.0）。

## 不能删掉的资源协议
Worker + Remote 应有明确 owner；离开页面调用 releaseProxy/terminate；旧异步响应由 epoch 或 AbortSignal 阻断。终止不保证旧 RPC Promise 自动完成，要有取消竞速。大二进制包用 transfer 后不再访问原 ArrayBuffer；普通函数跨线程必须用 Comlink.proxy 包装。不要把网络未授权脚本注入同源 Worker。

## 必测场景
真正 Worker RPC 返回正确值；转移后原 byteLength=0；进度回调到达；按钮取消、Tab 切换、重复启动不会产生悬挂线程和旧回写；CSP/worker-src 在生产 preview 没有拦截。Node sdk.test.mjs 只能验证 Node MessageChannel，不等同 Chromium。状态未运行标 NOT_RUN。

## 组合
D03 p-limit 负责限制派发并发，D18 Comlink 负责线程消息层，E19 ffmpeg.wasm 可能需要多 Worker/WASM 独立内存预算。参考 https://github.com/GoogleChromeLabs/comlink 。
