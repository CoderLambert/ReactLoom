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
