# Comlink 4.4.2 — 可维护的 Worker RPC

## 核心问题
React 中 async 函数仍可能在主线程执行 CPU 工作；简单并发限制也不会自动变成线程池。Comlink 使用真实 Web Worker + MessagePort，把远端对象暴露为 Promise 风格的代理，适合图像处理、大集合索引、CSV 清洗和部分 WASM 工作。

## 安装与源码
```bash
pnpm add comlink@4.4.2
```
`examples/worker.ts` 真实调用 `Comlink.expose(api)`；`examples/example.tsx` 用 `new Worker(new URL('./worker.ts', import.meta.url),{type:'module'})` 和 `Comlink.wrap<WorkerAPI>(worker)`。Vite 会将 worker 作为独立模块产物；不能把整个 worker 源码用 React import 到主线程。`examples/demo.tsx` 只是页面入口。

## 三层实验
入门：6 条标签数组在 Worker 求频次并通过 Remote Promise 返回。
业务：4,000 条 fixture 送到 Worker 汇总，说明工作真正离开主线程，但不能声称已测量 P95 或性能倍数。
高级：用 `Comlink.transfer(bytes,[bytes.buffer])` 显式转移 Uint8Array 的 ArrayBuffer，原线程缓冲区变 detached；用 `Comlink.proxy(callback)` 传进度回调。用户可以终止 Worker，旧 Promise 的结果被 epoch 阻止回写 UI。

## 生命周期与所有权
- 每次任务拥有一个 worker、一个 remote proxy 和 AbortController；不重复创建未释放的 Worker。
- `remote[Comlink.releaseProxy]()` 释放协议代理；`worker.terminate()` 真正停止工作线程，二者职责不同。
- 终止工作线程不会自动保证所有挂起的 Promise resolve。页面用 AbortSignal 竞速取消，避免等一个永远不返回的 RPC。
- React 卸载增加 epoch，释放 proxy 和线程；避免旧任务在新的示例页更新状态。异常时应保留原因，而不是吞掉 Worker error。
- 大对象需要权衡 structured clone 的序列化成本；对 ArrayBuffer 显式 transfer，传输后原数据不可再访问。跨线程回调需用 Comlink.proxy，不可直接传普通函数。

## 安全与实际运行边界
Worker 并非独立的安全沙箱：同源网络和应用数据权限需要按架构限制；不把来自第三方的脚本直接放入 Worker。跨源资源、CSP worker-src、WASM 和 Vite 生产资源 URL 应在真实浏览器/自托管路径下测试。不用 Comlink 解决所有线程安全问题；取消、任务去重和内存预算仍由业务设计负责。

## 五个反例
1. 只包一层 async 仍在主线程运行 → 用真正的 Worker。
2. 传入巨大 Uint8Array 默认 clone → 可转移 Buffer 时显式 transfer，确认原线程失去所有权。
3. 将 callback 当普通结构化克隆数据 → 使用 Comlink.proxy。
4. 卸载只置 visible=false → 释放 proxy、terminate worker、隔离 epoch。
5. 丢失终止时的 pending Promise → 使用可取消竞速并处理未完成结果。

## 练习
将 NewsHub 一个 CSV/搜索索引构建移动到 Worker，量化主线程长任务时间和内存峰值；取消、反复进入/退出及大量消息都需有自动测试。Node 测试可使用官方 nodeEndpoint 适配器验证真实 MessageChannel RPC，但**不能代表浏览器 Worker 验证**。

## 当前证据
`tests/sdk.test.mjs` 包含真实 Comlink/MessageChannel；未运行前只能 NOT_RUN。生产 Worker chunk/CSP、资源卸载和 TypeScript 类型由 PLATFORM 实际验证。

参考：https://github.com/GoogleChromeLabs/comlink 。Apache-2.0。

## 第十二批：Worker 崩溃通道与释放失败兜底

仅使用 AbortSignal 竞速无法处理**Worker 脚本崩溃但 RPC Promise 永远 pending**的情况。现在监听原生 Worker 的 `error` / `messageerror` 并让其参与 `Promise.race`；无论任务成功、报错或用户取消，都移除事件监听、释放 Comlink Remote 并终止 Worker。如果 `releaseProxy` 同步抛错或异步拒绝，`finally` 仍会执行 `terminate()`，不因 SDK 通道损坏而泄漏线程。更换任务的 epoch 继续阻止旧 Worker 错误覆盖当前 UI。

新增 Node 真实 SDK 测试使用 `MessageChannel`、`Comlink.transfer` 和 `Comlink.proxy`，对真实 transfer 后原缓冲区 detached、Worker RPC 式回调实际到达进行断言；该 Node 传输测试尚未运行，**不能替代 Chromium 的 CSP、真实模块 Worker 脚本错误或资源回收测试**。
