# Comlink 4.4.2｜模块 Worker、可转移缓冲区和必须终止的代理

Lab 锁定 `comlink@4.4.2`（MIT）。示例在主线程 `Comlink.wrap`，在 [`examples/worker.ts`](examples/worker.ts) 里 `Comlink.expose`。计算发生在模块 Worker 中，不在主线程返回写死的结果。Comlink 是 RPC 和所有权转移的包装，不是并发池，也不是取消协议本身。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。点击后 `new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })`。构造失败（CSP 或不支持模块 Worker）时把错误写进结果，不假装已经算完。

`dispose` 先 abort 本地 `AbortController`，再 `remote[Comlink.releaseProxy]()`。释放若抛错或返回拒绝，仍然进入 `finally` 调用 `worker.terminate()`。终止是物理边界。代理释放失败不能让 Worker 继续活着。

`epoch` 在每次启动和取消时增加。过期的进度回调和完成结果不能 `setResult`。取消按钮增加 epoch、dispose，并写明旧结果不会回写。卸载 effect 做同样的事。

Worker 的 `error` 和 `messageerror` 各监听一次，转成会输掉 `Promise.race` 的拒绝。`messageerror` 表示消息无法反序列化。

- basic：`summarize(['react','rss','react','worker','rss','react'])`，返回计数和词频。
- business：4000 个 `'tech'` / `'business'` 交替字符串，同一 `summarize`。这只证明调用穿过了 Worker，不是吞吐基准。
- advanced：`Uint8Array` 经 `Comlink.transfer(bytes, [bytes.buffer])` 交给 `sumBytes`。主线程上的 `bytes.byteLength` 在转移后变为 0，结果里记为 `detachedBytesOnMainThread`。接着 `progress(5, Comlink.proxy(callback))`。Worker 里对回调 `await report(index)`，因为代理调用是异步 RPC，要按顺序等到确认。每步约 45ms。

`Promise.race` 同时等待任务、本地 abort 和 Worker 崩溃。`terminate()` 不会把 Worker 里的 Promise 变成已解决。界面用竞态和 epoch 避免把终止看成成功。

没有挂载：SharedArrayBuffer、ffmpeg.wasm、线程池。那些需要跨源隔离和单独的内存预算。

## 什么时候用

主线程上的长循环会卡住输入时，把纯计算放到 Worker，并用 Comlink 暴露小界面：可结构化克隆的参数、明确的可转移缓冲区、少量回调。

只想限制同时发出的 HTTP 数时用 p-limit 或 p-queue，不要为了排队去开线程。CRDT 合并仍是 Yjs 的事；Worker 里可以应用更新字节，但不能用 Comlink 代替权限。视频转码一类 WASM 可以住在 Worker 里，但要规划内存、取消和 COOP/COEP。Lab 没有这些头。

对象每次调用都会结构化克隆。函数不能克隆，除非包成 `Comlink.proxy`。克隆大数组是拷贝；要零拷贝必须转移，并接受发送方视图被分离。

## 模型

`expose(api)` 把对象的方法变成消息。`wrap(port)` 得到带类型的远程对象。方法返回 Promise。抛错会在主线程变成拒绝。

`Comlink.transfer(value, [buffer])` 把缓冲区登记为可转移。Worker 收到后拥有那块内存。主线程再读 `byteLength` 得到 0。不要在转移之后继续使用旧视图。

`Comlink.proxy(fn)` 把回调变成可以从 Worker 调用的桩。Worker 侧的 `await report(index)` 等待主线程函数结束。若回调里再去 `dispose` 同一个 Worker，要小心重入；Lab 的回调只在 epoch 匹配时改状态。

`releaseProxy` 通知对端可以丢掉代理。它不是进程管理。`terminate()` 立即结束 Worker 脚本。两者都要。顺序是先释放，再终止，释放失败也要终止。

