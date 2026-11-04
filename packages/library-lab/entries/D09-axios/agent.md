# D09 Axios — 工程手册

## 适用

需要实例、拦截器、`AxiosError` 和显式 adapter 的 HTTP 传输。浏览器与 Node 可以共用调用形状，但每种 adapter 的流和进度要单独看。

默认不重试、不缓存。服务端状态用 Query。轻量 Fetch 包装用 Ky。不要在 `axios.defaults` 上放令牌。

## 版本

`axios@1.20.0`，MIT，类型在包内。取消使用 `AbortSignal`。`CancelToken` 不要写进新代码。

钉这个版本是为了避开已知的短命恶意发布 `1.14.1` 和 `0.30.4`。锁定版本不能代替对历史锁文件的检查。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走 `makeFixtureClient`、`boundedGetRetry` 和 `validate`。生产替换 adapter，保留 `baseURL`、超时、`eject` 和代际。

路由依赖 `axios.getUri(config)`，这样 params 已经进入 URL。不要在 adapter 里只读未序列化的 `config.url`。

每次新的 503 演示调用 `resetTransient()`。POST 409 不进入重试循环。

## 不可删的清理

卸载时递增 generation、abort、清 timer，并 `dispose()` 以 `eject` 请求和响应拦截器。

写结果前比较 token 和 `signal.aborted`。取消文案与 `AxiosError` 的 HTTP 状态分开。

`boundedGetRetry` 只接受 503，最多两次 GET。abort 或非 503 立即抛出。

## 反例

- `axios.defaults.headers.common.Authorization`。
- 把用户字符串直接交给 `api.get`。
- 把 `AxiosResponse` 当成业务数组。
- 新代码使用 `CancelToken`。
- 组件渲染期间 `interceptors.use` 且不 `eject`。
- 捕获后无条件 `instance(error.config)`。
- `validateStatus: status => status < 500`。
- await 之后无条件 `setState`。
- `console.log(error)` 带出请求头。
- Query 键不含租户，却指望 Axios 隔离缓存。

## 测试断言

- 真实拦截器链能看见隔离头，adapter 拒绝非 `lab.invalid`。
- 自定义 adapter 的 409 被识别为 `AxiosError`。
- 预先 abort 的 signal 不会返回成功数据。
- `getUri` 同时包含 baseURL 和查询参数。
- GET 503 最多再试一次；POST 409 只有一次。
- 慢请求的结果不会覆盖后一次搜索。
- `tests/sdk.test.mjs` 导入真实 `axios`。无收据则 NOT_RUN。

## 真实限制

没有浏览器 XHR 往返，没有上传进度，没有 401 刷新，没有 Cookie。超时 2000ms 只覆盖单次 adapter 调用。租户过滤是 fixture 参数，不是授权。

`X-Lab-Request` 是演示头，不要把它当成会话。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
