# Axios 1.20.0｜实例、拦截器、取消和幂等重试

Lab 锁定 `axios@1.20.0`（MIT，自带类型）。它是带实例、拦截器和 `AxiosError` 的 HTTP 层。默认不重试、不缓存、不去重，也不会在 React 卸载时自动取消。研究笔记里的 Vite 工程和 `http://127.0.0.1:5173` 没有挂进 Library Lab。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。`makeFixtureClient` 用 `axios.create({ baseURL: 'https://lab.invalid', adapter, timeout: 2000 })`。adapter 先 `axios.getUri(config)`，因此路由看到的是已经合并 `baseURL` 和 `params` 的 URL。origin 不是 `https://lab.invalid` 就抛错。不访问外网。

请求拦截器设置 `X-Lab-Request: isolated`。响应拦截器把错误继续 reject。`dispose` 用 `eject` 卸下这两个 id。卸载时还会 abort、清 timer，并调用 `dispose`。

`boundedGetRetry` 最多两次 GET `/transient`。只有 503 才再试；第二次仍失败就抛出。调用方每次点击先 `resetTransient()`，让新的一次演示重新从 503 开始。POST `/conflict` 返回 409，adapter 用 `AxiosError.ERR_BAD_RESPONSE` 抛出，不进入重试函数。

- basic：建实例、发列表、看拦截器日志。
- business：租户 `a` / `b` 和标题过滤。先请求 `/slow`，40ms 后再请求带 `React` 的列表。`generation` 只有最新一次能写结果。IME 的 `composing` 为真时，GET 按钮不发请求。
- advanced：503 有限重试和 409 不重试。日志列出方法、路径、状态和次数。

`validate` 拒绝非数组、超长列表和租户不在 `a|b` 的行。取消用 `AbortController`，判断用 `axios.isCancel` 或 signal。没有 `CancelToken`。

没有挂载：401 单飞刷新、Blob 下载、`onUploadProgress`、Orval、真实 XHR。下面保留这些生产规则。

## 什么时候用

多个后端要不同的 `baseURL`、拦截器和错误类型，或者 Node 与浏览器都要同一套调用风格时用 Axios。一两个请求用 `fetch`。想要更接近 Fetch 的 ESM 包装用 D08 Ky。缓存用 Query 或 RTK Query。并发用 p-queue。

| 任务 | 谁负责 |
| --- | --- |
| 头、超时、`AxiosError` | 受控实例 |
| 去重、失效、乐观更新 | TanStack Query |
| 批量 RSS 的同时启动数 | p-queue，每次尝试单独入队 |
| 运行时 JSON 形状 | Zod，而不是 `response.data as Feed[]` |

## 模型

调用顺序是：库默认值，然后实例默认值，然后这次请求的 config。合并不是对所有字段做深合并。`data` 属于这一次请求。

请求拦截器后注册的先执行。响应拦截器先注册的先执行。每个 `use` 都返回 id，生命周期结束时 `eject`。在组件函数体里注册会在 Strict Mode 下叠多层。

adapter 决定真正的传输。Lab 换上了内存 adapter，所以日志里的状态是 fixture 写的，不是公网往返。浏览器默认路径与 Node HTTP、Fetch adapter 在流、重定向和进度上并不相同，换 adapter 要重测。

`validateStatus` 默认只接受 2xx。改成 `status < 500` 会让 409 和 422 进 `then`。Lab 保持抛错。

`timeout` 默认 `0` 表示不另设超时。Lab 设 2000ms，这只限制单次尝试。重试是 `boundedGetRetry` 自己的循环，不是 Axios 内置功能。

`allowAbsoluteUrls: false` 挡的是绝对 URL 绕过 `baseURL` 的一类问题。它不检查 `../`、重定向或服务端 SSRF。业务路径仍要白名单。

2026-03-31 曾有短暂的恶意版本 `axios@1.14.1` 和 `axios@0.30.4`。那是供应链事件，不是 1.20.0 的 API 行为。固定到 1.20.0 也不证明历史安装记录干净。若锁文件里出现过那些版本，按维护者说明做事件处理，而不是只改 package.json。

## 三层示例

### 基本

切换租户会立刻 GET。日志里应看到拦截器之后的状态码。实例不是“认证隔离”：fixture 只按查询参数过滤，服务端仍要鉴权。

### 业务

标题过滤使用 `params`，由 `getUri` 放进 URL 再交给 adapter。先慢后快时，慢请求的 `token` 已经过期，不能覆盖新 JSON。取消会清掉等待中的 timer 并 abort，结果文案是「请求已取消」，不是 HTTP 500。

组合输入期间按钮不提交。生产若要防抖，放在 `compositionend` 之后，并继续保留代际。

### 进阶

