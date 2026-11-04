# D10 Zustand — 工程手册

## 适用

跨组件的界面偏好：当前视图、按团队分开的开关。store 用 vanilla `createStore`，React 用字段选择器。

远程列表、令牌、权限和流程状态机不要持久化在这里。单组件开关不必建 store。

## 版本

`zustand@5.0.16`，MIT。持久化中间件版本号是 2。`skipHydration: true`，挂载后再 `rehydrate`。

v5 对返回新对象的选择器更严格。升级前先看 5.0.16 的 `getServerSnapshot` 说明，不要只看文档站上的旧版本号。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走 `createChannelStore`、`makeMemoryStorage` 和 [`examples/migration-policy.mjs`](examples/migration-policy.mjs)。`demo.tsx` 只重导出。

生产若改用 `localStorage`，键名保持 `reactloom:lab:zustand:channels:v2` 这一级别的显式名字，并仍走 `partialize` 和 `migrate`。不要把内存 Map 的 `clear()` 换成清空全部站点存储。

`tenant` 继续不持久化。刷新后回到默认团队是当前合同。

## 不可删的清理

卸载 effect 调用 `memory.clear()`，只清这个演示的 Map。

`reload` 创建新 store 并等待 `rehydrate`，避免旧订阅写到已换掉的实例。

`migrateChannelPreferences` 对非 v1、非对象和数组返回默认值，并且不修改入参。

`toggle` 必须拷贝 `enabledByTenant`，保留另一个团队的布尔值。

## 反例

- 选择器每次返回新对象。
- `set` 时用新对象替换整个 `enabledByTenant`。
- `partialize: state => state`。
- `migrate` 原样返回不可信 JSON。
- 把字符串 `"false"` 当成布尔。
- 把 feed 正文或 AbortController 放进 persist。
- SSR 共用模块级 store。
- 用 Zustand 保存 Query 的服务端数据。

## 测试断言

- 两个独立 store 的团队状态互不影响。
- persist 只序列化白名单，再 hydrate 回来。
- v1 迁移只接受真正的布尔 `enabled`，view 只接受 `grid` 或落到 `list`。
- 字符串布尔被拒绝，team-b 保持默认 false。
- 未知版本和坏形状得到默认状态。
- 迁移不修改输入对象。
- `tests/sdk.test.mjs` 导入真实 `zustand`。无收据则 NOT_RUN。

## 真实限制

存储是内存 Map，刷新页面不会留下数据；“模拟刷新”只在同一次挂载里换 store。没有网络，没有 `useShallow` 示例，没有文章请求代际。

当前团队不在磁盘合同里。若产品要记住团队，必须单独评审，不能顺手放进 partialize。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
