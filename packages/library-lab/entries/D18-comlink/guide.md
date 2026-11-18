# Comlink 4.4.2：把计算交给 Worker，明确数据与线程所有权

用户在页面统计一批标签，下一步要处理二进制、显示进度并随时终止。Comlink 将 `postMessage` 包装成异步 RPC：主线程 `wrap`，Worker `expose`。它不替你创建线程、不限制并发、不验证业务输入，也不提供事务回滚。选它是为了把跨线程方法调用写清楚，而不是让一个小数组更快。

本例使用真实 `comlink@4.4.2`，许可 **Apache-2.0**。三个场景分别观察 RPC、远端错误恢复、transfer/proxy/终止，不用增加数据量冒充新的知识点。数据和90ms进度间隔是本地 fixture；没有HTTP、WASM、持久化、账号或付费服务。

## 何时选它

主线程长计算影响输入时，可以把纯计算放进 Worker，让 Comlink 暴露小而明确的方法接口。跨线程有启动、结构化克隆和消息往返成本；小数组不保证更快。CPU工作仍要设规模和内存预算。

仅限制 HTTP 并发用 p-limit/p-queue；缓存和失效用 Query；CRDT合并是Yjs的职责。Comlink不提供授权、持久队列或线程池。大文件/WASM还需要单独设计内存、部署头和取消协议，本例不实现这些。

## 先跑通最小调用

需要支持模块Worker的浏览器、React/TypeScript与能识别 `new URL(..., import.meta.url)` 的Vite类打包器。安装：

```sh
pnpm add comlink@4.4.2
```

完整迁入六个实际文件：[`example.tsx`](examples/example.tsx)、[`worker.ts`](examples/worker.ts)、[`worker-api.ts`](examples/worker-api.ts)、[`session-policy.mjs`](examples/session-policy.mjs)、[`session-policy.d.mts`](examples/session-policy.d.mts)，以及按需使用的 [`demo.tsx`](examples/demo.tsx) 转发入口。前五个是运行/类型必需，demo可省略。保持相对目录；React宿主渲染 `<ComlinkWorkshop level="basic" />`，无需Lab内部模块或CSS才能操作。

```ts
// worker.ts：Worker执行入口
import * as Comlink from 'comlink'
import { api } from './worker-api'
Comlink.expose(api)

// 主线程：必须保留可被打包器扫描的静态URL写法
const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
const remote = Comlink.wrap<WorkerAPI>(worker)
const answer = await remote.summarize(['rss', 'rss', 'react'])
```

`WorkerAPI` 是 worker-api.ts 导出的类型，编译时帮助不是运行时schema。浏览器CSP需要允许同源worker-src；不要为了示例放开任意远程脚本。构造失败、脚本错误和消息反序列化错误会显示失败。Worker未expose或不回应时RPC本身可能永不结算，因此主线程另设5秒本地上限，超时走finally终止线程；超时不是远端成功或停止确认。

Node SDK测试另外用Node>=22.18原生TypeScript擦除、node:worker_threads和Comlink官方node-adapter；它不证明浏览器模块Worker产物可用。

## RPC与业务校验：不要用普通对象接任意词

基础场景输入每行一个词，点击启动，真实Worker返回 `{ count, frequency: [{ value, count }] }`。默认包含 `__proto__` 与 `constructor`，这些应与普通词一样计数。旧写法 `const frequency = {}; frequency[value]++` 会读到继承属性，不能用于通用输入。本例用Map计数，再返回可克隆的行数组，不把输入当对象属性。

`summarize` 自建校验：最多10000项、每项必须是字符串且最多200个UTF-16单元；空字符串是允许的普通词，不会静默trim。通过Array.from检查稀疏数组的空洞，不能把缺失项漏过去。该限制是示例业务规则，不是Comlink内置安全保证；跨线程克隆在校验前已发生，生产接收大输入还需主线程边界/内存预算。

业务场景默认发送 `['rss', 42]`。Worker抛TypeError，Comlink把它传回主线程，页面显示失败并终止本批Worker。取消「发送含数字的非法数组」后再启动，返回三项统计。这里的新知识是**远端拒绝与恢复**，不是更大的数组。Node SDK还验证同一个远端端点在拒绝后可以继续处理合法请求；UI为了简单每批重建线程。

## transfer与proxy是两种不同的所有权

进阶场景先创建 `[5,10,15,20,25]` 的Uint8Array：

