# D13 RTK Query — 工程手册

## 适用

已经有 Redux store，希望端点缓存、标签失效和 hook 订阅放在同一套中间件里。参数必须包含租户和搜索。

没有 Redux 时用 TanStack Query。不要把 RTK Query 当成鉴权或上传协议。不要和 Query 同时拥有同一资源。

## 版本

`@reduxjs/toolkit@2.13.0` 与 `react-redux@9.3.0`，MIT。API 从 `@reduxjs/toolkit/query/react` 导入。

`reducerPath` 使用 `rlCD13RtkApi`。升级 Toolkit 时保持“有结果才失效”的写法，不要换成旧教程里无条件 `invalidatesTags`。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走 `createDemoRuntime`、`currentData`、epoch 和 IME 判断。生产可以换 `fetchBaseQuery`，但保留 signal、标签 id 和 409 不失效。

`Provider` 包住使用 hooks 的面板。`createApi` 只创建一次。

卸载和高级按钮的 `resetApiState` 只作用于这个 runtime 的 store。

## 不可删的清理

面板卸载时递增 `requestEpoch` 并 `abort()` 进行中的 mutation。示例卸载时 `resetApiState()`。

新的切换先 abort 上一次触发器。`unwrap` 前后都看 epoch，`finally` 只有当前 epoch 才清空 in-flight 引用。

搜索在组合态和 `keyCode === 229` 时不把 draft 推进 `search`。

## 反例

- store 没有 `api.middleware`。
- 渲染 `data` 导致上一租户闪现。
- 409 仍 `invalidatesTags`。
- 标签不带租户 id。
- `baseQuery` 不读 `signal`。
- 每次渲染 `createApi`。
- `onChange` 直接改查询参数。
- 在全应用 store 上随意 `resetApiState`。
- 再把结果复制进另一个 slice。
- 把参数里的 tenant 当成已经鉴权。

## 测试断言

- 真实端点为不同租户保存不同缓存条目。
- 成功 mutation 只使该租户标签失效；409 不失效。
- `currentData` 不渲染上一组参数的行。
- `conflict` 行的 `paused` 在 409 后保持原值。
- 过期 epoch 不写提示。
- `tests/sdk.test.mjs` 导入真实 RTK Query。无收据则 NOT_RUN。

## 真实限制

baseQuery 是内存 fixture。延迟 700ms 不是网络。409 正文是字符串 `stale-revision`，没有 ETag。没有轮询和乐观补丁。

IME 的 229 判断要在真实输入法下再看一次。fixture 允许任意租户参数，服务端必须拒绝。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
