# B14 Pragmatic drag and drop

## 适用

要用浏览器原生拖放、自己拥有样式，并且可以另行提供键盘路径时使用 1.8.1 适配器。它不附带键盘拖拽、权限或服务端合并。需要现成列表键盘模型时评估 B13 或 B22，不要两套同时绑同一节点。

## 版本

`@atlaskit/pragmatic-drag-and-drop@1.8.1`，React 19.3.0。许可证 **Apache-2.0**。导入保持 `/element/adapter` 和 `/combine`。不要按 4.x 的 `adapter/element-adapter` 修改这份示例。

## 迁移

从 1.8.1 升到 4.x 必须同时改锁文件和全部导入。从 beautiful-dnd 迁来时重做占位、预览和键盘，Pragmatic 没有 `provided.placeholder`。

## 不可删的清理

effect 返回 combine 的清理函数；monitor effect 调用 `detach` 并清空会话。scope 来自 `useId`。锁定行不注册。revision 在提交、撤销、重置时增加。drop 必须类型为 target 且会话仍匹配。上下按钮与拖放共用 `canReorderAroundPinned`。

## 反例

模块顶层注册 monitor。把 4.x 路径写进 1.8.1 源码。不看 scope 导致串列表。把 source id 当成落点。锁定行仍 draggable。忽略 revision。把手柄的 `touch-action: none` 放到整页。写成 MIT。

复用时保留这些不变的约定：

- 许可证是 Apache-2.0。
- 导入保持 `/element/adapter` 与 `/combine`，不改成 4.x 路径。
- monitor 与 draggable 都在 effect 里注册并清理。
- scope 用 `useId`；锁定行不注册。
- 键盘路径是上下按钮，库不提供键盘拖拽。

## 测试断言

`drag-session.test.mts` 与 `pinned-order.test.mjs` 断言会话的 id、revision、level，以及锁定区间不能reorder。不证明元素适配器已在浏览器里 attach。

## 真实限制

已挂载：单列、手柄、scope 隔离、锁定、撤销、basic 前三项。未挂载：多列、外部文件、HTTP 修订号、虚拟滚动、4.x 导出。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://atlassian.design/components/pragmatic-drag-and-drop/core-package
