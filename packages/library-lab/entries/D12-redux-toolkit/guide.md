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

## 不可变检查和动作设计

默认中间件会在开发时冻结状态并检查意外变更。在测试里把 `getState().feeds` 传进一个会 `push` 的函数，应立刻失败。这比界面“有时多一行”更容易定位。不要用展开运算符把检查关掉。

动作载荷保持扁平：`{ id, value }` 而不是整个 feed 外加回调。`finishRequest` 的 id 是字符串。组件生成 id 时用团队前缀，避免 A 和 B 的序号碰巧相同却被写进错误的心智模型。即便 store 隔离，日志里仍要能看出团队。

`reset` 返回新对象时，Immer 会用它替换 slice。忘记某个字段会在下一轮竞态里留下旧的 `activeRequest`，于是新的完成动作被当成过期。验收要列出全部字段。

从手写 `useReducer` 迁过来时，先把非法组合写成测试：旧请求后到、重复 id、只重置当前团队。再把 reducer 移进 `createSlice`。不要在迁移的同时改竞态规则。

DevTools 关闭是为了演示不被扩展影响。本地调试可以临时打开，但动作里不要放响应正文。生产构建保持关闭，或使用会过滤的配置。时间旅行会重放 `addFeed`，所以 `addFeed` 必须对重复 id 幂等。

## 升级

钉 `@reduxjs/toolkit@2.13.0`。从 1.x 迁到 2.x 时核对 Immer 主版本和 listener middleware 的类型。默认中间件仍会检查序列化，不要为了塞 Promise 关掉它。

`createAsyncThunk` 的 `condition` 和 `abort` 要和 `activeRequest` 对齐，避免 thunk 和手写 timer 各写一次结果。Lab 没有 thunk，接入时删掉演示用的 `setTimeout`。

`useSyncExternalStore` 的第三个参数是服务端快照。示例把 `getState` 同时用于客户端和服务端。这个组件没有真正的 SSR 数据。若放进会预渲染的页面，两个 store 的初始状态必须稳定，不能在渲染期间 `dispatch`。

切换 `<select>` 会换 `active`，effect 重新订阅。上一个 effect 的清理会清掉上一个 store 的 timer。新 store 不会继承上一个的 `activeRequest`。界面上的「已忽略」数字因此只属于当前团队。

`add` 用 `seq` ref 而不是 `feeds.length`。删除若以后加上，长度会回退，id 仍继续增加，避免和已有 id 相撞。当前没有删除按钮，但序号策略已经按这个方向写了。

`ignored` 只增不减，直到 `reset`。不要在成功的 `finishRequest` 里把它清零，否则后到的旧请求会把计数抹掉，测试就看不见拒绝。示例把清零放在整份初始状态里。

切换团队不会把 A 的 `ignored` 加到 B 上。两个 store 的该字段各自从 0 开始。

## 验收

- `increment` 不修改传入的旧测试对象；两个 store 的计数互不影响。
- 添加的 feed 按 id 唯一。
- 后完成的旧请求不改变 `result`，`ignored` 增加。
- 切换团队后，上一组 timer 被清除。
- `reset` 只影响当前 store。
- `tests/sdk.test.mjs` 使用真实 `configureStore`。无收据则 NOT_RUN。

练习：把 `setTimeout` 换成带 `AbortSignal` 的请求，id 仍进 slice。再为 thunk 写一个在 `condition` 里拒绝过期租户的用例。

## 异步动作和选择器

`createAsyncThunk` 生成 pending、fulfilled、rejected 三种动作。`condition` 可以在发请求前看当前 `activeRequest` 和租户，返回 false 就不再启动。`signal` 要传给真正的 HTTP。fulfilled 里仍然调用与 `finishRequest` 相同的 id 比较，不能假设 thunk 的闭包一定是最新的。

Lab 用 `setTimeout` 是为了不碰网络。换成 thunk 时删掉组件里的 timer，避免两套完成路径。`abort` 一个 thunk 不会撤销已经到达服务器的 POST。

listener middleware 适合“动作发生后写日志或导航”。不要在 listener 里再改同一份 feed 而不经过 reducer，否则 DevTools 看不懂。序列化检查失败时，先把不可克隆的对象移出 action，而不是关掉中间件。

`useSyncExternalStore` 的 `getState` 返回整棵根状态。计数变化会让只关心列表的子树也收到新快照。正式代码用 `useSelector(state => state.feeds.counter)` 这种字段选择，并保证选择结果是原始值或记忆化的数组。不要在选择器里 `filter` 出新数组而不做浅比较。

两个 store 的做法让隔离在测试里很明显：给 A `dispatch` 不会改变 B 的 `getState()`。若改成单 store，动作载荷要带 `tenant`，reducer 在 id 前缀不匹配时返回原 state。UI 上的 `<select>` 不能算这一层。

Immer 在 slice 内的草稿不能传出 reducer。`prepare` 回调适合生成 id 和校验载荷，失败时不要 dispatch。Lab 的 id 在组件里生成，校验很薄：重复 id 被跳过。生产的 `prepare` 应该拒绝空字符串。

重置用返回新对象，是因为逐字段赋值容易留下 `result`。测试要断言 `ignored` 也是 0。从 1.x 升级到 2.13 时，动作创建器的类型和 `PayloadAction` 的导入路径保持 `@reduxjs/toolkit`，不要从内部 `dist` 路径导入。

`startRequest` 覆盖 `activeRequest`。连续两次调用时，第一次的 id 立刻过期，即使它的 timer 先触发也会被忽略。示例故意先登记 old 再登记 new，于是先回来的 new 被接受，后回来的 old 被计数。若产品要排队而不是覆盖，应使用队列条目而不是单个字符串。那已经超出本 slice。

`cancelRequest` 把 `activeRequest` 设为 `null`。之后到达的完成动作都会增加 `ignored`，因为没有任何 id 等于 `null` 以外的当前值。清理函数依赖这一点，防止卸载后的 timer 写入 `result`。

添加频道的标题是「新闻源」加 id。这是展示文案，不是排序键。不要用标题做 React key。

计数和列表在同一 slice，是为了少一个 reducer。正式应用可以把计数拆出去，但重置必须仍然一次清空两边，否则会留下孤儿 feed。Lab 的 `reset` 返回完整初始对象，避免这个裂缝。

`configureStore` 的 `reducer` 键是 `feeds`，slice 的 `name` 是 `labFeeds`。动作类型前缀来自 slice name。选择状态时读 `state.feeds`，不要读 `state.labFeeds`。测试若用字符串比较 action type，要写成 `labFeeds/increment` 这一类。

`devTools: false` 对两个 store 都生效。打开一个、关掉一个会让调试时只看见一半团队。保持一致。

竞态按钮在 basic 和 business 不渲染，但 reducer 仍接受 `finishRequest`。测试可以不经过按钮直接 dispatch。界面隐藏不是安全边界。

`feeds` 初始是空数组，不是 `null`。`map` 之前不必再判断空值。`reset` 也回到空数组，而不是留下 `undefined`。

## 资料

- https://redux-toolkit.js.org/introduction/getting-started
- https://redux-toolkit.js.org/api/createSlice
- https://redux-toolkit.js.org/api/configureStore
- https://redux-toolkit.js.org/api/createAsyncThunk
- https://redux-toolkit.js.org/usage/usage-guide
- https://www.npmjs.com/package/@reduxjs/toolkit