本地 `AbortController` 不会自动传进 Worker 方法。Lab 的 `summarize` 没有 signal 参数。取消的可观察效果是：主线程不再采纳结果，并且 Worker 被终止。已经在 Worker 里跑完的那一次循环可能仍会跑到脚本被杀掉为止。不要写成“函数已在协作点返回”。

`messageerror` 和脚本错误必须被监听。否则拒绝只留在 Worker 控制台，按钮一直停在“正在工作”。

模块 Worker 的 URL 用 `import.meta.url` 相对路径，让打包器能看见 `worker.ts`。不要把 Worker 源码只写在指南里。

## 三层示例

### 基本

结果 JSON 含 `count: 6` 和 `react`、`rss`、`worker` 的次数。按钮在 `working` 时禁用启动，避免两套 Worker 叠在一个 ref 里。`execute` 开头会先 `dispose` 旧会话。

### 业务

4000 项的词频应是 tech 与 business 各 2000。若主线程被错误地同步计算，输入框会卡住；这个示例把循环放在 Worker。仍不要把 4000 当成容量规划。

### 进阶

`sum` 是 75。`detachedBytesOnMainThread` 是 0。进度句会从 1 走到 5，然后结果里的 `progressEvents` 是 `[1,2,3,4,5]`。中途点终止，最终文案是取消，而不是半截 sum。

## 反例

### 反例 1：在主线程假装 Worker

```ts
setResult(JSON.stringify({ count: 6, frequency: { react: 3 } }))
```

```ts
const answer = await remote.summarize(values)
```

测试要能看到 `Worker` 或 `MessageChannel` 上的真实往返。

### 反例 2：转移之后还用缓冲区

```ts
const bytes = new Uint8Array([5, 10, 15])
await remote.sumBytes(Comlink.transfer(bytes, [bytes.buffer]))
console.log(bytes.reduce((sum, value) => sum + value, 0))
```

分离后的视图不能再读。需要的话在转移前复制一份。

### 反例 3：把普通函数当回调

```ts
await remote.progress(5, (step) => setResult(String(step)))
```

函数不能被结构化克隆。

```ts
await remote.progress(5, Comlink.proxy(step => { if (current === epoch.current) setResult(String(step)) }))
```

### 反例 4：只 release 不 terminate

代理释放失败或 Worker 已崩溃时，线程还在。`dispose` 的 `finally` 必须 `terminate`。

### 反例 5：只 terminate 就认为 Promise 成功

```ts
worker.terminate()
setResult('完成')
```

竞态里的任务会拒绝或永远挂起。用 epoch 丢掉结果，文案写终止，不要写成功。

### 反例 6：进度回调不看 epoch

旧 Worker 的迟到消息会把新任务的结果盖掉。回调第一行比较 epoch。

### 反例 7：用 Comlink 限制 HTTP 并发

每个调用仍是一次消息。同时发出的 `fetch` 不会因为 wrap 了就变少。并发池用 p-limit。

### 反例 8：把 Y.Doc 直接当参数

文档对象不是适合反复克隆的结构。传 `Uint8Array` 更新，在线程内应用。本示例没有 Yjs。

## 组合

**p-limit**：池子决定有多少个任务可以启动。每个任务内部再 `wrap` 一个 Worker，或者复用一个 Worker 队列。不要为每个数组元素 `new Worker`。Lab 一次点击一个 Worker，结束就终止。

**ffmpeg.wasm**：WASM 堆和代理回调都要在 `terminate` 时释放。跨源隔离头由部署环境提供，不在这个示例里。

**Yjs**：Worker 收到信封校验过的更新再 `applyUpdate`。Comlink 不检查租户。

## 生产核对清单

1. Worker 构造失败有可见错误，不回退到主线程假结果。
2. `dispose` 在释放代理之后始终 `terminate`。
3. 每次启动使用新 epoch；回调和 `setResult` 都比较它。
4. 可转移缓冲区只登记真正要交出的 `ArrayBuffer`。
5. 回调使用 `Comlink.proxy`，Worker 内按需 `await`。
6. 监听 `error` 和 `messageerror`，并在结束时移除。
7. 取消文案不写成任务成功。
8. 不在日志里打印用户文件的全部字节。

