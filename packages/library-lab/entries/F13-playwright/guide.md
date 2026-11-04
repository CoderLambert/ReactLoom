# Playwright 1.64.0｜规格在仓库里，套件是否跑过要看收据

Lab 锁定 `@playwright/test@1.64.0`（Apache-2.0）。示例是独立 CLI 配方：`setContent` 一段静态 HTML，再用 `page.route` 拦住 `https://api.lab.invalid`。它不打开 Library Lab 应用，也不碰生产接口。

执行种类是 `node-ci`。页面展示命令，不启动浏览器。规格文件存在，不等于这套用例跑过。仓库 Actions 41779873259 里的 45 项 Playwright 是 Lab 自己的端到端，不是这三份 `examples/*.spec.ts` 的收据。

没有 `docs/library-lab/evidence/runs/` 收据时 sdk、build、browser 保持 NOT_RUN。

## Lab 当前示例

| 文件 | 作用 |
| --- | --- |
| `examples/playwright.config.ts` | 只跑本目录，Chromium，headless，workers 1，失败保留 trace |
| `examples/fixtures.ts` | 三段不依赖产品服务器的 HTML |
| `examples/basic.spec.ts` | 角色定位和保存状态 |
| `examples/business.spec.ts` | 状态码、坏 JSON、断网、提交中的按钮 |
| `examples/advanced.spec.ts` | 旧请求晚到也不能盖住新结果 |

页面命令：

```bash
pnpm exec playwright test --config=entries/F13-playwright/examples/playwright.config.ts entries/F13-playwright/examples/basic.spec.ts
```

business 和 advanced 换对应文件。配置里的 `outputDir` 是 `examples/.playwright-artifacts`。不要改主站的 Playwright 配置来迁就这三份规格。

`api.lab.invalid` 只作为夹具主机名。测试必须 `page.route`。没有路由时，页面应显示「网络不可用」。不要把这个主机换成生产地址，也不要在夹具里放密钥。

## 1. 什么时候用

要点击、等待可访问名称、看按钮禁用，并在浏览器里拦截 fetch。纯函数用 F12。组件故事用 F14。规则扫描用 F17。MSW 的 Service Worker 是另一层，不要把 `page.route` 写成 MSW 已验证。

没有稳定可观察结果的动画时间轴，不适合当第一条用例。

## 2. 模型

配置：`fullyParallel: false`，`retries: 0`，`workers: 1`，`trace: 'retain-on-failure'`。教学规格不靠重试变绿。

basic 的页面有标题、带 label 的输入、保存按钮和 `aria-live` 的 output。空标题得到「请输入标题」，有文字得到「保存完成」。定位用 `getByRole`，不用 CSS id。

business 的脚本在点击时同步把按钮设为 disabled，防止第二次提交。响应先 `json()`。解析失败、非对象、200 但 `ok !== true`、错误体没有合适的 `message`，都显示「响应格式异常」。`message` 必须是长度 1–160 的字符串。fetch 抛错显示「网络不可用」。`finally` 恢复按钮。

advanced 用 generation 和 AbortController。只有当前 id 才写 `data.label`。AbortError 不写成「请求失败」。

## 3. 三层

### 基本

`setContent(basicPage)`。先看到标题「任务编辑」。空保存，状态含「请输入标题」。填入「本地新闻摘要」后再保存，状态恰好是「保存完成」。没有网络。

### 业务

路由 `https://api.lab.invalid/subscribe**`。矩阵：

| 状态 | 体 | 可见文字 |
| --- | --- | --- |
| 200 | `{ ok: true }` | 订阅成功 |
| 422 | `{ message: '邮箱格式错误' }` | 邮箱格式错误 |
| 503 | `{ message: '服务暂不可用' }` | 服务暂不可用 |
| 200 | `{ ok: false }` | 响应格式异常 |
| 422 | `{}` | 响应格式异常 |

另有 `route.abort('failed')` → 「网络不可用」，以及 200 加 `{invalid-json` → 「响应格式异常」。每次断言拦截次数为 1。

挂起的路由：按钮变为禁用，释放后「订阅成功」且按钮恢复，只拦截一次。`release` 放在 `finally`，断言失败也要放开，避免用例把浏览器挂住。

### 进阶

先点「旧版本」，等到路由看见 `q=old`，再点「新版本」。状态变成「新结果」之后才放开旧请求。旧的 fulfill 可以因取消而抛错，那是预期。状态必须仍是「新结果」。`oldHandlerRan` 为 true。`finally` 里再调一次 `releaseOld`。

