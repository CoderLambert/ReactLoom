# RTK Query｜租户标签、currentData 和 409 不失效

Lab 锁定 `@reduxjs/toolkit@2.13.0` 与 `react-redux@9.3.0`（MIT）。端点来自 `@reduxjs/toolkit/query/react` 的 `createApi`。缓存放在 Redux store 里。没有 Redux 中心时，先比较 D07 TanStack Query，不要为了这一个列表引入整套 store。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。`createDemoRuntime` 每次挂载造一个 store、一个 API 和一份内存 `feeds`。`baseQuery` 不是 `fetchBaseQuery`。它等待 `delay` 毫秒并监听 `signal`，然后按 `kind` 过滤或切换。origin 不存在，因为没有 URL。

`reducerPath` 是 `rlCD13RtkApi`，避免和别的演示撞键。`tagTypes` 只有 `Feeds`。`list` 的 `providesTags` 是 `{ type: 'Feeds', id: tenant }`。`toggle` 的 `invalidatesTags` 仅在有 `result` 时返回该租户标签。409 和 404 走 `error`，标签不失效，所以失败不会触发一次无意义的整表重取来“洗掉”错误。

`useListQuery` 读的是 `currentData`，不是 `data`。`data` 可能还留着上一个参数的成功结果。`currentData` 在参数（租户或搜索）对不上时是 `undefined`。面板还用 `key={JSON.stringify([tenant, search])}` 换查询时卸掉旧面板。

搜索框在 `compositionstart` 到 `compositionend` 之间不提交。Enter 若 `isComposing` 或 `keyCode === 229` 会被阻止。提交后才把 `draftSearch` 写入真正的 `search`。

切换状态前递增 `requestEpoch`，abort 上一次的 mutation 触发器，再 `unwrap()`。只有 epoch 仍匹配才改提示。卸载时 epoch 增加并 abort。整个示例卸载时 `resetApiState()`，只清这个 store。

advanced 把延迟调到 700ms，并可以 `resetApiState`。team-b 的 `conflict` 行固定返回 `{ status: 409, data: 'stale-revision' }`。

没有挂载：`fetchBaseQuery`、轮询、无限查询、代码生成、乐观补丁。内存行会在成功切换时真的翻转 `paused`，那是 fixture 的可变数据，不是服务器。

## 什么时候用

应用已经用 Redux 描述本地状态，远程资源也要同一套订阅、失效和 DevTools 轨迹时用 RTK Query。它把端点定义成 slice，缓存条目按参数分开。

它不替代服务端授权。`tenant` 进参数只说明缓存键不同。fixture 不会核对身份。它也不是上传器和持久离线队列。

若团队没有 Redux，Query 的 `queryKey` 更直接。两边不要同时缓存同一资源。

## 模型

`createApi` 生成 reducer、middleware 和 hooks。store 必须 `concat(api.middleware)`，否则失效和请求生命周期不会跑。Lab 的 `configureStore` 做了这件事。

`baseQuery` 返回 `{ data }` 或 `{ error }`。抛异常会被中间件接住，但 Lab 用返回值表达 404、409 和取消（499）。取消发生在 `wait` 里，signal 已 abort 就不再改 fixture。

查询缓存的键包含端点名和参数。`team-a` 与 `team-b`、不同搜索词，是不同条目。标签是失效的索引：成功的 mutation 使该租户的 list 过期并重取。失败不提供标签，缓存里的旧成功数据留到下一次合法失效。

`isLoading` 表示这个缓存还没有数据。`isFetching` 表示正在请求，包括已有数据时的刷新。面板把三者写成不同句子。

`currentData` 绑定当前参数。切换租户的同一帧若仍读 `data`，可能闪出上一租户的标题。Lab 两者都避开了：换 key 重挂载，并且只渲染 `currentData`。

mutation 的触发函数返回带 `abort` 和 `unwrap` 的对象。`unwrap` 把 `{ error }` 变成抛出。组件在 `finally` 里只有 epoch 匹配才清掉 in-flight 引用，避免旧请求把新请求的引用清掉。

`resetApiState` 丢掉这个 API 的缓存和进行中的订阅状态。不要对应用的根 store 在随手一个按钮里调用，除非产品就是“退出并清空”。Lab 的 store 是私有的。

## 三层示例

### 基本

默认租户 team-a，搜索为空。列表应出现「科技日报」和「前端精选」。点切换会成功，标签失效，列表重取后 `paused` 变化。重新获取只打当前参数。

### 业务

切换到 team-b 看到「安全研究」和「只读受保护频道」。搜索「安全」只留匹配标题。IME 组合过程中按 Enter 不改变查询参数。租户切换不会把 team-a 的行留在列表里。

### 进阶

对 `conflict` 点切换，提示里是 409，fixture 里的 `paused` 不变，标签也不失效。把延迟调到 700ms 后立刻改搜索或卸载，epoch 让旧的成功或失败提示写不回来。清空缓存只影响 `rlCD13RtkApi`。

## 反例

### 反例 1：忘记 middleware

```ts
configureStore({ reducer: { [api.reducerPath]: api.reducer } })
```

```ts
configureStore({
  reducer: { [api.reducerPath]: api.reducer },
  middleware: getDefault => getDefault().concat(api.middleware),
})
```

### 反例 2：用 data 显示新参数

```tsx
const { data } = api.useListQuery({ tenant, search })
```

