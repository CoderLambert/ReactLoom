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

## 端点设计细则

`builder.query` 的泛型是结果和参数。`builder.mutation` 的泛型是结果和参数。Lab 的 `baseQuery` 用内部的 `QueryArg` 区分 `list` 和 `toggle`，hook 的参数则是给人看的 `{ tenant, search }` 或 `{ tenant, id }`。`query` 回调负责把后者收成前者。不要让组件直接传 `kind`。

`onQueryStarted` 没有使用。若要在里面 `dispatch` 别的动作，失败路径要自己撤销。更稳妥的是让标签系统做重取。Lab 选择标签，是因为 fixture 的成功写入已经改变了内存，重取能读到新值。

固定延迟 200ms 让加载句有机会出现。700ms 用来制造“用户已经换了搜索”的窗口。不要把这两个数字写成性能指标。取消发生在 `wait` 的 abort 监听里，状态码 499 只出现在演示错误对象里。

`isLoading` 在已有 `currentData` 时为假，即使 `isFetching` 为真。文案先看加载，再看刷新，再看错误。只看 `isLoading` 会让重取期间像已经结束。

搜索表单的 `onKeyDown` 同时看 `isComposing` 和 `keyCode === 229`。有的浏览器在组合结束的那一次 Enter 上仍会带 229。只判断 `composing` ref 会漏掉这一下。两个条件都要阻止默认提交。

team-b 的 `conflict` 行 id 是稳定的。测试可以连续 toggle 两次，断言 `paused` 仍为 false，并且缓存失效次数没有增加。成功行则相反：`paused` 翻转，list 被重取。

若要加入乐观更新，`updateQueryData` 的 undo 必须和 epoch 一起保存。迟到的 409 不能 undo 到更新的搜索结果上。当前代码不乐观，所以没有这份 undo。不要在指南示例之外临时加一段不看 epoch 的补丁。

`keepUnusedDataFor` 使用 Toolkit 的默认秒数。演示卸载时直接 `resetApiState`，不依赖这段时间。生产若要缩短，写明登出和切换账户都会复位，而不是只把秒数改成 0 却留下令牌。

## 升级

钉 Toolkit `2.13.0` 和 `react-redux@9.3.0`。RTK Query 随 Toolkit 发布，不要另找一个版本号不同的 `@rtk-query` 包。

从手写 `useEffect` 迁过来时，先把缓存键（租户、搜索）列出来，再决定标签粒度。升级 Toolkit 主版本时重跑“409 不失效”和“currentData 不串租户”这两条，因为中间件和 hook 的选择数据曾经变过。

`fetchBaseQuery` 的 `prepareHeaders` 若以后接上令牌，头只能加到可信 baseUrl。Lab 的自定义 baseQuery 没有这个头。

列表的 key 是 feed id，不是标题。两行标题可以相同，id 不行。fixture 的 id 在两个租户间也不重复，但查询仍然用 `tenant` 再滤一次，防止以后把行合并进一个数组时串租户。

`mutation.isLoading` 为真时所有切换按钮禁用。409 返回后 `isLoading` 变回假，用户可以再点。再次点击 `conflict` 仍是 409。不要用“已经失败过”的本地标志阻止重试，除非产品要求。

慢传输按钮不 abort 当前请求。它只影响下一次 `wait`。要停掉当前这次，靠换搜索、换租户或卸载时的 abort。文案不要写成“当前请求已经变慢”。

`JSON.stringify(error)` 用于提示，错误结构是 `{ status, data }`。若 `data` 以后变成对象，仍要避免把请求头放进去。现在的 409 数据是固定字符串 `stale-revision`。

搜索提交用 `trim` 后的 draft。只含空格的查询会变成空字符串，从而显示该租户的全部行。这和“没有匹配”不同。空结果句只在过滤后数组长度为 0 且不在加载时出现。

## 验收

- team-a 与 team-b 的缓存条目同时存在且内容不同。
- 成功 toggle 使该租户标签失效并重取；409 不失效，`conflict` 的 `paused` 不变。
- 切换参数后列表不显示上一参数的行。
- 慢请求在卸载或新一次切换后不改提示。
- Enter 在组合输入和 keyCode 229 时不提交。
- 卸载调用 `resetApiState`，不触碰别的 store。
- `tests/sdk.test.mjs` 使用真实 `createApi`。无收据则 NOT_RUN。

