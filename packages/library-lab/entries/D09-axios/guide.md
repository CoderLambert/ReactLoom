# Axios：把 HTTP 传输边界集中到实例

后台需要向多个服务发请求，同时统一请求头、取消和 HTTP 错误时，Axios 提供实例、拦截器和 `AxiosError`。本例以团队订阅列表为主线：先观察实例请求，再处理租户搜索竞态，最后限定读请求的失败重试。锁定 `axios@1.20.0`，MIT，自带 TypeScript 类型。

如果只需要少量 Fetch 请求，原生 Fetch 更简单；偏向 Fetch API 且需要声明式重试，可比较 [Ky](../D08-ky/guide.md)。Axios 不拥有远端缓存、去重和乐观更新，这些交给 [TanStack Query](../D07-tanstack-query/guide.md)。已有拦截器、适配器或 AxiosError 约定的工程，采用 Axios 更容易延续现有接口。

## 请求怎样经过 Axios

`client.get(path, config)` 合并库默认值、实例默认值和本次 config，经过请求拦截器，再进入 adapter；adapter 的 Promise 经响应拦截器后交给调用者。`AxiosResponse` 包含 `status/config/headers/data`，业务数据在 `response.data`，泛型不会验证 JSON。

请求拦截器后注册先执行，响应拦截器先注册先执行；`use` 返回的 id 只属于这次注册，销毁时 `eject(id)`。本例请求头 `X-Lab-Request: isolated` 会出现在实际 adapter 日志，成功响应拦截器也追加日志。实例隔离配置，不构成租户权限校验。

[实际客户端](examples/fixture-client.ts) 使用真正的 `axios.create`、`AxiosHeaders`、`AxiosError` 和拦截器。传输采用内存 adapter：`axios.getUri(config)` 合并 baseURL 和查询参数后，只接受 `https://lab.invalid`；三条列表、60/340ms 延迟、503/409 都是 fixture。没有 XHR、Cookie、CORS 或公网请求。自定义 adapter 必须自行将 HTTP 状态转为错误，本例显式抛 AxiosError，不能把这一层说成浏览器网络验证。

## 最小接入与完整迁入

在现有 React/TypeScript 应用中用 `pnpm add axios@1.20.0`。纯传输模块不需要 React；页面使用 React 的 hooks。Lab 的运行文件都是源码面板直接读取的原件：

| 文件 | 迁入位置与职责 |
| --- | --- |
| [fixture-client.ts](examples/fixture-client.ts) | 客户端工厂、受控数据、可取消延迟、响应校验、自建 GET 重试 |
| [example.tsx](examples/example.tsx) | 三个 level 的控件、请求代际和卸载清理 |
| [demo.tsx](examples/demo.tsx) | 宿主入口，直接导出页面；普通应用可以不带走 |

应用中导入 `AxiosWorkshop` 并渲染 `<AxiosWorkshop level="basic" />`。无需环境变量、服务或额外样式；`demo-controls` 只借用 Lab 的布局，可自行加 CSS。迁移生产时，删除 fixture adapter 和 `resetTransient`，把 `baseURL` 配置为受信任服务，保留实例隔离和下面的取消/清理逻辑。不要直接把用户输入作为 URL；令牌只注入核对过 origin 的实例，前端不能替代服务端租户授权。

最小真实网络调用形状如下（这是接入配方，Lab 不执行）：

```ts
import axios from 'axios'
const api = axios.create({ baseURL: '/api', timeout: 2000 })
const controller = new AbortController()
try {
  const response = await api.get('/feeds', {
    params: { tenant: 'a', q: 'React' },
    signal: controller.signal,
  })
  // 先校验 response.data，再更新业务状态。
} finally {
  // 页面离开或新请求开始时调用 controller.abort()。
}
```