切到 team-b 时 `data` 仍可能是 team-a 的数组。

```tsx
const { currentData } = api.useListQuery({ tenant, search })
const rows = currentData ?? []
```

### 反例 3：失败也 invalidatesTags

```ts
invalidatesTags: (_result, _error, args) => [{ type: 'Feeds', id: args.tenant }]
```

409 会立刻重取，把刚刚的错误状态冲掉，也可能把别的乐观界面盖住。

```ts
invalidatesTags: (result, _error, args) => result ? [{ type: 'Feeds', id: args.tenant }] : []
```

### 反例 4：标签只有类型没有 id

`{ type: 'Feeds' }` 会使所有租户的列表失效。Lab 把 id 设成租户。行级标签可以再加 feed id，但失效策略要写明，避免一条 409 刷新全部人。

### 反例 5：baseQuery 忽略 signal

```ts
await wait(delay)
```

卸载后 fixture 仍可能翻转 `paused`。`wait` 必须把 abort 变成 `{ error }` 并在那之前返回。

### 反例 6：unwrap 之后无条件 setNotice

```tsx
await request.unwrap()
setNotice('已修改')
```

搜索框或租户已经变了。比较 `requestEpoch`。

### 反例 7：把 query 参数当成授权

```tsx
useListQuery({ tenant: selected })
```

任何人都能改下拉框。服务端按会话决定租户。缓存键只防止浏览器里串页。

### 反例 8：组件每次渲染 createApi

`createApi` 在 `useState` 初始化函数里发生一次。渲染期间再建会换 hook 身份。Lab 的 `runtime` 稳定。

### 反例 9：IME 期间提交搜索

```tsx
onChange={event => setSearch(event.target.value)}
```

拼音中间态会变成查询参数。Lab 用 draft，提交时才写入，并挡住 229。

### 反例 10：resetApiState 打在全应用 store

演示按钮可以清私有 store。生产登出要清的是当前用户的缓存和凭证，不是把无关 slice 一起复位却留下令牌。

### 反例 11：用 RTK Query 再抄一份进 slice

`extraReducers` 把 `list.matchFulfilled` 写进另一个数组后，失效只更新了缓存，界面仍读旧数组。选一个主人。

## 组合

**Redux Toolkit slice**：流程字段（向导步骤、选中 id）留在 slice。资源列表留在 API cache。两者可以同一个 store。

**Zod**：`baseQuery` 返回前 `parse`。TypeScript 的 `Feed` 不会在运行时拒绝缺字段。Lab 的 fixture 自己构造对象，没有解析器。

**TanStack Query**：不要并行缓存同一 `/feeds`。迁移时先停掉其中一边的失效，否则双写会闪烁。

## 生产核对清单

1. store 接了 `api.middleware`，`reducerPath` 唯一。
2. 列表渲染 `currentData`，或在参数变化时卸掉旧订阅。
3. 标签 id 含租户；成功才失效；409 不失效。
4. `baseQuery` 观察 `signal`，取消不改 fixture。
5. mutation 提示看 epoch；卸载 abort。
6. IME 不把组合文本推进查询参数。
7. `resetApiState` 的按钮范围写在文案里。
8. 服务端独立鉴权，不信任参数里的 tenant。
9. 不要为了演示改用会打到外网的 `fetchBaseQuery`，除非端点是你自己的。
10. 错误对象可序列化：Lab 的 `Failure` 是 `{ status, data }`。

## 升级

钉 Toolkit `2.13.0` 和 `react-redux@9.3.0`。RTK Query 随 Toolkit 发布，不要另找一个版本号不同的 `@rtk-query` 包。

从手写 `useEffect` 迁过来时，先把缓存键（租户、搜索）列出来，再决定标签粒度。升级 Toolkit 主版本时重跑“409 不失效”和“currentData 不串租户”这两条，因为中间件和 hook 的选择数据曾经变过。

`fetchBaseQuery` 的 `prepareHeaders` 若以后接上令牌，头只能加到可信 baseUrl。Lab 的自定义 baseQuery 没有这个头。

## 验收

- team-a 与 team-b 的缓存条目同时存在且内容不同。
- 成功 toggle 使该租户标签失效并重取；409 不失效，`conflict` 的 `paused` 不变。
- 切换参数后列表不显示上一参数的行。
- 慢请求在卸载或新一次切换后不改提示。
- Enter 在组合输入和 keyCode 229 时不提交。
- 卸载调用 `resetApiState`，不触碰别的 store。
- `tests/sdk.test.mjs` 使用真实 `createApi`。无收据则 NOT_RUN。

练习：给每行加 `revision`，409 时展示服务端正文并保持标签。再把 `fetchBaseQuery` 接上本地 MSW，断言取消后的 PATCH 没有第二次写。

## 资料

- https://redux.js.org/toolkit/rtk-query/overview
- https://redux.js.org/toolkit/rtk-query/usage/cache-behavior
- https://redux.js.org/toolkit/rtk-query/usage/queries
- https://redux.js.org/toolkit/rtk-query/usage/mutations
- https://redux.js.org/toolkit/rtk-query/usage/automated-refetching
- https://redux.js.org/toolkit/rtk-query/api/created-api/hooks
- https://react-redux.js.org/introduction/getting-started
- https://www.npmjs.com/package/@reduxjs/toolkit
- https://www.npmjs.com/package/react-redux
