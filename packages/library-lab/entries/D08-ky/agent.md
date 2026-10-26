# D08 Ky v2.2 · Agent 迁移与使用规则

## 角色

Ky 是基于 Fetch 的 HTTP transport，不是缓存、队列、Schema 或重试型业务工作流。基线 ky@2.2.0（MIT / ESM / Node22+）；已有 Axios 基建不应为了“更现代”而机械迁移。

## 最小迁移文件

先读 examples/example.tsx 的 createFixtureTransport 与 KyWorkshop；examples/demo.tsx 只是 Lab 适配。生产项目**不能**复制 fixture fetch 作为真实 HTTP 网关，必须改用目标受控 origin 的 fetch；保留有限 retry、timeout、totalTimeout、AbortSignal、JSON运行时校验、错误类型区分与日志脱敏。对跨 origin 的请求必须设 allowlist，不能让用户输入任意绝对URL绕开 baseUrl。

## v2 与历史教程差异

- prefixUrl 改名 prefix；优先核实 baseUrl 解析。
- HTTPError.data 已包含已解析错误体，不要再读已消费的 response.json()。
- Hook 参数统一 state 对象。beforeRetry 在确定要重试之后运行，不用于决定是否重试；应该在 retry.shouldRetry 决策。
- timeout 不覆盖整个 retry 生命周期；必要时 totalTimeout。
- maxResponseSize 对读取响应体生效，不代表阻止所有缓冲或业务解码成本。

## 防错测试

(GET) 503 最多一次重试、总尝试=2；(POST) 409 不重试；(GET) 显式 AbortSignal 取消；(GET) 大 body 触发尺寸上限；(DELETE) 204 不解析 JSON；旧慢请求不得覆盖新请求。真实业务端点可 mock，但目标 Ky SDK 必须是真正安装调用。SDK/build/browser证据仍NOT_RUN，不能继承旧报告的 Node 模型 PASS。

官方：https://github.com/sindresorhus/ky/blob/v2.2.0/readme.md
