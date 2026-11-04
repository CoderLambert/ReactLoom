# TanStack Query 5.104.1｜缓存键、取消和乐观回滚

Lab 锁定 `@tanstack/react-query@5.104.1`。Query 拥有服务端缓存。它不是表单草稿，也不是全局 Zustand。Lab 为这个 Demo 单独 `new QueryClient()`，卸载只清这个 client，不动宿主应用的缓存。

没有逐库收据时不要写 PASS。Actions [41779873259](https://github.com/CoderLambert/ReactLoom/actions/runs/41779873259) 是仓库级结果。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 使用真实的 `useQuery`、`useMutation`、`useIsFetching`。[`examples/optimistic-policy.mjs`](examples/optimistic-policy.mjs) 规定一行乐观更新怎么写、怎么回滚、怎么提交。后端是 `createFixtureBackend`：内存数组，`list` 和 `stats` 接受 `AbortSignal`，更新会在 `rev` 不一致时抛 409。没有真实 HTTP。

已挂载：

- queryKey 分层：`tenant`、`feeds`、`list(tenant, search, page)`、`stats(tenant)`。搜索和页码在键里，所以上一页不能当成新键的 placeholder。
- `queryFn` 把 `signal` 传进 fixture 的 `pause`。取消是 `cancelQueries({ queryKey: keys.feeds(tenant) })`。
- 列表 `staleTime` 3 秒，统计 10 秒。按钮可以把当前租户整棵键标成失效。
- 乐观更新：先 `cancelQueries`，再 `getQueriesData` 做快照，再 `setQueriesData`。`optimisticRow` 只改目标 id，并带 token 和期望的 `rev`。失败时 `rollbackRow` 按 token 把那一行放回去，不覆盖同页其他行后来的修改。成功 `commitRow` 后按租户 `invalidateQueries`。
- 切换租户增加 `tenantEpoch`。A→B→A 不能把第一次 A 的 mutation 文案写回来。进行中的行 id 记在 ref 里，避免同一行叠两次乐观更新。

没有挂载：持久化到 IndexedDB、无限滚动、`placeholderData: keepPreviousData`、跨标签广播。

## 1. 键

```text
['library-lab','query-demo', tenant, 'feeds', search, page]
```

少一个维度，两个租户或两页就会共用缓存。不要把对象直接放进键，除非它是稳定序列化的。Lab 用字符串和数字。

## 2. 乐观更新

```text
cancel → snapshot → setQueriesData(optimisticRow)
        → 请求失败 → rollbackRow(token)
        → 请求成功 → commitRow → invalidate
```

`expectedRev` 对不上时 fixture 抛错，UI 应回到快照而不是留下半行。连点防护不等于服务端串行。409 要能刷新。

## 3. 反例

### 反例 1：键里没有租户

```ts
useQuery({ queryKey: ['feeds'], queryFn: () => list(tenant) })
```

切换团队会先显示上一团队的行。把 `tenant` 放进键，并在切换时不要复用旧 data 当新键的占位。

### 反例 2：queryFn 不收 signal

```ts
queryFn: () => backend.list(tenant, search, page)
```

`cancelQueries` 无法停掉 fixture 里的 timer，卸载后仍可能 `setState`。Lab 把 signal 传进 `pause`。

### 反例 3：乐观更新按数组下标

下标在翻页和搜索后指向别的行。用业务 id 和 token。回滚只恢复那个 token 仍匹配的行。

### 反例 4：失败后不回滚就 invalidate

用户会先看到错误的开关，再闪回。先按快照回滚，再决定要不要重新拉取。

### 反例 5：一个全局 QueryClient 被 Demo 清掉

`queryClient.clear()` 会伤到应用其他页面。Lab 的 client 包在 `QueryClientProvider` 里，生命周期跟着这个示例。

### 反例 6：把 mutation 变量存成第二份列表

列表的权威在缓存。本地 `useState` 只放搜索草稿、页码和提示。草稿未提交前不要写进 `setQueryData`。

## 4. 组合

**表格**：Query 提供当前页，Table 只做展示和选择。分页状态放进 queryKey。

**Zod**：在 `queryFn` 里 `safeParse` 响应。失败是数据错误，不要缓存非法行。

## 5. 练习

1. 团队 A 点开关后立刻切到 B 再切回 A，第一次的迟到成功不能改 B 的行，也不能用过期 epoch 写提示。
2. 把 delay 调大再按取消，列表不应再闪成旧结果。
3. 制造 409，确认该行回到点击前的 `enabled` 和 `rev`。

## 6. 证据

`optimistic-policy` 不创建 QueryClient。SDK 套件要真实 import `@tanstack/react-query` 并留下收据。

## 7. 资料

- https://tanstack.com/query/latest/docs/framework/react/overview
- https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
- https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
