# D09 Axios — Agent 在其他项目复用的操作手册

## 何时使用
项目已有 Axios 调用、请求/响应拦截器、统一 HTTP 错误模型，或需要 upload/Node HTTP adapters。新项目仅使用 Fetch 可对比 D08 Ky。当前固定 axios@1.20.0/MIT；不能使用 2026年供应链污染的 1.14.1 / 0.30.4。

## 源码引用
examples/example.tsx：makeFixtureClient() 展示隔离实例、拦截器注册与 eject；boundedGetRetry() 展示 GET 503 有界重试；search() 展示 AbortController + generation。examples/demo.tsx 只是 Lab 出口，不能复制内存 adapter 当生产网络服务。

## 强制保留
- 实例级配置，拦截器生命周期受控；不在 render 中重复注册。
- 请求取消时中止运输；新请求版本检查阻止旧结果回写。
- 认证令牌从安全会话获得，禁止带到 URL/文档/演示日志。
- 只对明确幂等操作做有限重试；POST 409 不自动重发。
- JSON 响应进行运行时验证；不能相信泛型静态类型。
- 真实适配器下超时、异常及流式响应需要重新集成测试。

## 禁止
全局 default 污染、多处重复重试、强制所有错误 HTTP 200、只判断 message、不核对 error.response?.status、把自定义 adapter 的 status 处理当真实 HTTP 服务端结果。

## 验证
node --test entries/D09-axios/tests/sdk.test.mjs，再 typecheck/build/浏览器。运行真实axios导入但模拟后端：可以记录“SDK行为已测”，不能记录“真实网络/生产服务器通过”。检查本条 verification.json 和 sourceFingerprint。

官方：https://github.com/axios/axios/releases/tag/v1.20.0

## 必检可重复操作

`makeFixtureClient.resetTransient()` 仅在新一轮 GET retry fixture 前调用。连续点击两次都应各自先遭遇模拟 503，再经真实 Axios GET 重新请求成功。该 fixture 不模拟真实网络/服务器请求幂等性，不能替代集成测试。
