# Zustand 5.0.16｜vanilla store、选择器和受控 persist

Lab 锁定 `zustand@5.0.16`（MIT）。React 绑定用 `useStore`，无 React 的核心是 `zustand/vanilla` 的 `createStore`，持久化来自 `zustand/middleware`。v5 面向 React 18 及以上。它适合前端拥有的界面状态，不是请求缓存、权限或 CRDT。

没有匹配收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 是仓库级结果，不是本条目 PASS。

## Lab 当前示例

[`examples/demo.tsx`](examples/demo.tsx) 重导出 [`examples/example.tsx`](examples/example.tsx)。存储是 [`makeMemoryStorage`](examples/example.tsx) 里的 `Map`，实现 `StateStorage`。不写 `localStorage`，卸载时 `memory.clear()`。

`createChannelStore` 使用 `persist`，`name` 为 `reactloom:lab:zustand:channels:v2`，`version: 2`，`skipHydration: true`。挂载后 effect 调用 `store.persist.rehydrate()`。`partialize` 只留下 `view` 和 `enabledByTenant`。`tenant` 和动作函数不进 JSON。

选择器按字段订阅：`tenant`、`view`、当前租户的 `enabled`、整份 `enabledByTenant`。切换团队只改 `tenant`，两份启用标记仍在各自的键上。

advanced 把一份 v1 JSON 种进 Map：`{ state: { enabled: false, view: 'grid' }, version: 1 }`。`migrate` 指向 [`examples/migration-policy.mjs`](examples/migration-policy.mjs)。v1 的布尔 `enabled` 只写入 `team-a`，`team-b` 回到默认 `false`，`view` 只有 `'grid'` 会被保留，否则是 `'list'`。字符串 `"false"` 不是布尔，不能当成 `false`。未知版本或坏形状返回默认值。迁移不修改入参对象。

没有挂载：文章列表、`AbortController` 拉 feed、`subscribeWithSelector`、`useShallow`、SSR 每请求 store、Playwright。那些是生产教学。当前按钮只证明偏好 store 和内存持久化。

## 什么时候用

侧栏、密度、当前团队 id、跨组件的面板开关，用 Zustand。远程分页和乐观写回用 TanStack Query。复杂互斥流程用 XState。细粒度派生图可以比较 Jotai。单组件开关用 `useState`。令牌和权限不要放进可被脚本读取的存储。

v5.0.16 的发布说明包含 `getServerSnapshot` 与 DevTools 相关修复。网站上的次级版本文本可能滞后，以 GitHub tag 和 `library.json` 为准。

## 模型

`createStore(initializer)` 得到 `getState`、`setState`、`subscribe`。`set` 默认浅合并顶层。嵌套对象要自己拷贝，Lab 的 `toggle` 展开 `enabledByTenant` 再改当前键。`set(next, true)` 会替换整棵状态，动作会丢。

React 侧 `useStore(store, selector)` 用 `Object.is` 比较选择结果。`state => ({ view: state.view })` 每次都是新对象，会造成多余渲染。选择原始字段，或使用 `useShallow`。Lab 的四个选择器都返回稳定的原始值或同一状态里的对象引用（`enabledByTenant` 只在 toggle 时换新）。

`persist` 的 `partialize` 决定写入什么。`migrate(persisted, version)` 把旧版收成当前形状。`skipHydration` 避免在还没有存储实现时自动读。手动 `rehydrate` 适合测试和自定义 storage。

模块级单例不能跨 SSR 请求共享。Lab 每次 `reload` 都 `createChannelStore`，所以两个演示不会偷用对方未重置的闭包。生产按请求建 store。

`subscribe` 的返回值要在不再需要时调用。Lab 的 React 订阅由 `useStore` 管理；若再加 `subscribeWithSelector` 驱动标题，卸载时取消。

## 三层示例

### 基本

按钮翻转当前团队（默认 team-a）的启用标记。JSON 里看得到两个团队。选择器没有订阅整个 store。

### 业务

切换团队后再翻转，只改变该团队的布尔值。视图在 `list` 与 `grid` 之间切换，并会进入持久化白名单。刷新按钮新建 store 并 `rehydrate`，身份字段 `tenant` 回到初始 `'team-a'`，因为 partialize 没保存它。这是故意的：当前团队是会话，不是偏好。

### 进阶

