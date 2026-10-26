# Playwright：真正的浏览器证据，而不是页面脚本演示

## 定位

适合跨真实 Chromium/Firefox/WebKit 验证路由、键盘、输入、网络结果、资源取消和页面可访问性。不是单纯的函数测试，也不等于对真实第三方 API 进行测试。演示使用 **Node CLI 的真实 @playwright/test**，不是在网页上伪造一个终端。

## 安装及运行

Lab 已由 PLATFORM 声明 `@playwright/test@1.64.0`；运行前先安装 Node 和真正的 Chromium，不要执行未经授权的下载或收费服务。

```bash
pnpm --filter @reactloom/library-lab exec playwright install chromium
pnpm --filter @reactloom/library-lab exec playwright test --config entries/F13-playwright/examples/playwright.config.ts
```

可传路径选择某个场景，或者用 `--grep 'basic:|business:|advanced:'`。三个层次的独立测试入口为 `examples/basic.spec.ts`、`business.spec.ts` 和 `advanced.spec.ts`；`fixtures.ts` 是原创HTML，与主应用及生产后端隔离。

## 三层真实场景

**basic（真实DOM）**：使用 `getByRole` / `getByLabel` 定位输入与按钮；先断言空值提示，再输入内容，检查最终状态。不要用 `waitForTimeout` 代替正常 UI 断言。

**business（请求场景）**：用 `page.route` 拦截目标固定 `https://api.lab.invalid`，提供 200、422 和 503 的 HTTP 响应。业务页面真实执行 `fetch`，测试捕获次数并断言用户看见的状态。请勿把 `page.route` 的 Mock 当成真实生产服务调用，也不要把网络Mock误认成MSW Worker。

**advanced（异步回写）**：旧请求延迟，新请求更快；组件用 `AbortController` 和 generation 防护。验证最终UI只显示新结果；唯一用于等过时请求到达的有限等待应替换成更稳定的事件barrier作为后续改进。此示例虽已写源码，未安装浏览器前不能声称完成了竞态验证。

## 生产级要求

1. 可访问定位器优于 CSS:nth-child，元素应有稳定role/name。
2. 使用 Playwright 自动等待断言，避免无限 sleep、条件轮询伪通过。
3. 响应场景必须覆盖空态、网络错误、服务端错误、超时和恢复，不混淆状态码与业务错误。
4. 执行中等待是测试运行的等待，别写业务里隐藏的测试标记。
5. 真实后端契约测试和浏览器 E2E 职责不同；Mock 应与业务契约一致并保持最小集。
6. 各 worker 运行在隔离浏览器context，真实凭据、生产账号、媒体数据不得进入录像/trace。
7. 平台不用为每个纯CLI库建立可在浏览器运行任意命令的终端。站内只展示源码、命令和真实 CI 产物。

## 常见错误

- `page.waitForTimeout(2000)` 代替特定文本或事件条件。
- 只断言按钮存在，不验证点击后业务行为。
- 把页面 Mock 成功等同于后端契约通过。
- 删除请求竞态和取消验收，因为大多数手工测试不容易重现。
- 将历史无浏览器条件下的 Node PASS 包装成 Playwright PASS。

## 验证

SDK / 浏览器的验证属于 Playwright 的同一真实执行路径：必须保存具体命令、exit code、Node/Chromium、版本、源指纹和实际报告；当前尚未执行，`verification.json` 全部保持 NOT_RUN/BLOCKED。官方：[断言](https://playwright.dev/docs/test-assertions) · [Mock](https://playwright.dev/docs/mock) · [配置](https://playwright.dev/docs/test-configuration)。
