# F11 MSW — Agent 复用约定（v3）

## 适用范围

要测试前端“真实 HTTP 调用但可预测返回”时优先 MSW；单纯断言纯函数、测试后端真集成或性能基准不需要它。MSW 3.0.3、MIT，Node >=22、TS >=5.9；不要把 v2 的导入/生命周期接口直接复制过来。

## 直接读取的源文件

- `examples/handlers.mjs`：路由与结果事实源。不要在每个 React 组件再复制错误码。
- `examples/node-runner.mjs`：基础/业务/进阶三个真实 `fetch` 调用与 Node 断言；测试中在 finally close，覆盖后 reset。
- `examples/browser-worker.mjs`：只在独立 scoped iframe 里运行，要求 PLATFORM 供给真实 `mockServiceWorker.js`。切勿把它无条件导入主应用入口。

## API 与生命周期

`http`、`HttpResponse` 从 `msw/http`；`setupServer` 从 `msw/node`；`setupWorker` 从 `msw/browser`。使用明确 URL 匹配器，`onUnhandledFrame:'error'` 防意外真实请求，测试运行时每条场景 reset handlers。v3 `worker.stop()` 必须 await。是否将 Worker 注销由受控 runner 负责，stop 不是 unregister。

## 强制安全条件

- 浏览器 runner 限定独立 `/lab-runners/msw/` 路由及 worker scope；若 runner 不存在，页面只能展示可复现源码，不能标浏览器通过。
- 不允许 Mock 接口调用真实收费服务、生产凭证或个人数据。
- Node 测试不能冒充浏览器 Worker 通过；静态脚本不能冒充目标 SDK 的真实运行。

## 需断言的业务行为

GET 响应200及 JSON；验证码成功200、错误422且应用显示字段反馈；503 恢复后第二次200且没有串数据；卸载/重试不允许后一个测试继承前一个 handler；生产隔离 origin/scope、CSP 与 worker script 路径须独立 E2E。

## 推荐迁移过程

1. 给现有 API Client 写下不变契约和业务码。
2. 将 scenarios 放统一 handlers 与 fixtures。
3. 将 Node setupServer 接测试启动/收尾；浏览器在单独运行环境 setupWorker。
4. 执行分场景 UI/E2E，最后加入真实后端契约检查。

当前SDK/构建/浏览器状态 NOT_RUN/BLOCKED。官方：https://mswjs.io/docs/quick-start

## 浏览器/Node URL 事实源

读取 `examples/routes.mjs` 并使用 `scenarioEndpoints(base)`：Node 为保留的 `https://library-lab.invalid/`，iframe 使用当前 origin 的 `/lab-runners/msw/`。`createHandlers(urls)` 统一业务响应；不得在浏览器通过跨域 `.invalid` 地址假设拦截已经生效。`browser-worker.mjs` 的 registration scope/script 精确检查仅是 readiness gate，实际 `fetch` 和 Worker 接管仍需 Chromium 测试。禁止在顶层 SPA 注册这个 Worker。

## Service Worker运行模式的硬约束（第12轮）

仅在PLATFORM受控iframe显式启动`startIsolatedWorker()`，保存返回的async stop并在finally/unmount await调用。迁移`registration-policy.mjs`一起验证外部script不被覆盖、script/scope/controller和真实fetch都正常。已存在的同scope注册不自动注销；多tab共享scope必须用独立origin/跨tab租约处理。没有提供worker脚本及真实浏览器环境时严禁称为运行验收。

## Wave21 迁移与验证

迁移 `examples/session-gate.mjs` 并在首次异步预检前同步获取租约。失败释放，stop成功才释放；不能待首次await完成才占用实例。共享scope的worker.stop()只停止当前client，**不得在普通卸载中注销registration**；PLATFORM使用单独origin或独占浏览器上下文验证全局清理。纯Node测试不能提升SDK/浏览器状态。
## 第24轮迁移：Worker script fail-closed

除 `browser-worker.mjs`、`registration-policy.mjs` 与 `session-gate.mjs`，必须同步 `worker-script-preflight.mjs`。先检查脚本URL严格处于隔离scope，再以带上界的同源真实fetch读取、判200/MIME/非HTML、无redirect，随后才调用真实 `setupWorker().start()`；失败只能返回错误，不能回退全局 `/mockServiceWorker.js`。注意只有PLATFORM能提供并验收生产静态Worker及CSP，Node预检策略PASS不能代替MSW和Chromium验收。