## 会话和错误通道

一次点击对应一个 `Session`：worker、remote、controller。`execute` 开始时先 `dispose` 旧会话，所以连点不会留下两个线程。`working` 在 `finally` 里恢复，但只有 epoch 仍是这一次时才 `dispose` 和 `setWorking(false)`。取消按钮已经增加了 epoch 并自己 dispose，晚到的 `finally` 不能再终止新的 Worker。

`Promise.race` 的失败原因可能是 `AbortError`、脚本错误或反序列化错误。文案统一带上 `String(error)`，不区分成“服务器 500”。这里没有服务器。

`sumBytes` 假设数组里是数字。转移来的 `Uint8Array` 满足这一点。不要把字符串数组用同一方法相加。`summarize` 对每个值做键，对象会被收成 `"[object Object]"` 这类无用键。调用方应传字符串。

模块 Worker 在打包后的 URL 必须仍能加载 `comlink`。若构建把 Worker 打成经典脚本，`import` 会失败，构造或首条消息会报错。验收时看网络里 Worker 脚本的类型，而不是只看主包。

回调里的 `setResult` 在进度过程中覆盖输出，最终 JSON 再覆盖一次。取消若发生在两者之间，epoch 让最终 JSON 写不进去。测试可以在第三次回调时取消，并断言界面停留在取消文案。

不要把 `releaseProxy` 的返回值忽略成未处理拒绝。示例用 `Promise.resolve(...).catch` 吃掉它，再 `terminate`。未处理拒绝会在控制台变成红色，容易被当成计算失败。

## 升级

钉 `comlink@4.4.2`。升级后重测转移所有权、代理回调顺序和 `releaseProxy` 失败时是否仍会 `terminate`。API 表面长期稳定，仍不要换掉 `Comlink.transfer` 的参数顺序。

打包器必须把 `worker.ts` 当成模块 Worker 入口。只改指南里的 import 路径是不够的。

`progress` 的 `total` 若是 0，循环不调用回调并返回 0。示例固定传 5。不要把用户输入直接当 `total` 而不设上限，否则回调次数可以拖住主线程的消息处理。

`sumBytes` 对空数组返回 0。转移空缓冲区仍然会使主线程的 `byteLength` 变成 0。示例用五个非零字节，是为了让和 75 能被看出来。

构造 Worker 失败时不会调用 `dispose` 去终止一个不存在的线程。`session.current` 仍是 null。下一次点击可以再试。不要在 catch 里 `terminate` 未赋值的变量。

`Comlink.wrap` 的类型参数是 `WorkerAPI`。运行时没有校验。若 Worker 忘记 `expose`，第一次调用会拒绝。界面走 catch，而不是一直 `working`。

`working` 在构造失败时回到 false，启动按钮可以再点。成功路径在 `finally` 里同样回到 false，但要看 epoch，避免把新一轮的 working 提前清掉。

监听器在 `finally` 移除。若在 `race` 之前抛错，移除仍然发生，不会把旧的 `error` 监听留在已经 `terminate` 的对象上。

## 验收

- basic 的词频来自 Worker 方法，而不是主线程常量。
- business 的 4000 项计数为 4000，两类各半。
- advanced 转移后主线程字节长度为 0，和为 75，进度回调按 1 到 5 确认。
- 终止后的迟到回调不改界面。
- `releaseProxy` 抛错时 `terminate` 仍被调用。
- `tests/sdk.test.mjs` 用真实 Comlink 和 `MessagePort` 或 Worker。无收据则 NOT_RUN。

练习：给 `summarize` 增加 signal 参数，在循环里检查它。再断言 `terminate` 之后主线程不再采纳进度。

## 克隆、转移和测试形状

