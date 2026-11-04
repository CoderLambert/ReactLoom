# Ky 2.2.0｜Fetch 上的超时、有限重试和结果所有权

Lab 锁定 `ky@2.2.0`（MIT，ESM，Node `>=22`，生产依赖 0）。它把非 2xx、JSON、超时和受控重试收成一个客户端。它不是服务端缓存，不是并发队列，也不是上传协议。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。`ky.create` 使用自定义 `fetch`。这个 fetch 只接受 `https://lab.invalid`，其他 origin 直接抛错。响应是进程内的 `Response`，不连接外网。

实例选项：`timeout: 1200`，`totalTimeout: 2500`，`retry.limit: 1`，`methods: ['get']`，`statusCodes: [503]`，`backoffLimit: 400`。`limit: 1` 表示额外重试 1 次，加上第一次，GET 503 最多两次尝试。POST 不在 methods 里。

- basic：`GET /sources`，`validateSources` 检查数组长度、字段和 `https:`。
- business：关键词搜索。新的搜索 abort 上一次，并用 `generation` 丢掉过期回写。可以先发 `q=slow`（约 460ms）再很快发 `q=fast`。IME 用 `composing` ref，组合未结束时提交按钮不发请求。卸载时 abort 并清掉计时器。
- advanced：`GET /transient` 每次点击都 `resetTransient()`，所以第一下仍是 503，随后成功并报告次数。`POST /follow` 带 `retry: { limit: 0 }`，409 不重试。`GET /huge` 设 `maxResponseSize: 100`，正文是 1024 字节。`DELETE /removed` 看状态 204，不调用 `.json()`。

错误文案走 `isHTTPError`、`isResponseSizeError` 和 `AbortError`。不打印请求头。v2 的 `HTTPError.data` 已经读过错误体，不能再 `response.json()`。界面也写明 v2 用 `prefix`，不再用 `prefixUrl`。

没有挂载：真实 loopback 服务器、`beforeRequest` 注入 Authorization、`hooks.beforeRetry`、OAuth 刷新。那些是生产边界，当前 fixture 用域名拒绝外站。

## 什么时候用

多个 `fetch` 都要统一的状态码异常、JSON、超时和有限重试时，用一个 `ky.create()`。一两个调用继续用原生 `fetch`。已有完整 Axios 拦截器和上传进度时，不必为了“更轻”迁走。Node 专有 Agent、HTTP/2 细节看 Got 或 Undici。缓存和失效用 TanStack Query。速率和优先级用 p-queue。

重试不是端到端恰好一次。写操作要有服务端幂等键或 409。客户端 `retry: 3` 可以重复扣款。

## 模型

`ky.create` / `ky.extend` 合并选项，解析 `baseUrl` 或 `prefix`，跑 hooks，再调用 fetch。非 2xx 变成 `HTTPError`。是否重试看方法、状态码、次数和 `Retry-After`。

| 选项 | Lab 里的含义 |
| --- | --- |
| `timeout` | 单次尝试的预算。默认约 10 秒。不是整段重试的总时长 |
| `totalTimeout` | 包含重试等待的总预算。只设 timeout 会让多次尝试加得很长 |
| `retry.limit` | 额外重试次数。默认 2 表示最多 3 次尝试 |
| `retry.methods` | 允许重试的方法。默认不含 POST |
| `retry.statusCodes` | Lab 只放了 503。不要放 401、403、409、422 |
| `prefix` | v2 的简单前缀。v1 的 `prefixUrl` 已改名 |
| `baseUrl` | 标准 URL 解析。前导斜线和末尾斜线会影响结果 |
| `maxResponseSize` | 读取 body 时的解压后字节上限。不是堆内存上限 |
| `HTTPError.data` | 已解析的错误体。不要再读 `response.json()` |

`HTTPError` 表示已经收到状态码。超时是 Ky 的预算。用户 `abort()` 用取消文案，不要说成 500。

`json<T>()` 的泛型不是 schema。Lab 在 `json<unknown>()` 之后调用 `validateSources`。204 没有 body，不能 `.json()`。

`beforeRetry` 发生在已经决定重试之后。要不要重试看 `retry` 配置和 `shouldRetry`。`ky.extend` 会叠加 hooks，重复注册会重复加头。

## 三层示例

### 基本

「GET 来源列表」返回三条 HTTPS 来源。取消按钮 abort 当前 controller。状态句会在代际仍匹配时更新。

### 业务

提交框在非组合态搜索。`slow` 然后 `fast` 时，慢的那次被 abort 或被代际丢掉，列表停留在后一次。只 abort 不够：若响应已经开始解析，ticket 仍要相等才 `setData`。

### 进阶

四个按钮分别覆盖 503 重试、409 不重试、响应体上限和 204。每次重试演示都重置计数，避免第二次点击直接看到上一次的成功。409 的结果应是 HTTP 409，而不是“意外成功”。超限应走到 `isResponseSizeError`。204 的句子里包含状态码。

## 反例

### 反例 1：fetch 不看状态码

```ts
const data = await fetch(url).then(response => response.json())
```

```ts
const data = await ky.get(url).json()
```

