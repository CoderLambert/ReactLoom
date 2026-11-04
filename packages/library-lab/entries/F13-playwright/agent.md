# F13 Playwright — 工程手册

## 适用

独立 HTML 上的角色定位、拦截后的状态码、提交中的按钮、旧响应不能覆盖新结果。不是产品站的套件，也不是 MSW。

## 版本

`@playwright/test@1.64.0`，Apache-2.0。配置在 `examples/playwright.config.ts`：Chromium、headless、retries 0、workers 1。

## 迁移

带走 `fixtures.ts`、三份 spec 和这份 config。不要并进主站 Playwright 配置。主机保持 `api.lab.invalid`。页面命令不会启动浏览器。

## 不可删的清理

business 和 advanced 的屏障必须在 `finally` 里释放。按钮在请求期间禁用，并在 `finally` 恢复。advanced 只有当前 generation 能写结果。失败 trace 留在本目录的 `.playwright-artifacts`，不要提交密钥或生产 HAR。

## 反例

- `waitForTimeout` 或 CSS id 定位。
- 提高 retries 让教学用例变绿。
- 去掉 route 去打真实主机。
- 把 `page.route` 写成后端或 MSW 已通过。
- 断言失败后不放开挂起的路由。
- 断网和 422 共用文案。
- `{ ok: false }` 显示成订阅成功。
- 用仓库 45 项 Playwright 填写本条目。

## 测试断言

- 空标题提示输入；「本地新闻摘要」得到「保存完成」。
- 200/`ok:true`、422 文案、503 文案、`ok:false`、空 422、坏 JSON、abort 各有固定文字，且拦截次数为 1。
- 挂起时按钮禁用，结束后启用。
- 先旧后新，放开旧请求后状态仍是「新结果」。

## 真实限制

不启动 Lab 应用。不测键盘全序、视觉像素或 axe。单 worker 是为了屏障，不是性能结论。规格在仓库里不是执行记录。页面展示的命令不会打开 Chromium。

## 证据

针对这条 config 的命令、退出码和日志要进入 `docs/library-lab/evidence/runs/`。在那之前 sdk 与 browser 都是 NOT_RUN。Actions 41779873259 的 45 项不是这三份 spec。

三份 spec 要分开记。一条命令通过不能填写另外两层。

页面不打开浏览器，trace 目录本身也不是收据。
