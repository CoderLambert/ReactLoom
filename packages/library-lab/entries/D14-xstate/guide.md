# XState 5.33.3｜显式状态、守卫和有限重试

Lab 锁定 `xstate@5.33.3`（MIT）。示例只用核心包：`setup`、`createMachine`、`createActor`、`assign`。没有安装 `@xstate/react`，也没有 `useMachine`。组件自己 `subscribe` 并在清理时 `unsubscribe` 和 `stop`。

研究笔记里的 5.33.2 和 Vite 地址 `127.0.0.1:5173` 不是当前 Lab。没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。机器 id 是 `rss-review`。状态只有 `draft`、`reviewing`、`rejected`、`published`。上下文是 `{ retries, reason }`。

`SUBMIT` 只在 `draft`。`APPROVE` 只在 `reviewing`。`REJECT` 还要过守卫 `hasRejectionReason`，通过后 `saveReason` 写入去掉首尾空白的原因。`RETRY` 只在 `rejected`，且 `retries < 2`，动作里把次数加一并清掉原因。第三次重试不会进入 `reviewing`。`RESET` 从 `rejected` 或 `published` 回到 `draft` 并清上下文。

[`examples/review-policy.mjs`](examples/review-policy.mjs) 规定原因必须是非空字符串，按码点计长不超过 `MAX_REJECTION_REASON_LENGTH`（200）。按钮的 `disabled` 使用同一函数。守卫仍然要跑，因为测试和脚本可以直接 `send({ type: 'REJECT', reason: '   ' })`。

effect 创建 actor、订阅快照、`start`。清理时取消订阅、`stop`，并在 ref 仍指向它时清空。Strict Mode 会多一次这样的配对，所以不能把 `start` 当成“只提交一次服务器”的保证。

没有挂载：`invoke`、`fromPromise`、持久化快照、Stately Inspector、HTTP 409。下面那些取消语义是生产教学，不是当前按钮。

## 什么时候用

多个布尔会同时为真、而业务上互斥时，用状态图。审批、支付、上传阶段都属于这类。单个开关用 `useState`。普通共享值用 Zustand 或 Jotai。列表新鲜度用 Query。XState 不实现传输协议，也不代替服务端事务。

`xstate@6` 的 alpha 不是这条目的升级目标。Stately Studio 是另一套服务，不是 MIT 包里的永久功能。

## 模型

`setup().createMachine` 只是定义。`createActor` 之后才有邮箱。`start` 开始处理，`send` 投递，`getSnapshot` 读取，`subscribe` 必须配对取消，`stop` 停掉这个 actor。

`snapshot.value` 是当前状态名（本机器没有并行状态）。`snapshot.context` 是扩展数据。`assign` 是改上下文的方式。不要 `context.retries++` 这种在机器外改对象。

守卫是同步纯函数。不能在守卫里 `await fetch`。需要请求时用 `invoke` 和 `fromPromise`，在 `onDone` / `onError` 上迁移。Lab 没有子 actor。

离开 invoke 状态时，迟到的 `onDone` 不应再改父机器。`fromPromise(({ signal }) => fetch(url, { signal }))` 可以把停止传给 fetch。已经到达服务器的 POST 仍可能提交成功。生产里取消保存应进入“不确定”，再读服务器，而不是显示“已撤销”。本示例的按钮没有这一态。

`getPersistedSnapshot()` 和 `getSnapshot()` 不同。恢复用 `createActor(machine, { snapshot })`。只存 `snapshot.value` 会丢掉上下文。Lab 不持久化。

事件可以被脚本伪造。机器通过守卫不等于用户有权限。写 API 仍要鉴权。

## 三层示例

### 基本

从 `draft` 提交到 `reviewing`，再批准到 `published`。在 `draft` 时批准按钮禁用；即便调用 `send`，也没有这条迁移，状态保持 `draft`。

### 业务

填写原因后驳回。空白和超长在按钮上不可用，守卫同样拒绝。原因显示的是 `normalizeRejectionReason` 的结果。重置回到 `draft`，原因清空。

### 进阶

