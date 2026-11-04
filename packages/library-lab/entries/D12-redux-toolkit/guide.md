# Redux Toolkit 2.13.0｜slice、隔离的 store 和过期响应

Lab 锁定 `@reduxjs/toolkit@2.13.0`（MIT）。示例用 `configureStore` 和 `createSlice`。reducer 里的 `state` 已经是 Immer draft，直接改字段。React 订阅使用 `useSyncExternalStore`，没有安装 `react-redux`。多组件应用可以改用 `react-redux`，不必把 Lab 的订阅方式当成唯一写法。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。`createFeedStore` 把 `feedsSlice.reducer` 挂到 `feeds`，并关闭 DevTools，避免演示往浏览器扩展发动作。

状态是 `{ counter, feeds, activeRequest, result, ignored }`。`addFeed` 按 `id` 去重。`toggleRead` 按 `id` 翻转。`reset` 返回全新初始对象，而不是在 draft 上逐个清空。

business 和 advanced 持有两个 store：`stores.A` 和 `stores.B`。下拉框只切换 `useSyncExternalStore` 订阅哪一个。重置只 `dispatch` 到当前 store。

advanced 的 `demonstrateRace` 连续 `startRequest(first)` 再 `startRequest(latest)`。90ms 后完成 latest，200ms 后完成 first。`finishRequest` 在 `state.activeRequest !== action.payload.id` 时只增加 `ignored` 并返回。旧句子「旧请求不该覆盖」不会写进 `result`。计时器 id 存在 ref 里，切换 store 或卸载时全部 `clearTimeout`，并 `cancelRequest`。

没有挂载：`createAsyncThunk`、RTK Query、`react-redux` 的 `Provider`、真实 HTTP。竞态用的是 `setTimeout`，不是网络。下面的 thunk 规则是生产教学。

## 什么时候用

动作需要可追踪、多个模块共享同一份可预测状态时用 Redux Toolkit。一个计数器或面板开关用 Zustand 或 `useState`。派生原子用 Jotai。服务端缓存若还没有 Redux，优先 TanStack Query；已经决定用 Redux 时再看 D13 RTK Query，不要两套缓存。

切片适合“发生了什么”比“当前有哪些布尔”更重要的流程。它仍不是鉴权，也不是数据库。

## 模型

`createSlice` 根据 reducer 名字生成 action creators。`PayloadAction<T>` 描述载荷。Immer 允许 `state.feeds.push`，前提是这是 slice 交给你的 draft。不要再 `produce(state, ...)`。

`configureStore` 默认带不可变检查和 thunk 中间件。Lab 关闭 DevTools。序列化检查会拒绝把函数、Promise 和 `AbortController` 放进 action 或 state。请求句柄留在组件 ref 或 thunk 的闭包里，不要塞进 slice。

`useSyncExternalStore(store.subscribe, store.getState, store.getState)` 订阅整个根状态。Lab 的根状态很小。正式界面应按切片选择，避免无关字段触发大树渲染。`react-redux` 的 `useSelector` 做这件事。

过期响应的合同在 reducer 里：只有 `activeRequest` 等于完成动作的 id 才写入 `result`。UI 禁用按钮不能代替这个判断，因为计时器已经排队。

`reset` 返回新对象，等于替换整棵 slice 状态。其他 reducer 若也想清空，要显式列出字段，不要依赖“返回 undefined 表示清空”。在 Immer 里返回 `undefined` 表示不替换。

## 三层示例

### 基本

只有计数。每次点击 `increment`，输出里的数字加一。`reset` 回到 0。这个层级不创建 feed。

### 业务

在团队 A 添加频道，id 形如 `A-1`。切到团队 B，列表是空的，计数也是 B 自己的。再切回 A，频道还在。勾选按 feed id 翻转 `read`。重复添加同一 id 不会插入第二行；示例的 id 来自递增序号，所以正常点击不会撞车。

### 进阶

点「模拟先后返回的两个请求」。先看到「新请求已采用」和 `ignored` 仍为 0，约 200ms 后 `ignored` 变成 1，`result` 仍是新请求的句子。切换团队会清掉上一个 store 的计时器并取消其 `activeRequest`，避免旧 timeout 写到已经离开的订阅上。注意：timeout 回调里用的是当时的 `active`。清理函数必须清掉那些 timer，否则会 dispatch 到已经不在屏幕上的 store。这不会自动变成另一个团队的结果，因为两个 store 是分开的，但会污染你刚离开的那个团队的 `ignored`。

