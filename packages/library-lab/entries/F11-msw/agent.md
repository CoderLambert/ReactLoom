# F11 MSW — 工程手册

## 适用

测试里要真实的 `fetch` 和可预测的状态码。纯函数不必用。它不是后端集成测试，也不是性能基准。

## 版本

`msw@3.0.3`，MIT。导入用 `msw/http`、`msw/node`、`msw/browser`。不要用 v2 的 `rest` 路径。`worker.stop()` 必须 await。

## 迁移

带走 `handlers.mjs`、`routes.mjs`、`node-runner.mjs`、`browser-worker.mjs`、`worker-script-preflight.mjs`、`session-gate.mjs`、`registration-policy.mjs`。Node 基址保持不可解析的 `.invalid`。浏览器只用隔离 scope。不要在应用根注册 Worker。

## 不可删的清理

每个场景结束 reset handlers，并 close server。浏览器 start 之前同步占会话门，失败就释放。stop 放进 finally 并 await。只注销这次创建的 registration。预检失败不得回退到根路径脚本。卸载缺 ACK 时记为未确认。

## 反例

- 手写假 fetch 当成 MSW 通过。
- 不 await stop。
- 根 scope 或注销别人的 Worker。
- 只对脚本 URL 做字符串判断。
- 浏览器去请求 `library-lab.invalid`。
- handler 漏掉后打到收费或生产接口。
- 用 Node 结果填写 browser PASS。
- 多标签共享 scope 却声称完全隔离。

## 测试断言

- GET 文章 200 且 JSON 形状固定。
- 验证码 `123456` 为 200，其它和坏 JSON 为 422，错误码 `INVALID_CODE`。
- 用例之间不继承上一次的 handler。
- 预检拒绝 HTML、重定向、越界体积和 scope 外 URL。
- 浏览器：controller 的 script 精确匹配，scope 内 fetch 得到文章 JSON，stop 之后这次注册不留下。

## 真实限制

页面默认不挂载可交互的浏览器 Demo，只提供隔离面板和命令。`page.route` 不是 MSW。stop 不是 unregister。策略单测不加载官方 SDK。

## 证据

没有 `docs/library-lab/evidence/runs/` 的收据，sdk 和 browser 都不是 PASS。包已在锁文件中，这只说明装得上，不说明本条目已验收。