「GET 503 限定重试」的日志应出现一次 503 和一次 200。再点一次仍从 503 开始，因为计数被重置。「POST 409 不重试」只应有一条 409。`axios.isAxiosError` 用来读 `response.status`。

## 反例

### 反例 1：全局默认令牌

```ts
axios.defaults.headers.common.Authorization = `Bearer ${token}`
await axios.get('https://third-party.example/data')
```

```ts
const api = axios.create({ baseURL: 'https://lab.invalid', timeout: 2000 })
const id = api.interceptors.request.use(config => {
  config.headers.set('X-Lab-Request', 'isolated')
  return config
})
```

退出时 `eject(id)`。令牌只加到核对过 origin 的实例上。

### 反例 2：相信 baseURL 能防 SSRF

```ts
api.get(userPath)
```

```ts
api.get('/feeds', { params: { tenant: selected, q: value } })
```

`userPath` 可以是绝对地址或 `../`。Lab 的 adapter 再查 origin，这是第二层，不是完整的服务端防护。

### 反例 3：把 AxiosResponse 当数组

```ts
const rows = await api.get('/feeds')
rows.map(row => row.id)
```

```ts
const response = await api.get('/feeds')
validate(response.data)
```

### 反例 4：CancelToken

```ts
const source = axios.CancelToken.source()
```

```ts
const controller = new AbortController()
await api.get('/feeds', { signal: controller.signal })
controller.abort()
```

取消后仍要看 generation。`axios.isCancel` 与 HTTP 错误分两条文案。

### 反例 5：渲染期间注册拦截器

在 effect 里记住 id，清理时 `eject`。Lab 在 `useState` 创建 client，卸载时 `dispose`。

### 反例 6：所有错误都重放 config

```ts
instance(error.config)
```

这会重放 POST。Lab 只在 GET、状态恰好 503、且尝试次数未用尽时再调用 `client.get`。

### 反例 7：validateStatus 放过 4xx

422 会变成成功。保持默认，业务上要读 409 时在 `catch` 里看 `error.response.status`。

### 反例 8：await 之后无条件 setState

```ts
const response = await client.get('/feeds', { params, signal })
setResult(JSON.stringify(response.data))
```

```ts
if (token === generation.current && !signal.aborted) setResult(...)
```

自定义 adapter 可以忽略 signal，所以两道都要。

### 反例 9：日志打印整个 error

`error.config.headers` 可能含 Authorization。只记状态、路径模板和耗时。

### 反例 10：下载不回收 Blob URL

`URL.createObjectURL` 用完 `revokeObjectURL`。Node 大响应用 `responseType: 'stream'` 和限额。`maxContentLength` 默认无限制，要按产品设上限。Lab 的列表还有 30 条的校验。

### 反例 11：Query 键不含租户

```tsx
useQuery({ queryKey: ['feeds'], queryFn: () => client.get('/feeds', { params: { tenant, q } }) })
```

键写入 `tenant` 和 `q`，`signal` 传入 Axios。登出清的是 Query 缓存，不是指望 Axios 实例忘了数据。Axios 不拥有缓存。

## 组合

**Query + Zod**：`queryFn` 里 `client.get`，然后 `schema.parse(response.data)`。409 映射到界面，不自动重试。Lab 的 `validate` 是手写边界，没有装 Zod。

**p-queue + Orval**：生成的 mutator 使用同一个实例。队列限制启动频率。重试放在队列任务里面并且只针对幂等 GET，避免两层放大。`queue.clear()` 不会取消已经在 adapter 里的请求，信号要单独 abort。

## 生产核对清单

1. 没有 `axios.defaults.headers.common.Authorization`。
2. 每个实例在销毁时 `eject` 全部拦截器。
3. 取消使用 `AbortSignal`，结果写回看代际。
4. 重试只覆盖约定的幂等方法、状态和次数；POST 409 不重试。
5. 每次重试演示或每次新的故障注入都重置计数，避免测试互相污染。
6. `getUri` 或最终 URL 经过 origin 检查后再发出。
7. 错误遥测不含头和正文。
8. `timeout`、`maxContentLength`、`maxBodyLength` 有明确数字；默认 0 和 -1 要被覆盖。
9. 进度回调不代表服务器已落盘。
10. 依赖锁定在 1.20.0，并确认历史构建没有 1.14.1 / 0.30.4。

`xsrfCookieName` 与 `xsrfHeaderName` 只在你们的后端确实读这个头时才有意义。前端单独改名不会完成 CSRF 防护。Lab 的 adapter 不发 Cookie。

下载 CSV 若以后加上，用 `responseType: 'blob'`，点击后创建对象 URL，用完立刻 `revokeObjectURL`。不要把 Blob 留在 state 里跨页面。Node 侧不要用 `arraybuffer` 把未知大小的 RSS 全读进内存。

