# TanStack Query 5.104.1｜查询键、取消和按行回滚

Lab 锁定 `@tanstack/react-query@5.104.1`（MIT）。研究笔记里的 5.104.5 不是这个钉。v5 使用对象形式 API：`gcTime` 取代 `cacheTime`，`placeholderData` 取代 `keepPreviousData: true`。Query 保存服务端状态的客户端副本。它不是 HTTP 客户端，也不做鉴权。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。每个示例 `useState` 创建一个自己的 `QueryClient`，默认 `retry: false`、`gcTime: 60_000`。卸载时只 `client.clear()` 这个实例，不动 Library Lab 其他页面的缓存。

后端是 `createFixtureBackend()`：内存里的 team-a / team-b 列表。`list` 和 `stats` 把 `queryFn` 的 `signal` 传给 `pause`。没有 `fetch`，也没有宿主 API。

查询键工厂把范围放进数组：`['library-lab','query-demo', tenant, 'feeds', search, page]` 和 stats 键。搜索是提交后的 `search`，不是每个按键。分页每页 3 条。stats 的 `staleTime` 是 10 秒，列表是 3 秒，都是教学选择。官方默认 `staleTime` 是 0。

示例明确不使用 `placeholderData`。上一页或上一次搜索的数据不能当成新键的占位，否则会把别的查询结果画进当前键。

advanced 的 `useMutation` 使用 `scope.id` 按租户串行。`onMutate` 先 `cancelQueries` 列表前缀，再只快照被改的那一行。[`examples/optimistic-policy.mjs`](examples/optimistic-policy.mjs) 的 `optimisticRow` 要求 id 和 `rev` 匹配，且该行还没有 `optimisticToken`。失败时 `rollbackRow` 只恢复仍带着这枚 token 的行。成功时 `commitRow` 写入服务端返回的 `rev` 并去掉 token。迟到的失败不能回滚更新的草稿。

`tenantEpoch` 在切团队和卸载时增加。A → B → A 不会把第一次 A 的提示写回来。`onSettled` 仅当该租户没有其他进行中的 mutation 时才 `invalidateQueries`。同一行用 `inFlightRows` 挡住连点，这只是 UI 锁，不是服务端串行。

勾选「模拟下一次更新 409」会让 fixture 抛错并按行回滚。`rev` 不一致也会失败。

没有挂载：真实 HTTP、SSR `dehydrate`、Orval、nuqs、无限列表。v5 的这些能力仍在下面说明。

## 什么时候用

多个组件共享会变的远程数据，需要去重、失效、重试策略、分页和写入后的重新校验。网络层用 Ky、Axios 或应用自己的 API client，把 `signal` 传进去。

一次性静态 JSON、纯本地开关、已经由框架 loader 管好的缓存，不必再套一层。强一致协作用事件或 CRDT。若整个应用已经在 Redux 里，用 D13 RTK Query 避免两套缓存。SWR 是更少配置的替代，边界仍是服务端状态。

Query 不管表单光标、未保存草稿和数据库所有权。

## 模型

`QueryClient` 持有 QueryCache 和 MutationCache。`useQuery` 通过 observer 订阅某个 `queryKey`。相同键共享数据和进行中的请求；不同键不合并。

- `staleTime`：成功后多久仍算 fresh。默认 0，所以聚焦和重连会后台请求。`'static'` 连手动失效也不刷新，不要把它当成 `Infinity`。
- `gcTime`：没有 observer 之后缓存还能留多久。它不是过期时间。仍被订阅的查询不会因为 gcTime 被删掉。Lab 设成 60 秒。
- `isPending`：还没有可用数据。`isFetching`：正在请求，包括后台刷新。
- `queryFn` 收到的 `signal` 必须交给真正会停的工作。组件卸载默认不一定等于网络已取消。Lab 的 `pause` 监听 abort。
- `invalidateQueries` 是标记失效并让活跃查询重取，不是“服务器已确认”的同义词。`removeQueries` 删缓存。`clear()` 清空这个 client。登出还要清持久化和令牌。
- mutation 默认不重试。Lab 把 query 重试也关了，避免 fixture 失败被自动再跑。

键必须是数组。对象可以出现在元素里，但顺序和内容要稳定。不要把 `Date.now()` 放进键。

## 三层示例

### 基本

选择团队，看订阅源总数和启用数。按钮把当前团队前缀标成失效。后台个数来自 `useIsFetching`。切换团队会换键，A 的统计不会显示成 B。

### 业务

提交搜索词后键里的 `search` 才变，页码回到 0。翻页使用 `total`。空列表有明确文案。placeholder 被故意关掉，所以换页时会看到新的 pending 或 fetching，而不是上一页的行冒充新键。

### 进阶

可拉长本地延迟、取消列表查询、让下一次切换走 409。按钮在 mutation `isPending` 时禁用，同一 id 还有 in-flight 集合。失败文案来自按行回滚之后。成功文案里的 `rev` 来自 fixture 返回值。

