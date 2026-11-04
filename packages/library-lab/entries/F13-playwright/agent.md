# F13 Playwright — 面向编码 Agent 的实战迁移指南

**适用**：登录、交互流程、动态请求、键盘/拖拽、真实浏览器多路由；单纯业务函数用F12 Vitest。基线 @playwright/test 1.64.0 / Apache-2.0，使用Lab已有devDependency，独立配置 `examples/playwright.config.ts` 不能误修改全局工作区配置。

## 最小复制
将 `examples/fixtures.ts` 里的独立演示数据替换成项目专有 fixture，将 `basic.spec.ts` 的 role-based 断言迁移到现有 UI 组件。业务场景优先复用 `business.spec.ts` 的 `route.fulfill` 显式HTTP状态；竞态关注 `advanced.spec.ts` 中的AbortController/generation目标行为。将测试归入目标项目 E2E 包，而非把 Lab 页面整个复制过去。

## 必须保留
语义role/name定位；自动重试 expect；Mock层级明确；真实浏览器执行；失败 trace；Mock接口不访问生产域名；新旧请求竞争最终结果断言。此独立课件不需访问外网或真实身份。

## 不能做
不把 `route.fulfill` 叫真实后端请求；不以组件存在当业务成功；不对用户生产站点运行测试；不使用任意shell输入；不把 Jest/jsdom PASS 等同Browser通过；不长时间等待固定毫秒作为所有同步手段。

## 命令与证据
`pnpm --filter @reactloom/library-lab exec playwright install chromium`; `pnpm --filter @reactloom/library-lab exec playwright test --config entries/F13-playwright/examples/playwright.config.ts`。如真实执行，保存报告和提交SHA、sourceFingerprint；现在未验证故不标PASS。

## 失败路径与双击防护迁移（wave17）

将 HTTP 非2xx、网络层失败和响应JSON/Schema错误分开；成功态必须要求 `result.ok === true` 而非仅以HTTP 200判断。提交锁在发起请求前同步设置，并在 `finally` 解锁，不丢失失败后的用户操作机会。Playwright 场景采用可确定释放的 Promise barrier，且 `finally` 释放挂起路由，不能在断言异常后留下未完成异步工作。以上是待运行源码，不可填真实浏览器PASS。