```ts
const sum = await remote.sumBytes(Comlink.transfer(bytes, [bytes.buffer]))
// sum = 75；发送方bytes.byteLength = 0，不能继续使用旧视图。
```

普通参数默认结构化克隆；transfer把buffer所有权交给接收线程，不是共享内存。需要继续使用原数据时先复制。worker sumBytes检查Uint8Array且最多1MiB，但消息发送前的内存预算仍由调用方负责。

函数不能结构化克隆，进度必须用 `Comlink.proxy(async step => ...)`。Worker每90ms等待一次report，确认后进入下一步；本例共10步，最终progressEvents应为1到10。序列等待是本例的顺序保证，不应泛化成“不await的回调必然乱序”。回调要短，避免大规模主线程工作。

worker progress校验整数1..20，在finally对收到的回调代理调用releaseProxy，避免正常完成后遗留独立回调端口。主线程仍持有最终remote的生命周期；中途终止时不能等待回调协作完成，直接结束Worker。

## 取消与释放：先请求，再物理终止

[`session-policy.mjs`](examples/session-policy.mjs) 先abort主线程等待、尝试 `remote[Comlink.releaseProxy]()`，无论同步释放请求是否抛错，都在finally `worker.terminate()`。清理前先从ref移走session，重复清理没有旧实例可处理。

**4.4.2的releaseProxy公开返回void。** 内部会发RELEASE，但调用方不能await到释放ACK；Promise.resolve(void)也不会变成ACK。页面如实显示「releaseProxy已请求；terminate已调用（不是释放ACK）」。立即terminate可能中断对端处理释放消息，物理线程结束才是本例的最终资源边界。不能声称已优雅关闭所有远端待定Promise。

`terminate()`不自动让远程调用Promise返回业务值。主线程用失败/abort/超时和任务做Promise.race，epoch在启动、取消与卸载时递增。每次回调和最终结果都检查epoch，旧会话不能盖掉新结果。监听器和本地超时在finally释放。取消后显示终止，而不是半截sum冒充成功。

取消按钮在进度期间可用；完成、失败、取消、卸载/切Tab都走清理。构造失败时没有Worker可清理。组件只管理本次Worker，不清全局线程或存储。错误或拒绝后可以重试新批次。

## 操作与预期观察

- basic：输入 `__proto__ / constructor / __proto__` 三行，启动；count3，前者count2。结果是Worker实算，无主线程词频兜底。
- business：保留非法数组开关启动，看到远端TypeError；取消开关再启动，返回count3；每批都会关闭线程。
- advanced：等待完成，sum75、detachedBytesOnMainThread0、progressEvents1..10。再启动并在进度时终止，文案保持取消；再次运行/卸载应无旧进度回写。

真实线程生命周期不能只用「组件消失」证明。提供给主控的validation/browser.spec.ts会在组件外监听page的worker创建/close，并核对page.workers为空；分别验证成功、取消、卸载和切Tab。测试尚未执行，不能把这些预期写成浏览器PASS。

## 常见错误与生产迁移

1. `wrap`不代表Worker就绪。缺expose可能一直挂起，保留本地有界等待和错误通道。
2. 不要转移后读原buffer，也不要把不属于本数据的buffer放进transfer列表。
3. 不传裸函数；回调proxy由使用方释放，正常完成和强制终止分开设计。
4. 不要只release不terminate，也不要把release请求写成确认。清理失败仍须结束本次线程。
5. 不要把AbortController自动当跨线程signal。当前取消是终止线程；协作式取消需要另行定义消息协议。
6. 不把4千项耗时当性能结论。实际业务需要测启动、克隆、计算和回收成本。
7. 不把MIT写给Apache-2.0依赖，分发时保留适用许可与NOTICE要求。

升级时固定包版本，对实际worker API重测参数拒绝、特殊词键、transfer分离、proxy回调、错误和清理。SDK套件复用真正worker-api.ts；策略测试单列，不替代RPC。没有匹配收据时sdk/build/browser仍NOT_RUN，真实Node Worker通过也不代表浏览器打包或CSP通过。

官方原文固定在本条official/readme.md，与本讲解分开；仓库响应明确禁止iframe嵌入，官网区域保留直达入口。参考：[官方4.4.2](https://github.com/GoogleChromeLabs/comlink/tree/v4.4.2)、[transfer/proxy/releaseProxy](https://github.com/GoogleChromeLabs/comlink#api)、[Worker终止](https://developer.mozilla.org/en-US/docs/Web/API/Worker/terminate)。