生产 adapter 才执行 timeout 等传输规则。本例虽配置 `timeout: 2000`，内存 adapter 不实现 Axios 网络 adapter 的超时计时器，不能用它验证 2 秒超时。若接 Query，queryKey 应包含 tenant/q，并把 queryFn 的 signal 原样传入 Axios。

## 三个独立实验

### 1. 实例与拦截器

点击「GET 列表」，结果出现团队 a 的两条数据；日志应出现 `GET /feeds → 200`、`X-Lab-Request=isolated` 和 `response interceptor → 200`。切换团队 b，结果只有 `b1`。学习的是配置进入 adapter、响应取 `data` 并在边界校验，而不是手写一段成功文本。入口为 [页面](examples/example.tsx)，工厂为 [客户端](examples/fixture-client.ts)。

### 2. 搜索、IME 与取消所有权

输入 React 后提交，列表只剩 `a1`。中文输入法组合阶段不提交；结束组合后手动点 GET。组合状态用 ref 保存，不把半成品词交给请求。

「先慢后快竞态」先发 `/slow`，40ms 后发 React 查询。新请求先 abort 旧请求，再递增 generation；只有 token 匹配且未取消的响应能更新结果。取消负责释放工作，代际负责写回所有权，两者都保留。立即切换团队会清掉待启动的快请求 timer，避免旧租户任务回头覆盖新租户；点击「取消请求」同时清 timer、abort 并作废 token，结果显示「请求已取消」。

这验证的是可取消 fixture 的竞态。真实网络可能在 abort 前已经响应，因此生产也保留 token 校验。

### 3. GET 503 有界重试、POST 409 不重放

点击「GET 503 限定重试」，日志一次 503、一次 200，结果 `attempt: 2`；再点会重置本次故障计数，仍从 503 开始。`boundedGetRetry` 是本例自建循环，Axios 默认不重试。它只发 GET，只对 503 再试一次；取消、非 503 或两次都失败立即抛出。没有退避、Retry-After 或全局预算，生产应补充总期限与间隔，避免和 Query/队列的重试层叠。

点击「POST 409 不重试」，只出现一次 409，结果读 `AxiosError.response.status`。这是版本冲突，业务应该提示刷新或由用户决定，不无条件 `instance(error.config)` 重放写操作。`post(url, body, config)` 的 signal 在第三参数。

## 失败与生命周期

`axios.isCancel(error)` / signal aborted 是取消，不当系统故障。`axios.isAxiosError(error)` 后才读取 `response?.status`；没有 response 时不能假装 HTTP 500。列表校验拒绝非数组、超过 30 行或非法字段。生产日志不要打印整个 error/config，头可能包含凭据；当前日志只记方法、路径、状态和计数，最多十行。

页面卸载会递增 generation、abort 活跃控制器、清 timeout，再 dispose 自己的两个拦截器。effect setup 调用幂等 `install()`，支持 React StrictMode 的 setup→cleanup→setup；不能清理后复用一个永远没有拦截器的实例。没有全局 axios defaults，也不清别的组件的资源。离开 Demo Tab 或点「停止并卸载」都会走同一清理。

## 官方资料与验证范围

README 为官方仓库 `axios/axios` 的 v1.20.0 提交 `84a9f3b9a4f3244b8c8e818f557d64c7b964fb25` 原始英文全文，固定树没有官方中文 README。快照、摘要和来源在 README 页签及 [source-evidence.json](official/source-evidence.json)。中文官网入口本次返回 200 并跳转至 `axios.rest/zh/pages/getting-started/first-steps`；未从 Lab origin 证明 iframe 可用，状态 unknown，保留直达入口。

本地实际检查见 [local-validation.md](local-validation.md)。真实 SDK 定向测试导入页面同一个客户端文件，浏览器套件位于 [validation/browser.spec.ts](validation/browser.spec.ts)，由主控集成后运行。没有匹配正式收据前，`verification.json` 的 sdk/build/browser 均为 NOT_RUN。内存 adapter 的结果不证明真实后端、超时、上传进度、认证或 CORS 已验收。
