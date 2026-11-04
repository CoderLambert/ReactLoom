# D06 Immer — 工程手册

## 适用

嵌套纯数据的不可变更新，以及一次本地乐观编辑的正向 / 逆向 Patch。按业务 id 改字段，让未改分支保持原引用。

不要用它做 HTTP、权限、Query 失效或多人合并。Redux Toolkit reducer 里不要再包 `produce`。Patch 不是 CRDT。

## 版本

`immer@11.2.9`，MIT。具名导入。`enablePatches()` 在模块加载时调用一次，否则 `produceWithPatches` 不可用。

11.2.9 是 Lab 的钉，不是研究笔记里的 11.1.21。`enableArrayMethods()` 仍是可选插件，本示例没有打开。

## 迁移

从 [`examples/example.tsx`](examples/example.tsx) 带走 `toggleStory`、乐观 `produceWithPatches`，以及 [`examples/patch-ownership.mjs`](examples/patch-ownership.mjs) 的 `takeUndo`。`demo.tsx` 只重导出。

初始状态用 `structuredClone`，避免测试或重置改到模块级种子。故事身份是 `id` 字符串。

确认按钮只清本地 inverse。接到真服务器时，成功响应要带版本，失败才应用当时取走的那一份 inverse。

## 不可删的清理

回滚必须先 `takeUndo(ref)`，再把返回的数组放进 `setState` 的 updater。禁止在 updater 里读 `ref.current`。

乐观进行中，ref 非空。此时不要再产生第二份 inverse，示例用锁定做到这一点。若产品允许并发编辑，每份 inverse 要绑定 revision 或 token，不能覆盖更新的结果。

recipe 保持同步。不要把 draft 传出 `produce`。

## 反例

- `draft = { ...draft }` 重新绑定参数。
- 同时修改 draft 和 `return` 新对象。
- `return undefined` 想清空状态。
- `async` recipe 或 `setTimeout` 里改 draft。
- `applyPatches(current, undo.current ?? [])` 延迟读 ref。
- 用数组下标或对象引用当故事身份。
- 未 `enablePatches()` 就 `produceWithPatches`。
- 把未校验的远端 Patch 应用到最新缓存。
- 在 Array Methods 回调里修改元素。

## 测试断言

- 真实 `produce` 翻转嵌套 `read` 且不修改入参。
- 未修改的故事引用可以与原树共享。
- 一份 inverse 能撤销对应的那一次插入。
- `takeUndo` 之后 ref 为空；推迟的 updater 仍使用已取走的数组。
- 第二次回滚不会偷走另一次乐观变更。
- `tests/sdk.test.mjs` 导入真实 `immer`。无收据则 NOT_RUN。

## 真实限制

没有网络，没有服务器 revision，没有 Map/Set 插件，没有自动冻结开关。锁定是整份 feed，不是按故事。界面上看不见引用共享，必须用断言看 `===`。

Patch JSON 只用于教学展示。它不是审计日志格式。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配收据。Actions 41779873259 不是本条目 PASS。不要改 `verification.json`。
