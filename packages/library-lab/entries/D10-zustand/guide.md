# Zustand 5.0.16｜选择器、部分持久化和迁移

Lab 锁定 `zustand@5.0.16`。它放本页的 UI 状态。服务端列表仍归 Query。不要把 token 放进 persist。

没有逐库收据时不要写 PASS。Actions [41779873259](https://github.com/CoderLambert/ReactLoom/actions/runs/41779873259) 不是本条目证明。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 使用 `createStore`、`useStore` 和 `persist`。[`examples/migration-policy.mjs`](examples/migration-policy.mjs) 把 v1 存档迁到 v2。存储是 Demo 私有的 `Map`，不是 `localStorage`。

已挂载：

- basic：vanilla store 加 React 选择器。组件只订阅 `tenant`、`view` 或当前租户的布尔值，不订阅整个 state。
- business：按租户切换启用状态。`toggle` 只改 `enabledByTenant[tenant]`，保留另一个租户的值。
- advanced：`persist`，`version: 2`，`skipHydration: true`。挂载后显式 `rehydrate()`。`partialize` 只写 `view` 和 `enabledByTenant`，不写函数，也不写当前 `tenant` 以外你没列入的字段。
- 重新加载可以种入 v1 形状 `{ enabled, view }`，`migrate` 把它收成按租户的表。卸载时 `memory.clear()`，避免这个 Map 活过 Demo。

没有挂载：`localStorage`、跨标签 `storage` 事件、devtools 中间件、把 Query 数据镜像进 store。

## 1. 模型

```text
createStore → useStore(store, selector) → 只有选中字段变化才渲染
persist → partialize → JSON → migrate(version)
```

`skipHydration` 让你控制何时读存储。不等待 rehydrate 就渲染，会先闪默认值。Lab 在 effect 里 rehydrate。

## 2. 反例

### 反例 1：订阅整个 store

```tsx
const state = useStore(store)
```

任意字段变化都重渲染。按字段选择。

### 反例 2：persist 整个 state

函数和临时草稿会进 JSON，或者在恢复时变成普通对象。`partialize` 只留可序列化的偏好。

### 反例 3：不写 version 就改形状

旧用户的 `{ enabled: false }` 会直接进新组件。Lab 的 `migrateChannelPreferences` 认出 version 1。迁移失败不要静默当成空对象并覆盖用户数据；本示例的内存存储可以清，生产存储不行。

### 反例 4：用 Zustand 存服务端列表

列表会和 Query 各算各的。频道开关若来自服务器，用 mutation。这里的布尔是本页偏好。

### 反例 5：模块级单例被测试污染

Lab 每次 `createChannelStore(storage)`。不要在模块顶层 `create()` 再在测试间共享。切换「重新 hydrate」时换新 store，并重新 rehydrate。

### 反例 6：把密钥放进 persist

`partialize` 没有 token 字段。不要为了方便加上 `session`。

## 3. 组合

**Query**：服务器数据走 Query。Zustand 只留 view 和本页开关。不要在 selector 里读 Query 缓存。

**URL**：若视图要可分享，来源应是 URL，store 只是派生。Lab 没有把 `view` 同步到地址栏。

## 4. 练习

1. 在 team-a 关闭、team-b 打开，再切回 team-a，两个值都还在。
2. 种入 v1 `{ enabled: false, view: 'grid' }`，rehydrate 后 v2 形状正确，且没有把函数写进 Map。
3. 卸载 Demo 后内存存储被清空。

## 5. 证据

迁移策略单测不是 `createStore` 的运行证明。sdk PASS 需要真实 import zustand 的收据。

## 6. 资料

- https://zustand.docs.pmnd.rs/getting-started/introduction
- https://zustand.docs.pmnd.rs/integrations/persisting-store-data
- https://www.npmjs.com/package/zustand
