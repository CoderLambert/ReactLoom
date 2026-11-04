# D07 TanStack Query — 工程手册

## 适用

服务端缓存、取消、失效、乐观更新。表单草稿和 UI 偏好不要放进 Query。

## 版本

`@tanstack/react-query@5.104.1`。本示例自己创建 `QueryClient`。

## 迁移

带走 `examples/example.tsx` 的键结构和 `examples/optimistic-policy.mjs`。queryKey 含租户、搜索和页码。`queryFn` 使用传入的 `signal`。不要把 Lab 的内存 fixture 复制进生产。

## 不可删的清理

卸载增加 `tenantEpoch`。取消用 `cancelQueries` 且工作函数要监听 abort。乐观更新按行 id 和 token 回滚，不能覆盖同页其他行。成功后再 invalidate 这一租户的 feeds 和 stats。

## 反例

- 键里丢掉租户或页码。
- 用上一页数据当新键的占位。
- 按下标做乐观更新。
- 失败后不回滚。
- `clear()` 掉应用级 QueryClient。
- 把 Query 结果再存进 Zustand 当第二权威。

## 测试断言

- 同一行的回滚不改其他 id。
- token 不匹配时不回滚。
- 409 后该行回到点击前。
- 租户切换后旧 mutation 不能写提示。
- 策略单测不是浏览器缓存证明。

## 真实限制

没有网络。`staleTime` 是演示数字。取消列表不会自动取消另一个租户。

## 证据

没有收据不要写 PASS。