## 反例

### 反例 1：在 reducer 外 mutate

```ts
const state = store.getState()
state.feeds.counter += 1
```

```ts
store.dispatch(actions.increment())
```

### 反例 2：reducer 里再包 produce

```ts
increment(state) { return produce(state, draft => { draft.counter += 1 }) }
```

```ts
increment(state) { state.counter += 1 }
```

### 反例 3：用数组下标当 id

```tsx
<input onChange={() => dispatch(actions.toggleRead(index))} />
```

删除中间行之后下标指向别的 feed。动作用 `feed.id`。

### 反例 4：谁后返回谁写入

```ts
finishRequest(state, action) { state.result = action.payload.value }
```

```ts
finishRequest(state, action) {
  if (state.activeRequest !== action.payload.id) { state.ignored += 1; return }
  state.result = action.payload.value
  state.activeRequest = null
}
```

### 反例 5：把 AbortController 放进 state

它过不了序列化检查，也不能在 DevTools 里时间旅行。id 用字符串，控制器留在 ref。

### 反例 6：所有租户共用一个 store 再靠过滤

过滤只影响渲染。动作仍可能改到另一租户的行。Lab 用两个 `configureStore`。正式产品也可以在一个 store 里按租户分 key，但 reducer 必须拒绝跨租户 id。

### 反例 7：用 slice 缓存服务端列表

失效、重试和去重不是 `addFeed` 的职责。列表进 RTK Query 或 TanStack Query。slice 只留 `activeRequest` 这类流程字段。

### 反例 8：卸载不清 timer

组件走了，200ms 后仍 `dispatch`。effect 清理要 `clearTimeout` 并 `cancelRequest`。

## 组合

**RTK Query**：同一个 store 挂上 API reducer 和 middleware。slice 管本地流程，Query 管端点缓存。不要在两边各存一份 feed 数组。Lab 的 D13 是独立条目，有自己的 store。

**TanStack Query**：若没有 Redux 中心，不要为了这个竞态示例引入 RTK。Query 的 queryKey 和 abort 已覆盖“旧响应不回写”。slice 适合还要审计动作的地方。

**react-redux**：多组件用 `Provider` 和 `useSelector`。把 Lab 的 `useSyncExternalStore` 留在单面板演示。

## 生产核对清单

1. reducer 不调用 `produce`。
2. 实体用业务 id，React key 与之相同。
3. 异步完成动作带请求 id，不匹配就计数并返回。
4. 卸载清理 timer 和 `activeRequest`。
5. state 和 action 可序列化。
6. 租户隔离在 store 或 reducer 里，不只在 UI 过滤。
7. DevTools 在生产构建关闭或做动作过滤，避免把正文打进扩展。
8. `reset` 的返回值覆盖全部字段，测试断言没有残留 `result`。

## 升级

钉 `@reduxjs/toolkit@2.13.0`。从 1.x 迁到 2.x 时核对 Immer 主版本和 listener middleware 的类型。默认中间件仍会检查序列化，不要为了塞 Promise 关掉它。

`createAsyncThunk` 的 `condition` 和 `abort` 要和 `activeRequest` 对齐，避免 thunk 和手写 timer 各写一次结果。Lab 没有 thunk，接入时删掉演示用的 `setTimeout`。

## 验收

- `increment` 不修改传入的旧测试对象；两个 store 的计数互不影响。
- 添加的 feed 按 id 唯一。
- 后完成的旧请求不改变 `result`，`ignored` 增加。
- 切换团队后，上一组 timer 被清除。
- `reset` 只影响当前 store。
- `tests/sdk.test.mjs` 使用真实 `configureStore`。无收据则 NOT_RUN。

练习：把 `setTimeout` 换成带 `AbortSignal` 的请求，id 仍进 slice。再为 thunk 写一个在 `condition` 里拒绝过期租户的用例。

## 资料

- https://redux-toolkit.js.org/introduction/getting-started
- https://redux-toolkit.js.org/api/createSlice
- https://redux-toolkit.js.org/api/configureStore
- https://redux-toolkit.js.org/api/createAsyncThunk
- https://redux-toolkit.js.org/usage/usage-guide
- https://www.npmjs.com/package/@reduxjs/toolkit