研究包里的 `x-demo-tenant` 请求头没有出现。那个头不能当成安全隔离。Lab 的租户只是内存键的一部分，服务端仍要鉴权。

## 反例

### 反例 1：键里没有身份

```tsx
useQuery({ queryKey: ['feeds'], queryFn: () => backend.list(tenant, search, page, signal) })
```

```tsx
useQuery({ queryKey: keys.list(tenant, search, page), queryFn: ({ signal }) => backend.list(tenant, search, page, signal) })
```

### 反例 2：queryFn 丢掉 signal

```tsx
queryFn: () => backend.list(tenant, search, page, new AbortController().signal)
```

用参数里的 `signal`。取消按钮调用 `cancelQueries` 才影响得了这次 `pause`。

### 反例 3：4xx 也当成功

fixture 用抛错表示 409。真实 `fetch` 必须在 `!response.ok` 时抛出，否则 Query 会缓存失败正文。

### 反例 4：把 staleTime 当成删除期限

数据变旧只会允许重取。删除不活跃缓存看 `gcTime`。

### 反例 5：在渲染期间 new QueryClient

Lab 把 client 放在 `useState` 初始化函数里，卸载再 `clear()`。SSR 则每个请求一个 client，不要模块级单例共享用户。

### 反例 6：原地改缓存

```tsx
old.items.find(row => row.id === id).enabled = !enabled
```

```tsx
optimisticRow(old, { id, enabled, expectedRev, token })
```

返回新 page 对象。不匹配的行保持原引用。

### 反例 7：失败时恢复整页旧快照

并发改了另一行之后，整页回滚会丢掉那一行的成功结果。只恢复仍持有本 token 的行。

### 反例 8：无条件 keepPreviousData

v5 写成检查过身份的 `placeholderData`。Lab 连占位也不做，避免跨搜索串页。

### 反例 9：切租户后仍显示上一轮的成功句

必须看 `tenantEpoch` 和当前租户。只比较闭包里的旧 `tenant` 常量会在 A → B → A 时写错会话。

### 反例 10：onSettled 无条件失效

还有更新的乐观草稿时，失效重取会盖住它。Lab 在同键 mutation 数量不是 1 时跳过失效。

## 组合

**Ky 或 Axios + Zod**：queryFn 里发请求并 `parse`。401 清当前用户缓存。不要把生成的 TypeScript 类型当成运行时校验。

**Table + URL 状态**：分页和搜索进键，也进 URL。表格使用服务端 `total`，虚拟列表只裁 DOM，不要再对服务端页切一次。

**Dexie + Workbox**：Query 是在线快照。结构化离线记录用 Dexie。CacheStorage 用 Workbox，并且不要在 Lab 主源注册。不要把含令牌的缓存写进共享 localStorage。

## 生产核对清单

1. 键包含身份、过滤和分页；对象元素稳定。
2. `signal` 到达会真正中止的那一层。
3. 非 2xx 抛错；4xx 和取消不重试；非幂等 POST 不重试。
4. 乐观更新按行或按实体保存快照，token 对得上才回滚或提交。
5. 写入前取消同一查询的在途请求；结束时再按策略失效。
6. 登出 `clear` 这个用户的 client，并清持久化。
7. SSR 每请求一个 client；脱水 JSON 按框架要求做转义。
8. `isPending` 和 `isFetching` 都有可读状态，不只靠禁用按钮。

## 升级

钉 `5.104.1`。从 v4 迁移时改掉位置参数 `useQuery(key, fn)`、`cacheTime`、`keepPreviousData: true`，以及把旧 `isLoading` 一律替换成同一个词。v5 要同时看 `isPending` 和 `isFetching`。

`'static'` 的 staleTime 会挡住常规失效。升级后搜一遍这个字符串。

React Query 这个旧包名不要写进依赖。核心是 `@tanstack/react-query`。

## 验收

- team-a 与 team-b 的缓存键不同，统计数字随种子变化（9 与 6）。
- 搜索和页码进入键；换键后不把上一份列表当占位。
- `cancelQueries` 能让传入的 signal abort。
- 409 或版本不符只回滚带当前 token 的那一行，同页其他成功编辑还在。
- 更晚的 token 不会被更早的 `onError` / `onSuccess` 覆盖。
- 切租户或卸载后，旧 epoch 不写提示。
- `tests/sdk.test.mjs` 使用真实 `QueryClient`。策略测试不是 sdk。无收据则 NOT_RUN。

练习：把 `useEffect` 拉列表改成 `useQuery`，断言两个观察者共享同一次在途请求。再把 v4 的 `cacheTime` 改成 `gcTime`，并给 DELETE 加 revision，让其中一个 409 按行回来。

## 资料

- https://tanstack.com/query/latest/docs/framework/react/overview
- https://tanstack.com/query/latest/docs/framework/react/installation
- https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults
- https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
- https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation
- https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5
- https://tanstack.com/query/latest/docs/framework/react/guides/ssr
- https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries
- https://github.com/TanStack/query/releases