练习：给每行加 `revision`，409 时展示服务端正文并保持标签。再把 `fetchBaseQuery` 接上本地 MSW，断言取消后的 PATCH 没有第二次写。

## 缓存生命周期和序列化

查询订阅开始时，若缓存缺失或标签已失效，middleware 调用 `baseQuery`。同一参数的第二个订阅会共享这次在途请求。Lab 的面板用 key 卸掉旧订阅，所以切换租户时旧的 list 不再保持组件订阅，但 store 里的缓存条目还在，直到 `resetApiState` 或缓存被回收。这就是 advanced 能说“两个租户都在 store 里”的原因：条目可以同时存在，界面只读当前参数的 `currentData`。

`providesTags` 在结果还没回来时也可以提供类型级标签。Lab 只提供带租户 id 的标签，避免一个失败的 list 把所有租户标脏。mutation 的 `invalidatesTags` 收到的 `result` 在错误路径是 `undefined`。用 `result ? tags : []` 把 409 留在缓存外。若产品要在 409 之后强制重取，应显式 `refetch`，而不是让所有错误都失效。

轮询 `pollingInterval` 没有打开。打开后，离开页面要停掉，否则后台会继续打 fixture。`refetchOnFocus` 也不在默认演示里。需要时只对当前租户的端点开启。

固定缓存键还包含序列化后的参数。搜索字符串的首尾空白在提交时已经 `trim`。不要把未 trim 的 draft 放进 hook 参数，否则 `"React"` 和 `"React "` 会变成两条缓存。

`baseQuery` 的错误对象只有 `status` 和 `data` 字符串，能通过 Redux 的序列化检查。不要把 `Response` 或 `AbortSignal` 放进 `error.data`。取消用 499 这个演示状态，不是标准 HTTP。界面把它显示成拒绝，而不是成功的空列表。

乐观更新若以后加上，用 `updateQueryData` 改当前参数的缓存，并在 `patchQueryData` 的 undo 上绑定请求 id。Lab 现在让 fixture 先改内存，再靠标签重取。失败路径不改内存，所以不需要 undo。不要一半改内存、一半只改缓存。

`react-redux` 的 `Provider` 必须包住调用 `useListQuery` 的组件。把 Provider 放在面板内部是因为 store 属于这个示例。提升到应用根上时，不要和另一个 `createApi` 共用 `reducerPath`。

代码生成工具可以产出端点，但生成的 `invalidatesTags` 往往默认成功失败都失效。生成后要按本条目的 409 规则改掉，并把 signal 从 `baseQuery` 传到 `fetch`。

分页若加入参数，标签 id 要决定是整租户失效还是单页失效。整租户简单，但会重取每一页的订阅。Lab 没有页码，搜索词已经在查询参数里，所以一个租户标签足够。

`useToggleMutation` 返回的触发器和状态是一对。`mutation.isLoading` 在任一请求进行时为真，按钮会禁用全部行。这是粗粒度锁。`inFlight` 的 abort 只保留最后一次触发器。若要按行并行，需要每行一个 epoch，并接受 fixture 没有事务隔离。当前合同是整表一次只追一个提示。

`refetch` 使用当前 hook 参数，不会用上一次搜索。清空缓存后列表会重新 `isLoading`。这个按钮在 advanced，避免 basic 用户把“没数据”理解成种子丢了。种子在闭包的 `feeds` 变量里，`resetApiState` 不清它。只有重新挂载 `createDemoRuntime` 才回到初始 `paused`。

搜索的 `includes` 区分大小写与否取决于种子。种子是中文标题，英文搜索词按 JavaScript 字符串包含。不要把它写成全文分词。

`Provider` 的 store 和 `runtime.store.dispatch` 是同一个。在 Provider 外调用 `useListQuery` 会抛错。测试若直接 `dispatch` API 动作，必须先挂上 middleware。

延迟用 `setDelay` 改闭包变量，不进 Redux。它不是缓存键的一部分。同样的查询参数在调慢之后，下一次请求才变慢，已在途的 `wait` 仍用旧的定时器。这是故意的，避免在途 Promise 被换掉却不 abort。

404 来自找不到的 id。界面没有按钮能发出未知 id，但 baseQuery 仍返回 404 而不是抛异常。生成的客户端若把未知 id 当成成功空对象，就会违反这条。

标签 id 用租户字符串而不是数组下标。team-a 与 team-b 的失效互不影响。测试可以在 team-a 成功 toggle 后读取 team-b 的缓存时间戳，它不应因为这次失效而更新。

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