非 2xx 会抛。`throwHttpErrors: false` 时必须自己看 `response.ok`。

### 反例 2：v1 的 prefixUrl

```ts
ky.create({ prefixUrl: '/api' })
```

```ts
ky.create({ prefix: 'https://lab.invalid', timeout: 1200, totalTimeout: 2500 })
```

Lab 直接传绝对 URL，没有混用两种前缀。

### 反例 3：v1 的 hook 形参

```ts
hooks: { beforeRequest: [request => request.headers.set('x', '1')] }
```

v2 收到的是 state：`({ request }) => { request.headers.set('x', '1') }`。

### 反例 4：再读一遍错误体

```ts
catch (error) { await error.response.json() }
```

```ts
if (isHTTPError(error)) useAlreadyParsed(error.data)
```

### 反例 5：204 调用 json()

```ts
await ky.delete(url).json()
```

```ts
const response = await ky.delete(url, { retry: { limit: 0 } })
if (response.status === 204) done()
```

### 反例 6：timeout 当成总预算

两次 503 会各自用满 `timeout`。加上 `totalTimeout`，并限制 `Retry-After`。

### 反例 7：POST 默认重试

```ts
ky.post(url, { json: body, retry: 3 })
```

Lab 的实例方法列表只有 `get`，冲突按钮再把 `limit` 设为 0。付款接口保持不重试，除非服务端写明幂等键。

### 反例 8：泛型代替校验

`json<Source[]>()` 不会拒绝 `javascript:` URL。用 `validateSources` 或 Zod。

### 反例 9：baseUrl 上仍接受任意绝对地址并附带令牌

先解析 `request.url`，只允许约定 origin 和路径，再设置 Authorization。Lab 的 fixture 在进入 Ky 重试之前就拒绝非 `lab.invalid`。这不是 SSRF 防护的全部：服务端抓取还要看重定向和地址。

### 反例 10：只 abort，不看代际

慢响应若在 abort 前完成解析，仍可能 `setData`。Lab 同时比较 `ticket` 和 `generation.current`。

## 组合

**Query + Zod**：queryKey 含用户和搜索词。`queryFn: ({ signal }) => client.get(url, { signal }).json()`，再 parse。401 清该用户缓存。Ky 不保存列表副本。

**p-queue**：队列限制同时启动数，Ky 限制单次超时和重试。每次真实尝试都要经过队列，否则重试会绕过限额。MSW 可以模拟 409 和 503，模拟通过不等于服务端契约通过。

## 生产核对清单

1. 版本是 2.2.x 的具名选项：`prefix` 或 `baseUrl`，没有 `prefixUrl`。
2. POST/PATCH 不在默认重试方法里；409 显式 `retry.limit: 0`。
3. `timeout` 与 `totalTimeout` 都设置了。
4. 错误展示不包含 Authorization 和正文秘密；用 `error.data` 而不是第二次 `json()`。
5. 204/205 不解析 JSON。
6. `maxResponseSize` 加在会读 body 的调用上；超限不自动重试。
7. 搜索同时 abort 和代际；卸载清理 controller 和 timer。
8. IME 组合期间不提交。
9. 绝对 URL 不能借 baseUrl 把令牌带到别的 origin。

## 升级

钉 `2.2.0`。从 v1 到 v2：`prefixUrl` 改名；hooks 改为 state 对象；错误体进 `HTTPError.data`；增加 `totalTimeout`；2.2 增加 `maxResponseSize` 与 `isResponseSizeError`。`init` 里的 header 名按小写处理，不要再 `delete options.headers.Authorization`。

`ky-universal` 已是历史包。Node 22 用内置 fetch。CJS 项目用动态 `import('ky')` 或先迁 ESM。

默认 `retry.limit` 是 2。Lab 收成 1，并且只对 GET 503。升级时不要让依赖覆盖回“所有 5xx 都重试”。

## 验收

- GET 来源只保留带 `https:` 的合法对象，超过 30 条失败。
- 先慢后快时界面不显示慢查询的结果。
- 卸载或取消得到 AbortError 文案，不写成服务器故障。
- 每次「503 → 有限重试」都从第一次 503 开始，最终成功次数可解释。
- POST 409 不出现第二次成功请求。
- 1024 字节正文配 100 字节上限时走响应体错误。
- DELETE 204 不调用 `json()`。
- `tests/sdk.test.mjs` 用真实 Ky 覆盖 503 与 409，以及超限和 204。无收据则 NOT_RUN。

练习：把散落的 `fetch` 收成一个 `ky.create`，外站绝对地址在 `beforeRequest` 拒绝。再把 v1 hook 改成 state 对象，并为 204、超时、超限、取消各留一条断言。

## 资料

- https://github.com/sindresorhus/ky/blob/v2.2.0/readme.md
- https://github.com/sindresorhus/ky/blob/v2.2.0/package.json
- https://github.com/sindresorhus/ky/releases/tag/v2.2.0
- https://github.com/sindresorhus/ky/releases/tag/v2.0.0
- https://github.com/sindresorhus/ky/tree/v2.2.0/source
- https://www.npmjs.com/package/ky
