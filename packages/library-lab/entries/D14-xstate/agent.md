# D14 XState — 工程手册

## 适用

互斥的审稿流程：草稿、审核中、驳回、已发布。重试次数和拒绝原因放在机器上下文里。非法事件没有迁移。

单个开关、远程列表缓存、上传字节协议不要放进这台机器。客户端守卫不是权限。

## 版本

`xstate@5.33.3`，MIT。使用 `setup`、`createActor`、`assign`。不安装 `@xstate/react`。

不要升级到 v6 alpha。不要把 v4 的 `interpret` 或 `cond` 写回示例。

## 迁移

从 [`examples/review-machine.ts`](examples/review-machine.ts) 带走 `reviewMachine`，从 [`examples/review-policy.mjs`](examples/review-policy.mjs) 带走原因校验。`demo.tsx` 只重导出。

React 若改用 `useMachine`，仍然要在守卫里调用 `isValidRejection`，不能只留按钮 `disabled`。

加上 `invoke` 时，把 `signal` 传给 fetch，并增加不确定状态。当前示例没有网络。

## 不可删的清理

effect 的清理函数 `unsubscribe` 然后 `stop`。ref 只在仍指向该实例时清空，避免停掉替换后的 actor。

`RETRY` 的守卫是 `retries < 2`。动作在进入审核前增加次数并清空原因。不要在组件 state 再记一份次数。

`RESET` 同时把 `retries` 和 `reason` 归零。

## 反例

- `isReviewing` 与 `isPublished` 两个布尔。
- v4 `interpret` / `cond`。
- 只靠 `disabled` 拒绝空白原因。
- 守卫里 `await fetch`。
- `context.reason = text` 发生在机器外面。
- 把 `actor.stop()` 当成 POST 回滚。
- 模块顶层 `createActor().start()`。
- 上下文保存令牌或整篇正文。
- 订阅后不 `unsubscribe`。

## 测试断言

- 当前状态没有的事件被忽略，例如 draft 时的 `APPROVE`。
- 空白和超长 `REJECT` 不能进入 `rejected`；合法原因会规范化。
- 重试超过预算后仍停留在 `rejected`，actor 可以被 `stop`。
- 策略函数与按钮、守卫使用同一长度上限。
- `tests/sdk.test.mjs` 创建真实 XState actor。无收据则 NOT_RUN。

## 真实限制

没有 `invoke`，没有持久化，没有 Inspector。重试预算是两次，原因上限 200 个码点。按钮禁用只是体验，测试会绕过按钮直接 `send`。

Stately 云服务不在这个包里。SSR 若使用机器，必须每请求创建并停止。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。

## 完整文件、配置与失败处理

`pnpm add xstate@5.33.3`；React/TypeScript宿主复制 example.tsx、review-machine.ts、review-policy.mjs/.d.mts，无 Lab 内部模块、CSS或远程服务。SDK测试需要Node>=22.18原生TypeScript擦除；测试直接导入显示的机器，禁止另造测试专用机器。纯策略套件独立计数。

原因按trim后的Unicode码点计长。不要用HTML maxLength=200替代策略（它按UTF-16单元算，会错误拦截emoji）。非法事件/guard不通过时保持原状态，不抛业务异常；需要错误提示由UI解释当前状态。Actor发生未处理运行异常与合法性拒绝是两类问题。

actor由React effect持有，清理先unsubscribe再stop，且仅清空仍指向该实例的ref。当前没有计时器、invoke或网络；如新增必须测试退出状态后的迟到结果与信号清理，不能把stop当事务回滚。
