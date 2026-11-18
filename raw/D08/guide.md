# Ky：给来源搜索统一 HTTP 失败与重试策略

来源管理页需要加载列表、随关键词搜索，并在服务暂时不可用时有限重试。原生 Fetch 收到 409 仍会正常 resolve；每处手写状态判断、超时与重试容易不一致。Ky 把这些传输规则放进一个实例，本例保留 React 对结果状态的所有权。

固定 `ky@2.2.0`，MIT、ESM，Node 需要 >=22。已有许多 Fetch 请求需要一致策略时值得引入；只有一两个请求可以继续用原生 Fetch。已有 Axios 拦截器与上传进度设施时先评估迁移成本。Ky 不提供远端状态缓存（见 D07 TanStack Query），也不提供启动频率/并发调度（见 D04 p-queue）。重试无法保证写操作只执行一次。

## 从调用到结果的模型

`ky.create(options)` 创建可复用客户端；`.get(url, options)` 构建 Request 并调用 Fetch；`.json<unknown>()` 读取正文。非 2xx 默认成为 `HTTPError`，符合方法、状态码与次数规则才重试。每次尝试的 `timeout` 与包含重试等待的 `totalTimeout` 是两层预算，读取正文的快捷方法也有超时约束。

React 保存 draft、已接受列表和当前请求状态。Ky 不保存列表。`AbortController` 让旧传输停止；generation ticket 保证过期调用不能回写 React。`validateSources` 是本例业务代码，检查列表长度、字段及 HTTPS URL，**不是 Ky schema 能力**。TypeScript 的 `.json<Source[]>()` 不检查运行时数据。

本例真实导入 Ky，传入自建 `fetch` 返回内存 Response。它只接受 `https://lab.invalid`，延迟可取消，不连接网络。Ky 仍真实执行 HTTP 错误、重试、超时、体积限制和正文读取；fixture 不证明浏览器 CORS、Cookie、网络断线、真实服务端契约或生产延迟。

## 最小接入：先统一策略，再交给业务校验

```ts
import ky from 'ky'
import { validateSources } from './transport.mjs'

const api = ky.create({
  timeout: 1200,
  totalTimeout: 2500,
  retry: { limit: 1, methods: ['get'], statusCodes: [503], backoffLimit: 400 },
})

export async function loadSources(signal: AbortSignal) {
  const raw = await api.get('https://your-api.example/sources', { signal }).json<unknown>()
  return validateSources(raw)
}
```

这里 `limit: 1` 是初次之外再试一次，最多两次。只允许 GET 503，POST/PATCH 不加入，409 显式不重试。示意生产地址需要替换成你自己的 API，并配置服务端 CORS；本地 Demo 使用 fixture。

## 三个实验：输入、变化和结果

### 1. GET 与运行时校验

点击「GET 来源列表」，应显示 React 工程、安全实践、RSS 标准三条 HTTPS 来源。请求进入 Ky 后，JSON 经 `validateSources` 再写入列表。点击取消会对当前 controller 调用 abort；已完成的请求不再可取消。关键文件：[example.tsx](examples/example.tsx) 的 `search` 与 [transport.mjs](examples/transport.mjs) 的 `validateSources`。

### 2. 搜索取消与新旧请求所有权

关键词 `react` 应筛到 React 工程；`不存在` 应为 0 条。点击「模拟先慢后快的搜索」，slow 延迟 460 ms 返回安全实践，45 ms 后触发 fast，fast 再延迟 45 ms 返回 React 工程。最终状态含 `关键词：fast` 且只有 React 工程；旧结果不能替换它。两者刻意返回不同内容，避免用相同列表掩盖竞态。

新的搜索先取消上次并清掉待执行模拟 timer，再增加 ticket。手动取消也清 timer，避免取消后自动又启动 fast。卸载时 ticket 增加、abort、清 timer；这是本组件拥有的资源，不清全局网络或存储。输入法 composition 期间提交不发请求，结束后再次提交才搜索。IME 与卸载属于浏览器验收，不从 Node 测试推断。