结构化克隆能带走普通对象、数组、`Map`、`Set`、`ArrayBuffer` 和 TypedArray 的拷贝。它带不走函数、DOM 节点、类的原型方法，也带不走尚未分离的“还想在两边一起改”的缓冲区。需要回调时用 `proxy`。需要零拷贝时用 `transfer`，并在发送前复制仍要保留的字节。

`MessagePort` 测试可以不启动真实 Worker：两端各 `expose` / `wrap` 一对端口，断言 `summarize` 的词频。这证明 Comlink 的 RPC，不证明打包后的模块 Worker 能在目标浏览器启动。浏览器收据仍要单独记录。Lab 的 SDK 测试若使用端口，不要把它写成 Playwright 已通过。

Worker 脚本里的 `setTimeout` 在 `terminate` 之后不会再回调主线程，但已经发出的消息可能还在通道里。epoch 就是用来丢掉这最后一条的。不要在 `terminate` 之后立刻复用同一个 `remote`。

进度回调若不同步 `await`，主线程可能先看到 5 再看到 1。Worker 里的循环等待每次 `report` 的 Promise。主线程回调要短，不要在里面再 `await remote.summarize`，否则两个方向的 RPC 会互相卡住。

CSP 若禁止 `worker-src`，构造函数抛错。界面保持 `working === false`，用户可以再试。不要捕获之后改在主线程跑 4000 项循环。

转移列表里只能放属于该视图的 `buffer`。把别的 `ArrayBuffer` 放进列表会在发送时抛错，或转移错内存。示例只转移 `bytes.buffer`。

类型 `WorkerAPI` 来自 worker 模块的 `typeof api`。它不会在运行时校验返回值。`summarize` 的频率对象若被 Worker 改成数组，主线程的 JSON 仍会显示。关键字段要在主线程再看一眼类型，至少在测试里断言 `count` 是数字。

`new URL('./worker.ts', import.meta.url)` 必须出现在会被打包器扫描的源码里，不能拼成运行时字符串。否则 Worker 文件不会进产物，点击只得到构造错误。

`summarize` 的频率对象按值累加。顺序不重要，测试应比较键和次数，而不是 `JSON.stringify` 的键顺序。4000 项里偶数下标是 `tech`，奇数是 `business`，各 2000。

进度的 45ms 只是让界面能看见中间句。测试可以 mock 时间，但浏览器演示没有假装这是帧预算。五次回调都 `await`，总等待大约 225ms 加上消息开销。

`detachedBytesOnMainThread` 记录的是转移之后的 `byteLength`。若它不是 0，说明 `transfer` 没有生效，主线程仍持有拷贝或原缓冲。这个字段是验收的一部分。

取消与完成的竞态用同一个 epoch。在 `await` 之后再读 `epoch.current`，不要使用 `execute` 开头闭包里已经过期的比较函数以外的旧布尔。

Worker 的 `error` 监听是 `once`。若脚本在第一次错误后继续活着，后续错误不会再被转成拒绝。`terminate` 会结束这种半死状态。不要去掉 `once` 却忘记在 `finally` 里 `removeEventListener`，否则下一次任务会接到上一个 Worker 的监听器。

`session` ref 在 `dispose` 开头就置空，然后再异步释放代理。这样第二次进入 `dispose` 不会终止两次，也不会在 `await` 期间被别的调用看见旧 remote。终止放在 `finally`，覆盖同步抛错。

进度回调使用 `Comlink.proxy`。不要把 `setResult` 直接传入。结构化克隆会丢掉函数，调用在 Worker 里失败，主线程看到拒绝而不是进度。

`epoch` 用数字而不是布尔 `cancelled`。布尔在快速重入时会把新任务也标成已取消。每次启动和每次取消都加一，比较的是当时捕获的 `current`。

## 资料

- https://github.com/GoogleChromeLabs/comlink
- https://github.com/GoogleChromeLabs/comlink#comlinktransfervalue-transferables
- https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
- https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate
- https://developer.mozilla.org/docs/Web/API/Web_Workers_API/Using_web_workers
