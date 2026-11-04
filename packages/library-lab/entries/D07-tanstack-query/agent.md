# D07 TanStack Query — 工程手册

## 适用

共享的服务端快照：按键去重、失效、取消、分页和带版本的写入。HTTP 细节留在 Ky、Axios 或 API client。表单草稿和主题留在组件或 Zustand。

不要把 Query 当成数据库或鉴权。已有 Redux 中心时先比较 RTK Query，避免两套缓存。

## 版本

`@tanstack/react-query@5.104.1`，MIT。对象 API。`gcTime`、`isPending` 与 `isFetching` 按 v5 理解。

Lab 的 client 默认 `retry: false`。这是示例选择，不是官方默认（查询失败通常会重试）。不要把 5.104.5 写进依赖。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走键工厂、独立 `QueryClient`、fixture 的 signal，以及 [`examples/optimistic-policy.mjs`](examples/optimistic-policy.mjs)。`demo.tsx` 只重导出。

每个演示实例在卸载时 `clear()` 自己。不要去清宿主的全局 client。

搜索使用提交后的字符串。不要在 `onChange` 里直接改 queryKey，除非产品确定每个按键都是一次新查询。

## 不可删的清理

`queryFn` 必须使用入参 `signal`。列表取消按钮取消 `keys.feeds(tenant)`。

乐观路径：`cancelQueries` → 只快照目标行 → `optimisticRow` 写入 token → 失败 `rollbackRow` → 成功 `commitRow`。token 或 `rev` 对不上就保持原页。

`tenantEpoch` 在切换和卸载时增加。写提示前比较 epoch 和租户。`onSettled` 在仍有其他同键 mutation 时不要失效。

`inFlightRows` 只防连点。服务端仍用 `rev` 做比较并交换。

## 反例

- queryKey 只有 `['feeds']`。
- 键里放 `Date.now()`。
- 丢掉 `signal`，或另造一个用不上的 AbortController。
- `response.ok` 为假仍返回 JSON。
- 渲染函数里 `new QueryClient()`。
- 原地 `push` 改缓存。
- 失败时恢复整页旧快照。
- 无条件占位数据跨租户显示。
- 切团队后仍提交上一轮的成功文案。
- 把 `placeholderData` 加回去却不检查键。

## 测试断言

- 两个租户的缓存条目不互相覆盖。
- `cancelQueries` 会 abort 传给 queryFn 的 signal。
- 乐观补丁只改匹配 id 且 `rev` 相符、尚未持有 token 的行。
- 回滚只恢复仍属于该 token 的行，保留同页其他编辑。
- 迟到的错误不能撤销更新的 token。
- 提交使用服务端 `rev`，并去掉临时 token。
- 缺页、缺行时原样返回，不制造空页。
- `tests/sdk.test.mjs` 构造真实 QueryClient。无收据则 NOT_RUN。

## 真实限制

fixture 不走网络。延迟和 409 是本地开关。没有 SSR 脱水，没有持久化，没有 `placeholderData`。UI 串行 scope 不等于数据库事务。

`staleTime` 10 秒和 3 秒是演示。生产按数据变化速度另定，并记住默认值是 0。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
