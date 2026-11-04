# D18 Comlink — 工程手册

## 适用

把可结构化克隆的计算放到模块 Worker，并用小的 RPC 表面调用它。大块二进制用显式转移。进度用代理回调。

不要用它限制 HTTP 并发，不要用它代替 Yjs 或鉴权，不要在主线程伪造 Worker 的返回值。

## 版本

`comlink@4.4.2`，MIT。入口是 `wrap`、`expose`、`transfer`、`proxy`、`releaseProxy`。

Worker 使用 `{ type: 'module' }` 和相对于 `import.meta.url` 的 `./worker.ts`。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走 `dispose`、epoch 和 `Promise.race`。从 [`examples/worker.ts`](examples/worker.ts) 带走 `summarize`、`sumBytes` 和会 `await` 的 `progress`。

生产任务换成真实计算时保留：构造失败可见、转移列表明确、回调看 epoch、终止不表示成功。

不要把 4000 项的演示改成在主线程先算好再送进 Worker。

## 不可删的清理

`dispose` 清空 session、abort、尝试 `releaseProxy`，并在 `finally` 里 `worker.terminate()`。释放失败不能跳过终止。

每次 `execute` 和取消都递增 epoch。进度回调和最终 `setResult` 都要 epoch 仍匹配。

结束后移除 `error` 和 `messageerror` 监听。卸载 effect 同样 `dispose`。

## 反例

- 主线程直接 `setResult` 写死词频。
- 转移后继续读原 `Uint8Array`。
- 把裸函数传给 Worker。
- 只 `releaseProxy` 不 `terminate`。
- `terminate` 之后把界面写成成功。
- 旧回调覆盖新任务。
- 为每个元素创建 Worker。
- 把 `Y.Doc` 当普通参数克隆。

## 测试断言

- 真实 Comlink 经 `MessagePort` 或 Worker 调用 `summarize`。
- `transfer` 登记的缓冲区在发送侧分离，和为字节之和。
- 代理回调按顺序收到 1 到 5。
- `releaseProxy` 失败时仍执行 `terminate`。
- 取消后的回调不回写。
- `tests/sdk.test.mjs` 导入真实 `comlink`。无收据则 NOT_RUN。

## 真实限制

没有 SharedArrayBuffer，没有 WASM，没有协作式 signal 穿进 `summarize`。4000 项不是容量测试。模块 Worker 可能被 CSP 拒绝，这时界面必须显示构造错误。

`terminate` 不会把远端 Promise resolve 成业务结果。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
