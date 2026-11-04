# D12 Redux Toolkit — 工程手册

## 适用

需要可追踪动作的客户端状态：计数、按 id 维护的列表、用请求 id 挡住过期回写。reducer 使用 slice 里的 Immer draft。

一个开关不必上 Redux。服务端缓存优先 Query；若缓存也要进 Redux，用 RTK Query，而不是把响应数组拷进 slice。

## 版本

`@reduxjs/toolkit@2.13.0`，MIT。`configureStore` 默认中间件保留。示例关闭 DevTools。

不要在 reducer 里再导入 `produce`。不要把 1.x 教程里关闭序列化检查的写法抄进来。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走 `feedsSlice` 和 `createFeedStore`。订阅层可以换成 `react-redux`，但请求 id 的判断留在 `finishRequest`。

两个团队继续用两个 store，或改成一个 store 内的租户键。UI 下拉框不是隔离边界。

演示 timer 换成真实请求时，保留“不匹配的完成动作只增加 `ignored`”。

## 不可删的清理

`useEffect` 依赖当前 store：清理时清除全部 timeout，并 `dispatch(cancelRequest())`。再次进入 advanced 会重新绑定。

`demonstrateRace` 在开新一轮之前清掉上一轮 timer，避免多个旧 id 同时完成。

`addFeed` 遇到已有 id 直接返回。`toggleRead` 找不到 id 时不改别的行。

## 反例

- 在 `getState()` 的返回值上修改字段。
- reducer 内再 `produce`。
- 用数组下标当 payload。
- 完成动作不比较 `activeRequest`。
- 把 `AbortController` 放进 state。
- 一个 store 靠渲染过滤假装多租户。
- 用 slice 保存本该由 Query 失效的列表。
- 卸载后仍让 timeout `dispatch`。

## 测试断言

- 真实 slice 不修改动作之前的状态；两个 store 的计数隔离。
- 乱序完成时，只有匹配的请求 id 写入 `result`，另一个增加 `ignored`。
- 重复 feed id 不会插入第二行。
- `reset` 清空 `result` 和 `ignored`。
- `tests/sdk.test.mjs` 导入真实 `@reduxjs/toolkit`。无收据则 NOT_RUN。

## 真实限制

竞态是 `setTimeout`，没有 HTTP 状态码，也没有权限。`ignored` 只说明 reducer 拒绝了载荷，不说明服务器没处理写操作。

`useSyncExternalStore` 订阅整棵树。正式应用要改选择器。DevTools 关闭，所以浏览器扩展里看不到这些动作。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
