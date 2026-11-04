# D08 Ky — 工程手册

## 适用

已有 `fetch` 的浏览器或 Node 22，需要统一非 2xx、JSON、超时和有限重试。一个 `ky.create()` 收口传输策略。

缓存、去重、乐观更新用 TanStack Query。并发和区间限额用 p-queue。单次调用不必引入。不要把重试当成恰好一次提交。

## 版本

`ky@2.2.0`，MIT，ESM。v2 使用 `prefix`，错误体在 `HTTPError.data`，并用 `timeout` 加 `totalTimeout`。2.2 提供 `maxResponseSize` 和 `isResponseSizeError`。

不要安装已归档的 `ky-universal`。不要把默认分支的 README 当成 2.2.0 的选项表。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走 `createFixtureTransport` 的 origin 限制、`validateSources`、generation 和 advanced 里对 503/409/204/尺寸的分法。生产把 fixture `fetch` 换成真正的 fetch，保留 `ky.create` 的重试表。

实例重试：`limit: 1`、仅 `get`、仅 503。单次冲突和超限请求再传 `retry: { limit: 0 }`。

搜索保持 abort 当前 controller 并递增 ticket。卸载时两者都做，并清理 `setTimeout`。

## 不可删的清理

`useEffect` 清理函数增加 generation、abort、清除 timer。过期 ticket 不能 `setData` 或改写 advanced 结果。

每次演示 503 前调用 `resetTransient()`，否则第二次点击不再出现第一次 503。

`describeError` 对 `isHTTPError` 只报告状态码，不展开私密正文。`HTTPError` 上不要再次 `response.json()`。

DELETE 204 使用 `response.status`。超限请求设置 `maxResponseSize`。

## 反例

- 不判断 `response.ok` 的裸 `fetch`。
- v1 `prefixUrl` 和旧 hook 签名。
- 再次读取已经被消费的错误体。
- `delete().json()` 解析 204。
- 把 `timeout` 当成包含重试的总预算。
- POST 使用 `retry: 3`。
- 只靠泛型 `json<T>()`。
- 任意绝对 URL 仍附带 Authorization。
- 只 abort，不比较代际。
- 组合输入期间按 Enter 就搜索。

## 测试断言

- 真实 Ky 对幂等 GET 的 503 会再试，对 POST 409 不会。
- 超过 `maxResponseSize` 失败，204 不解析 JSON。
- 来源列表拒绝非 HTTPS、缺字段和超长数组。
- 慢请求之后的快请求赢得界面；取消显示 AbortError。
- 未知 origin 在 fixture 里被拒绝。
- `tests/sdk.test.mjs` 导入真实 `ky`。无收据则 NOT_RUN。

## 真实限制

传输是 `lab.invalid` 上的内存 Response。没有 CORS、没有 Cookie、没有令牌刷新、没有真实 Retry-After。`timeout` 1200 与 `totalTimeout` 2500 是演示预算。

`validateSources` 不是服务端 SSRF 防护。Ky 也不会清洗 HTML。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