## 4. 反例

### 反例 1：用 CSS 和固定等待

```ts
await page.click('#save')
await page.waitForTimeout(500)
```

按钮名和 `getByRole('status')` 会重试到可见。`waitForTimeout` 把慢机器和快机器绑在同一个毫秒上。本规格没有它。

### 反例 2：重试掩盖断言

```ts
retries: 2
```

教学配置是 0。偶发失败应看 trace，而不是再跑到绿。

### 反例 3：打到真实 API

```ts
await page.goto('https://production.example')
```

夹具是 `setContent`。主机是 `.invalid`。不要为了「更真实」去掉 route，也不要上传账号。

### 反例 4：把 route 当成契约测试

`route.fulfill` 是测试在说话。后端并没有返回 422。契约要另做。不要把这页的绿写成服务已实现。

### 反例 5：忘记放开屏障

旧请求的 `await oldBarrier` 如果断言先失败，用例会停在路由里。两个规格都在 `finally` 里 release。删掉它，下一次调试会看成长时间挂起。

### 反例 6：断网和 422 用同一句文案

`route.abort('failed')` 必须是「网络不可用」。HTTP 422 显示服务端 message。混在一起就无法看出拦截层是否生效。

### 反例 7：200 且 ok:false 算成功

页面要求 `result.ok === true`。测试把 `{ ok: false }` 收成「响应格式异常」。不要改成只要 `response.ok` 就显示成功。

### 反例 8：用主站配置跑这三份文件

主站用例登录、开 axe、走真实路由。这里的 config 是隔离的。混跑会把产品服务器拉起来，或让选择器对上错误的页面。

### 反例 9：仓库 45 项通过就填 F13

那 45 项没有指向 `entries/F13-playwright/examples`。规格仍是 NOT_RUN，直到有针对这条 config 的收据。

## 5. 组合

**F12**：同一业务可以先在 Node 里测函数，再在这里看按钮和 live region。`vi.fn` 的调用次数不是 `intercepted`。

**F11**：MSW 拦的是应用的 fetch。这里拦的是这段 HTML 里的 fetch。两套不要互相填写 PASS。

**F17**：可以在 `setContent` 之后跑 axe。本规格没有 `axe.run`。角色定位不是规则扫描。

**F14**：Story 的 play 在组件 iframe 里。它不覆盖这段手写 HTML 的提交中状态。

## 6. 清单

- 定位用 role 和可访问名称。
- 不使用 `waitForTimeout`。
- retries 保持 0，workers 保持 1。
- 每个 HTTP 场景断言拦截次数。
- 断网、坏 JSON、畸形成功体分开。
- 挂起请求期间按钮禁用，结束后恢复。
- 屏障在 finally 释放。
- 旧响应不能改写「新结果」。
- 不改主配置，不访问生产，不放密钥。
- 命令展示不等于套件已执行。

## 7. 升级

1.64 的 `getByRole`、`page.route`、`toHaveText` 是合同。升级时重跑三个文件，trace 仍只在失败时保留。不要打开并行去「加快教学规格」，屏障假设一次只有一个 worker。

浏览器二进制由平台安装。缺浏览器时命令失败，不要改成跳过并记 PASS。

## 8. 验收

三条命令分开。日志要包含对应标题：basic 的「保存完成」、business 的五种正文加网络和坏 JSON、advanced 的「新结果」。trace 目录不是收据，除非记录命令、退出码和时间。sdk 与 browser 在那之前保持 NOT_RUN。build 对本目录没有单独产物，也保持 NOT_RUN。

## 9. 故障对照

| 现象 | 先看 |
| --- | --- |
| 选择器找不到按钮 | 用了 CSS。规格用「保存」「提交订阅」「旧版本」这些名称 |
| 状态一直是发送中 | 路由没有 fulfill，或 finally 没有把按钮打开 |
| 用例挂住不结束 | `oldBarrier` / `blocked` 没有在 finally 里 release |
| 新结果被改回旧结果 | generation 判断被删，或在 abort 之后仍写 label |
| 422 显示成网络不可用 | 用了 `route.abort` 而不是 `fulfill` |
| 跑到了产品登录页 | config 不是本目录这份，或用了 `goto` 主站 |

trace 只在失败时保留到 `examples/.playwright-artifacts`。不要把含账号的 trace 提交进仓库。本规格的 HTML 里没有账号。

## 10. 资料

- https://playwright.dev/docs/intro
- https://playwright.dev/docs/locators
- https://playwright.dev/docs/test-assertions
- https://playwright.dev/docs/mock