多个并行 401 应共享一个刷新 Promise。刷新请求使用没有拦截器的实例。失败后清空身份并停止再试。Lab 没有这一段，接入时要单独测试“十个请求只刷新一次”。

## 升级

钉 `1.20.0`。从 0.x 迁出时删除 `CancelToken`，把 `response` 的使用改成 `response.data`，把全局 defaults 拆成按后端划分的实例。

1.16 和 1.19 的发布说明里有 Fetch adapter 与长度限制相关变更。升级越过这些版本时重测 `maxContentLength` 和自定义 adapter。1.20.0 本身不是“已免疫供应链”的证书。

`@types/axios` 不需要。`index.d.ts` 随包提供。

拦截器 id 存在闭包里，`dispose` 只卸自己注册的那两个。不要 `eject` 一个猜出来的数字。响应拦截器目前原样拒绝，是为了让 `AxiosError` 到达 `boundedGetRetry` 和界面。若以后在拦截器里把 409 转成普通 `Error`，重试判断和 `isAxiosError` 会一起失效。

租户切换会立刻搜索空字符串。这会 abort 上一次标题过滤。结果区在代际匹配前保持上一句或变成「请求进行中」。不要在 `onChange` 里同步 `setResult` 成另一租户的旧 JSON。

## 验收

- 请求经过 `axios.create`、两个拦截器和自定义 adapter。
- `getUri` 同时包含 `baseURL` 与 `params`，adapter 才能按路径分支。
- 预 abort 的 signal 不会把 200 写成结果。
- GET `/transient` 先 503 再 200，第二次点击仍先 503。
- POST `/conflict` 是单次 409，`axios.isAxiosError` 为真。
- 先慢后快只保留后一次校验过的列表。
- 卸载调用 `dispose`，拦截器不累积。
- `tests/sdk.test.mjs` 导入真实 `axios`。无收据则 NOT_RUN。

练习：把三个组件里的 `axios.defaults` 收成两个实例，20 次连续筛选只显示最后一次。再让 10 个并行 401 共用一个刷新 Promise，刷新失败不再递归；POST 503 不自动重发。

## 故障定位

401 与 403 要分开：过期登录、角色不够、Cookie 的 CORS、CSRF。拦截器若在刷新时再次进入自己，会循环。Lab 没有刷新逻辑，接入时用单独的、没有业务拦截器的实例去换令牌，并给原请求加一次标记。

`ERR_CANCELED` 是用户或新请求取消的，不要弹成系统故障。`ECONNABORTED` 才更接近超时。`status` 为空和 `response.status === 503` 是两类。

409 展示当前版本并让人决定，不自动覆盖。422 读字段错误。浏览器 CORS 由服务端响应决定，Vite 代理只存在于开发，不能写成 Axios 的缺陷。

上传进度的 `total` 可能缺失，也不等于服务器已落盘。Node 大响应用 `responseType: 'stream'`，并设置 `maxContentLength`。官方默认的最大长度是无限制，Lab 用 30 条的校验补了一道应用边界，生产仍要在网关限制解压后的大小。

`params` 里的 `null` 和数组如何序列化，要和 API 合同一起测。`withCredentials` 默认不会跨域带 Cookie。打开它之前先写清 CSRF。

适配器日志只保留方法、路径、状态和次数，最多十条。这是界面上的环形缓冲，不是审计日志。生产日志还要去掉查询串里的令牌。

`axios.get` 的配置在第二个参数，`post` 的请求体在第二个参数、配置在第三个。把 `{ signal }` 误传成 POST 的 body，会把取消控制器序列化进 JSON。Lab 的冲突按钮把 `{ signal }` 放在第三参。

自定义 `validate` 拒绝租户不在 `a` 或 `b` 的行。adapter 本身会把未知租户收成 `a`。两层都在，是为了防止以后有人改 adapter 时放进非法行。不要只留其中一层。

`makeFixtureClient` 的 `onTrace` 在 adapter 里同步调用。React 18 允许在事件处理里 `setState`。不要在渲染阶段创建 client，否则日志 `setLogs` 会在渲染中触发更新。示例把工厂放在 `useState` 的初始化函数里，只创建一次。

列表校验限制 30 条。fixture 只有三行，上限是为了挡住以后把 adapter 换成会返回大数组的实现。超过上限时结果区是错误字符串，不是半截列表。

## 资料

- https://axios-http.com/docs/intro
- https://axios-http.com/docs/interceptors
- https://axios-http.com/docs/cancellation
- https://axios-http.com/docs/req_config
- https://axios-http.com/docs/config_defaults
- https://axios-http.com/docs/handling_errors
- https://github.com/axios/axios/releases/tag/v1.20.0
- https://github.com/axios/axios/blob/v1.20.0/package.json
- https://github.com/axios/axios/issues/10636
- https://github.com/axios/axios/tree/v1.20.0/lib/core
