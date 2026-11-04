# D18 Comlink — 工程手册

## 适用

把 CPU 工作放进 Web Worker，同时用对象式 RPC 调用。它不限制 Promise 并发，也不是不可信代码的沙箱。

## 版本

`comlink@4.4.2`，Apache-2.0。Worker 用 `expose`，宿主用 `wrap`。

## 迁移

带走 `examples/worker.ts` 和 `examples/example.tsx`。生产入口要按打包器的真实 Worker URL 创建，不要假设 Vite 的 `new URL(..., import.meta.url)` 在别的打包器里同样成立。

## 不可删的清理

离开页面时 `releaseProxy`，失败也要 `terminate`。每次会话监听 `error` 和 `messageerror`，并和目标 Promise、AbortSignal 一起结束。旧响应用 epoch 挡住。`transfer` 之后不要再读原来的 ArrayBuffer。

## 反例

- 在主线程返回预设结果，假装 Worker 跑过。
- 只在业务 catch 里写失败文案，Worker 还活着。
- 把未授权脚本注入同源 Worker。
- 用 p-limit 代替线程隔离，或用 Comlink 代替并发上限。
- 把 Node 的 MessagePort 测试当成浏览器 CSP 通过。

## 测试断言

- RPC 返回值来自 Worker。
- 转移后原 buffer 的 `byteLength` 为 0。
- 取消、切页、重复启动不会留下旧回写。
- 生产预览的 `worker-src` 没有拦截脚本。后一项需要浏览器收据。

## 真实限制

`terminate` 不保证旧 RPC Promise 自己结束。普通函数跨线程要 `Comlink.proxy`。这不是 ffmpeg 的内存预算。

## 证据

没有 `docs/library-lab/evidence/runs/` 收据不要写 sdk 或 browser PASS。Node MessageChannel 和 Chromium Worker 分开记账。
