# D10 Zustand — 工程手册

## 适用

本页 UI 偏好和少量客户端状态。服务端列表用 Query。不要 persist token。

## 版本

`zustand@5.0.16`。示例用 `createStore` + `useStore`，persist 来自 `zustand/middleware`。

## 迁移

带走 `examples/example.tsx` 的 store 工厂和 `examples/migration-policy.mjs`。存储适配器可以换成别的，但要保持 `skipHydration`、`partialize` 和 `version`。不要改成模块级单例除非你有测试隔离。

## 不可删的清理

卸载清空 Demo 的内存存储。rehydrate 在 store 换新之后再跑。`partialize` 只保留 `view` 和 `enabledByTenant`。迁移只接受已知 version。

## 反例

- `useStore(store)` 不带选择器。
- persist 整个 state。
- 改形状却不升 version。
- 用 store 复制 Query 结果。
- 把 session token 放进 partialize。
- 测试之间共享同一个 store。

## 测试断言

- 两个租户的布尔独立。
- v1 `{enabled, view}` 迁到按租户的 v2。
- 持久化 JSON 里没有函数和 token。
- 卸载后内存存储为空。

## 真实限制

没有 localStorage，没有跨标签同步。迁移失败策略在生产里不能是默默清空。

## 证据

没有收据不要写 PASS。
