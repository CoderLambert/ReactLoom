# D11 Jotai — 工程手册

## 适用

细粒度客户端状态和派生值：计数、未读数、按 id 翻转的已读标记。每个会话一个 `Store`。

远程缓存用 Query。互斥流程用 XState。不要把原子当成授权源，也不要在默认 store 里放租户数据。

## 版本

`jotai@3.0.1`，MIT。使用核心导出：`atom`、`createStore`、`Provider`、`useAtom`、`useAtomValue`、`useSetAtom`。

停在 3.0.0 会带上已修复的 `useAtomValue` 挂载问题。v3 删除的工具函数不要从旧示例复制。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走模块级原子、`TenantWorkspace` 的 `createStore`，以及 [`examples/story-policy.mjs`](examples/story-policy.mjs)。`demo.tsx` 只重导出。

会话组件必须有稳定 key。退出团队 A 时递增 key，让旧 Provider 卸载。团队 B 使用另一个 key。

写原子只接受故事 id 字符串，不接受数组下标。

## 不可删的清理

离开 advanced 或更换 A 的 key 时，对应 Provider 卸载，store 不再被订阅。不要把卸下来的 store 存进模块变量再给下一个租户用。

`toggleStoryRead` 对坏数据抛错，对未知 id 返回原数组。调用方不要吞掉这个错误再写入半份列表。

原子不要移进函数组件体。

## 反例

- 每次渲染调用 `atom()`。
- 省略 Provider，读到默认 store。
- 用数组下标更新已读。
- 重复业务 id 被静默改成两行。
- 把派生值同步进 `useState`。
- 在写原子里把服务端列表当成唯一真相。
- async 原子丢掉 `signal`。
- `atomWithStorage` 保存令牌。
- 依赖 v3 已移除的 API。

## 测试断言

- 派生原子跟随源原子更新。
- 两个 store 对同一原子配置保持独立的值。
- 写原子在一个 store 里翻转故事，不影响兄弟 store；新建会话后旧值消失。
- 未知 id 不改快照。
- 重复或缺失 id 不会改两行，坏 payload 失败。
- `tests/sdk.test.mjs` 导入真实 `jotai`。无收据则 NOT_RUN。

## 真实限制

没有持久化，没有 Suspense，没有网络。未读数只反映当前 store 的两篇 fixture。UI 上的勾选禁用并不存在；合法性在策略函数里。

换会话不会自动清除 Query 或令牌。那是调用方的责任。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
