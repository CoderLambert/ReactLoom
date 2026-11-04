# C01 React Hook Form — 工程手册

## 适用

多字段、动态行、需要把服务端错误放回具体字段。单个输入不必用。不要把 RHF 当成鉴权或 SSRF 防护。

## 版本

`react-hook-form@7.89.0`，MIT。动态行使用 v7 的 `field.id`。

## 迁移

带走 `examples/example.tsx` 的表单结构、`examples/feed-url-policy.mjs`、`examples/form-policy.mjs` 和它们的 `.d.mts`。用项目的 API client 替换 `delayWithSignal` 和本地 409。`demo.tsx` 留下。

## 不可删的清理

提交保存指纹、generation 和 AbortController。草稿变化、卸载、增删行都要 abort 并增加代际。回包写入前调用 `canApplySubmitResult`，并重新 `fingerprintDraft(getValues())`。行的 React key 保持 `field.id`。

## 反例

- 同一字段 `register` 又 `Controller`。
- key 用数组下标。
- 脏表单被服务器数据无条件 `reset`。
- await 之后无条件 `setError`。
- 把接口返回的任意字符串当字段路径。
- URL 整串小写。
- 只检查 `isComposing`，漏掉 keyCode 229 和结束后的短窗口。
- 把 `canonicalFeedUrl` 当成服务端抓取的安全边界。

## 测试断言

- 非 HTTPS、带用户信息的 URL 不能通过。
- path 大小写不同不算重复；主机大小写和默认端口算同一身份。
- 指纹、代际、aborted 任一不符都不应用结果。
- 删除行之后 409 落在新下标。
- 组合输入期间和结束后 80ms 内的 Enter 被挡住。
- 策略单测不是浏览器 IME 证明。

## 真实限制

示例没有网络，也没有 Zod resolver。80ms 是本地策略。焦点和读屏要在浏览器里看。

## 证据

没有收据不要写 PASS。仓库级 CI 不能抄到本条目。