导入 v1 后，`enabled: false` 只影响 team-a，视图变成 `grid`。展开存储可以看到 JSON 里没有函数、没有 `tenant`。坏数据应落到默认列表和默认启用表，而不是抛到渲染之外。

## 反例

### 反例 1：选择器返回新对象

```tsx
const snapshot = useStore(store, state => ({ view: state.view, enabled: state.enabledByTenant[state.tenant] }))
```

```tsx
const view = useStore(store, state => state.view)
const enabled = useStore(store, state => state.enabledByTenant[state.tenant])
```

### 反例 2：浅合并嵌套字段

```tsx
set({ enabledByTenant: { [state.tenant]: !state.enabledByTenant[state.tenant] } })
```

另一个团队的键会丢。

```tsx
set(state => ({ enabledByTenant: { ...state.enabledByTenant, [state.tenant]: !state.enabledByTenant[state.tenant] } }))
```

### 反例 3：partialize 把身份和函数写进去

```tsx
partialize: state => state
```

JSON 存不下函数，也会把 `tenant` 固定成上次的人。Lab 只写 `view` 和 `enabledByTenant`。

### 反例 4：迁移信任任意 JSON

```tsx
migrate: value => value
```

```tsx
migrate: (value, version) => migrateChannelPreferences(value, version)
```

非对象、数组、未知 version、字符串布尔都走默认。不要 `Boolean("false")`。

### 反例 5：把服务端列表放进 persist

文章正文、令牌、`AbortController` 不属于这个存储。feed 若要演示，用另一个不持久化的 store，并在卸载时 abort。Lab 没有那第二个 store。

### 反例 6：SSR 共用一个 store

用户 A 的 `setTenant` 会出现在用户 B 的渲染里。每个请求 `createStore`，水合完成前不要读窗口存储。

### 反例 7：用 Zustand 重做 Query

`staleTime`、去重和失效不是 `set` 能表达的协议。搜索词可以是 UI 状态，列表数据留在 Query。

## 组合

**Query**：Zustand 保存团队选择和视图。列表键使用这个团队 id。不要把 `feeds` 再复制进 persist。

**Immer**：要么 `zustand/middleware/immer`，要么在 `set` 里调用 `produce`，不要两层都包。

**XState**：审批流程的互斥状态不要拆成多个可同时为真的布尔。偏好开关留在 Zustand。

## 生产核对清单

1. `partialize` 白名单经过审查，没有令牌和正文。
2. `version` 与 `migrate` 对坏 JSON 返回默认值，且不修改入参。
3. 字符串布尔不会变成布尔。
4. 选择器不在每次渲染制造新对象，除非用了 `useShallow`。
5. 嵌套 `set` 保留未提到的键。
6. 自定义 storage 在卸载或登出时删掉本应用的键，不调用清空整个 `localStorage` 的 API。
7. SSR 不使用模块级 store。
8. 水合只发生一次；Strict Mode 下 `rehydrate` 的 Promise 要能重入。

## 升级

钉 `5.0.16`。从 v4 迁到 v5 时看官方迁移：选择器的无限渲染更严格，`useStore` 与 `createStore` 的入口要核对。自定义相等函数需要匹配 `use-sync-external-store` 的 peer。

持久化版本从 1 升到 2 时保留 `migrate`。不要直接改已写出的 JSON 字段名而不提供版本。

## 验收

- 两个团队的 `enabled` 互不影响。
- 重新 hydrate 后 `view` 和启用表还在，`tenant` 回到默认。
- 存储 JSON 不含函数和 `tenant`。
- v1 `{ enabled: false, view: 'grid' }` 只把 team-a 设为 false，view 为 grid。
- `"false"` 不会被当成布尔 false。
- 未知 version 得到默认列表和默认启用表。
- `tests/sdk.test.mjs` 使用真实 `createStore` 和 `persist`。无收据则 NOT_RUN。

练习：加一个只订阅 `view` 的组件，确认 toggle 启用状态时它不重渲染。再把 v1 迁移接到真实 `localStorage` 键上，并在登出时只 `removeItem` 该键。

## 资料

- https://zustand.docs.pmnd.rs/
- https://zustand.docs.pmnd.rs/reference/apis/create-store
- https://zustand.docs.pmnd.rs/reference/hooks/use-store
- https://zustand.site/en/docs/persist/
- https://zustand.docs.pmnd.rs/reference/migrations/migrating-to-v5
- https://github.com/pmndrs/zustand/releases/tag/v5.0.16
- https://github.com/pmndrs/zustand
