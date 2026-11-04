# F12 Vitest — 工程手册

## 适用

可注入的函数、状态码矩阵、假时钟和「最后一次请求获胜」。不证明浏览器，也不证明后端。

## 版本

`vitest@5.0.5`，MIT，已经在锁文件中。不要写成尚未安装。假时钟用 `vi.useFakeTimers` 与 `advanceTimersByTimeAsync`。

## 迁移

带走 `examples/domain.ts` 和三份测试。产品代码不要 import `vitest`。用项目的请求函数替换测试里的 `vi.fn`。保留 generation，而不是只 abort。

页面命令是 `pnpm exec vitest run entries/F12-vitest/examples/<file>`。网页不执行它。

## 不可删的清理

`afterEach` 恢复真实时钟。`createLatestRequest` 在 `finally` 里只清除仍是当前的 controller。`verifyCode` 在请求前、JSON 后都检查 signal。取消后的结果不得写成成功或字段错误。

## 反例

- 业务模块 import `vi`。
- 测试请求真实主机或写入密钥。
- 只断言 `signal.aborted`。
- 用真实 `setTimeout` 等竞态。
- 把 503 收成 ok。
- 解析后不再看 signal。
- 假时钟泄漏到下一个文件。
- 把 `new Response` 说成网络已通。
- 一个文件通过就填三条 PASS。
- 用 Node 结果代替 Playwright 或 axe。

## 测试断言

- hash 被去掉，query 保留；`javascript:`、`http:`、带密码、非法字符串抛错。
- 200 / 422 / 503 的对象完全相等，且 request 只调用一次。
- 200 的错误形状抛 `Invalid JSON shape`。
- 已取消时不调用 request；解析中取消得到 AbortError。
- 旧定时器结果为 null，新结果为 `value-2`。
- 忽略 abort 的晚到成功仍是 null。
- 活动错误抛出，取消后的错误为 null。

## 真实限制

没有组件、没有 MSW、没有浏览器模式。503 的 `after: 3` 是夹具，不是 Retry-After 解析。URL 规则不检查内网地址。

## 证据

三条命令都要各自的收据，放在 `docs/library-lab/evidence/runs/`。锁文件里有 Vitest 只说明版本在。Actions 41779873259 不是 F12 PASS。browser 保持 NOT_RUN。