### 3. 恢复策略与协议边界

|操作|应观察到的结果|归属|
|---|---|---|
|GET 503 → 有限重试|第一次 503，第二次成功，实际次数 2；每次点击重置计数|Ky 重试 + fixture 计数|
|POST 409 → 不重试|HTTP 409，单次请求|Ky HTTPError，业务选择不重试|
|200 ms 响应 → 30 ms 超时|超时，未重试|Ky timeout + fixture 延迟|
|200 JSON → 自建 schema 拒绝|只能使用 HTTPS 来源|HTTP 成功，业务校验拒绝 javascript:|
|响应体 1 KiB → 100 B 上限|响应体超出限制，停止解析|Ky maxResponseSize|
|DELETE 204 空正文|DELETE 204，不调用 json()|协议约束，业务选择不解析|

HTTPError 用 `isHTTPError` 分支；v2 的 `error.data` 已读取错误体，不再调用 `error.response.json()`。本例只显示状态码，不打印凭据。取消用 AbortError，超时用 `isTimeoutError`，超限用 `isResponseSizeError`。体积上限作用于读取的解压后字节，不是整个进程的内存上限。204 没有 JSON 正文。

## 完整迁入项目

安装 `pnpm add ky@2.2.0`，已有 React 应用需支持 ESM、DOM 的 Request/Response/AbortController。示例可放 `src/features/sources/`：复制 `examples/example.tsx`、`transport.mjs` 和 `transport.d.mts`，保持相对路径；`demo.tsx` 仅是 Lab 默认导出适配，不是生产必需。`transport.d.mts` 给 TS 提供 Source 和函数类型；模块解析用 bundler 或 NodeNext。JSX 需 React automatic runtime。没有密钥、环境文件、样式表、后台服务或外部资源；`demo-controls` 只是可选布局 class。

在页面导入默认组件并传 `level="basic" | "business" | "advanced"`。生产接入将 `ky.create` 中的 `fetch: fixture.fetch` 去掉、把固定 URL 改为自己的可信 API，保留 `validateSources`（可换成 Zod 等 schema）、abort、ticket 和清理。fixture 的 `.invalid` 拒绝规则只限制本地适配器，不能复制后宣称已实现生产 URL 白名单或 SSRF 防护。

需要身份头时在统一客户端实现 origin/path 白名单后再注入，别给任意绝对 URL 附令牌。v2 hook 形参是 state 对象，例如 `({ request }) => ...`；本例没有实现授权、Cookie 会话、OAuth 刷新和 beforeRetry hooks。v2 用 `prefix`，不要复制 v1 的 `prefixUrl`。本例用绝对 URL，没有依赖 prefix/baseUrl 的路径拼接。

与 Query 集成时在 queryFn 接收其 signal 并传给 Ky，queryKey 含用户及搜索词，解析后返回数据；不要把查询列表再存一份 Zustand。避免 Query 与 Ky 双重重试导致放大请求次数。速率配额需要限制每一次真实尝试，不能只限制外层首次调用。

## 核实与复现

[SDK 测试](tests/sdk.test.mjs) 真实导入 Ky 与 UI 共用 transport，覆盖筛选、每次重新两次尝试、POST 单次、外站拒绝、超时、取消、体积、schema 和 204。[policy 测试](tests/policy.test.mjs) 只验证自建校验，不算 SDK 证据。实际命令、状态与日志见 [本地验证](local-validation.md)。浏览器交互与正式收据分开记录。

[官方原文](official/readme.md) 固定 v2.2.0 对应提交；该提交根目录无官方中文 README，保留英文原文字节。官网入口为 [官方仓库](https://github.com/sindresorhus/ky)，实际响应含 `X-Frame-Options: deny` 与 `frame-ancestors 'none'`，不能嵌入，使用直达。证据见 [来源记录](official/source-evidence.json)。