驳回后再试，`retries` 从 0 增到 1 再增到 2。达到 2 后重试按钮禁用，守卫 `hasRetryBudget` 也不让第三次进入 `reviewing`。需要 `RESET` 才能把次数清零。

## 反例

### 反例 1：多个布尔

```tsx
const [reviewing, setReviewing] = useState(false)
const [published, setPublished] = useState(false)
```

两者可以同时为真。用互斥状态。

### 反例 2：v4 的 interpret 和 cond

```ts
interpret(machine).start()
```

```ts
const actor = createActor(reviewMachine)
actor.start()
```

守卫写 `guard`，不写 `cond`。

### 反例 3：只靠 disabled

```tsx
<button disabled={!reason.trim()} onClick={() => send({ type: 'REJECT', reason })}>驳回</button>
```

脚本仍能送出空白。守卫调用 `isValidRejection`。

### 反例 4：在守卫里请求

```ts
guards: { ok: async () => fetch('/policy').then(r => r.ok) }
```

请求放进 `invoke`。守卫只看事件和上下文。

### 反例 5：stop 当成回滚

`actor.stop()` 丢掉未完成的子 actor 结果，不会撤销已提交的 POST。UI 要有不确定态，并重新读取版本。

### 反例 6：订阅整个快照却不清理

Lab 的 effect 返回函数里 `unsubscribe` 和 `stop`。漏掉任一个都会在切换路由后继续 `setState`。

### 反例 7：模块级 actor

```ts
const actor = createActor(reviewMachine).start()
```

SSR 和测试会串状态。在 effect 或每请求工厂里创建。

### 反例 8：上下文塞满文章正文和令牌

快照会变大，检查器日志会泄露。正文放 Query，机器只留 `retries` 和短原因。

## 组合

**Query + RHF**：表单管输入，机器管 `draft → reviewing → published`。提交成功后让 Query 失效。不要把 feed 数组放进 context 再放进缓存。

**Uppy + Dexie**：上传协议属于 Uppy。机器只标阶段。刷新后的恢复要有自己的快照版本。不要把 persist 当成断点续传。

## 生产核对清单

1. 每个 `createActor` 都有 `stop`，每个 `subscribe` 都有 `unsubscribe`。
2. 非法事件在当前状态没有迁移，测试会 `send` 它。
3. 业务守卫与按钮共用同一策略函数。
4. 重试次数在上下文里，不在组件 state 再存一份。
5. 没有在守卫里发请求。
6. 取消网络后的 UI 不声称服务器已回滚。
7. 不把令牌放进 context 或检查器。
8. 不在模块顶层 `start` 带用户数据的 actor。

## 升级

钉 `5.33.3`。从 v4 迁移：`interpret` 改为 `createActor`，`cond` 改为 `guard`，`actions.assign` 使用 v5 的 `assign`。官方迁移指南要求 TypeScript 5 以上。

不要把 6.0 alpha 写进 `library.json`。若以后加上 `@xstate/react`，版本要和核心 5.33.3 一起核，本示例目前不依赖它。

## 验收

- `draft` 收到 `APPROVE` 仍停留在 `draft`。
- 空白、超长 `REJECT` 被守卫拒绝；合法 Unicode 原因被 trim 后写入上下文。
- `RETRY` 最多两次，第三次不进入 `reviewing`。
- 卸载或重跑 effect 时 actor 已 `stop`。
- `tests/sdk.test.mjs` 启动真实 actor。无收据则 NOT_RUN。

练习：把 v4 机器改成 `createActor`，再加一个 `invoke` 保存步骤。退出该状态时请求被 abort，界面进入不确定而不是已发布。

## 资料

- https://stately.ai/docs/machines
- https://stately.ai/docs/actors
- https://stately.ai/docs/guards
- https://stately.ai/docs/actions
- https://stately.ai/docs/invoke
- https://stately.ai/docs/promise-actors
- https://stately.ai/docs/persistence
- https://stately.ai/docs/migration
- https://stately.ai/docs/xstate-react
- https://www.npmjs.com/package/xstate
