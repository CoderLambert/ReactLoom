# D12 Redux Toolkit — Agent 选型与迁移手册

推荐用于复杂跨组件共享客户端状态、事件可追踪和团队业务流程；不要替代查询缓存/后端权限。简单本地 store 可优先 D10 Zustand 或 D11 Jotai。

## 最小移植
从 `examples/example.tsx` 复用 `feedsSlice` 与 `createFeedStore`，不要机械复制教学按钮。必须对团队/账户边界确定唯一 store owner，reducer 更新一律通过 typed action，不能在外部直接 mutate state。请求身份 `startRequest/finishRequest` 的陈旧响应保护应结合真实 AbortSignal；本 Demo 的计时器是本地 fixture，不是真 HTTP。

## 依赖与 React 接线
包 `@reduxjs/toolkit@2.13.0`，本 Demo 用 `useSyncExternalStore` 展示不依赖 react-redux 的模式。正式大型项目可选官方 `react-redux`，需额外核实版本和订阅策略。远端缓存选 D13 RTK Query 或 D07 TanStack Query，不重复维护第二份 cache。

## 验收
`node --test entries/D12-redux-toolkit/tests/sdk.test.mjs` 运行真实 SDK，断言 immutable snapshots、租户隔离、requestId 边界；TypeScript/production build、浏览器切换/卸载单独标记。当前 NOT_RUN，不允许引用之前的历史脚本宣称 PASS。

官方 https://redux-toolkit.js.org/ 。
