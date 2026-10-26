# Ky v2.2 · 标准 Fetch 上的可控传输层

## 选择条件

Ky 是原生 ESM、基于 Web Fetch 的 HTTP 客户端，负责统一请求/响应、HTTPError、有限重试、超时、Hooks 与 JSON 输入。v2.2.0 MIT、Node >=22。它不是 TanStack Query 的缓存、p-queue 的速率限流或服务器端业务幂等方案。项目已经成熟使用 Axios 拦截器时，不应机械替换。

## 安装与入口

~~~sh
pnpm add ky@2.2.0
~~~

源码：examples/example.tsx；examples/demo.tsx 只是入口转发。v2 使用 prefix 而非 v1 prefixUrl；推荐审查 baseUrl URL 语义，不允许用户未经检查输入覆盖 API origin。

~~~ts
import ky from 'ky';
const api = ky.create({timeout: 1200, totalTimeout: 2500,
  retry: {limit: 1, methods: ['get'], statusCodes: [503]},
});
const unknownBody: unknown = await api.get(url, {signal}).json();
~~~

TypeScript JSON 泛型不是运行时校验；业务逻辑仍需验证对象结构。对于 204，读取 Response.status 而非调用 .json() 解析空正文。HTTPError 的 data 在 v2 已被读取，不能再次依赖 error.response.json()。

## 三层实际例子

**基础**：真实 Ky GET 并解析 JSON；返回的来源列表使用运行时自定义 validator 校验，结果在 React 页面展示。

**业务**：慢搜索先发起，然后快速新搜索；AbortController 取消旧请求，generation 标识保护异步完成后的 UI 所有权。中文搜索通过显式提交，不按每个拼音合成字节发请求。仅模拟业务数据，Ky 的请求/Response/取消处理为真实运行。

**进阶**：GET 第一次返回 503，Ky 按配置重试后得到成功；POST 返回 409，显式 retry.limit=0；返回 1KiB 内容但 maxResponseSize=100，读取 body 时应拒绝；DELETE 204 不尝试 JSON 解码。所有 fixture 内部 fetch 限定为 https://lab.invalid，永不访问外部网络或付费 API。页面上必须明确“本地传输 Fixture”，不能称真实 HTTP 集成后端测试。

## 错误边界

- timeout 是单次尝试预算，totalTimeout 是整个请求及重试的预算；两者不能混为一个。
- retry.limit 是额外重试次数，不是请求总次数。默认仅某些幂等方法安全重试，POST 不能随便重放。
- 401/403/409/422 通常需要鉴权或业务处理，不应通用重试；503 和 429 也必须遵守合法 Retry-After 与有限预算。
- 网络错误与 HTTPError 不同；AbortSignal 表示用户取消时不要显示“服务端故障”。
- 请求 JSON 不是 Schema 校验；maxResponseSize 仅限制读取数据量，不取代内存/业务复杂度限制。
- 不向日志展示 API token、完整请求头、私人响应体；当前示例刻意不提供密钥。

## 五个反模式

1. 在组件 render 调用 Ky → 重渲染重复发请求：放在事件/效果或 Query 的 queryFn。
2. 只设置 timeout 就假定总重试预算有上限 → 使用 totalTimeout、retry.limit 与信号组合。
3. 对 POST 默认重试 → 多次创建/扣款：先定义幂等键、服务端业务确认和冲突策略。
4. 将 .json<MyType>() 当运行时断言 → 在进入 Domain Model 前 parse/validate。
5. 仅 abort 不比较响应代次 → 异步解码和逻辑转换仍可能旧结果回写：generation/epoch 双保险。
6. 遇到 409 再调用 error.response.json() → v2 body 可能已被消费；读取 HTTPError.data 并验证 shape。

## 与其他库组合

TanStack Query 负责远程数据缓存、失效、取消与写入回滚；Ky 负责实际 HTTP。p-queue 管请求启动频率；必须明确重试发生在哪层，避免配额统计漏计。Zod 适合作为 Ky JSON unknown 到业务 DTO 的运行时边界。

## 证据要求

真实 SDK 的 Node 定向测试为 tests/sdk.test.mjs，包含 fixture fetch；无真实外网。浏览器需测搜索竞态、取消按钮、重试结果及响应上限。代码已提交不代表 SDK 实测通过；verification.json 仍 NOT_RUN。

官方：https://github.com/sindresorhus/ky/blob/v2.2.0/readme.md
