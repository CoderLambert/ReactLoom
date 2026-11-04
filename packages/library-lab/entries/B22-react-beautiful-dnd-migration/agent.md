# B22 react-beautiful-dnd 迁移

## 适用

已有 `DragDropContext` / `Droppable` / `Draggable` 列表、需要在 React 19 上继续跑时，使用 `@hello-pangea/dnd`。不要新装归档的 `react-beautiful-dnd`。自由画布和多类型拖放评估 B14 或 B13。原库与 fork 都是 Apache-2.0。

## 版本

`@hello-pangea/dnd@18.0.1`，React 19.3.0。许可证 **Apache-2.0**。旧 13.1.1 的 peer 不到 React 19。不要 `--legacy-peer-deps` 把旧包装进来。不要调用已从 fork 18 文档移除的 `resetServerContext` 来推断 SSR。

## 迁移

先改导入，再核对 placeholder、`draggableProps.style`、稳定 `draggableId`、context 不嵌套。index 写入必须经 `isFreshDrop`。键盘路径与拖放走同一个 reducer。跨列和 HTTP 修订不是当前文件已实现的部分。

## 不可删的清理

`DragDropContext` 随 level 重挂。layout effect 清掉进行中的快照。没有 destination 不写顺序。固定项 `isDragDisabled` 且 `canReorderAroundPinned` 再拒绝。手柄独占 `dragHandleProps`。撤销和重置让 revision 增加，使旧 drop 失效。basic 的隐藏项留在数组后面。

## 反例

安装 `react-beautiful-dnd`。`draggableId={String(index)}`。原地 splice。取消也保存。丢掉 placeholder 或 style。整行都是手柄。用开始拖动时的 index 覆盖撤销后的数组。把本地 revision 说成已测的 If-Match。写成 MIT。

复用时保留这些不变的约定：

- 只导入 `@hello-pangea/dnd`；许可证 Apache-2.0。
- 不安装 `react-beautiful-dnd`，不用 legacy peer 标志强装。
- 保留 placeholder 和 `draggableProps.style`。
- `isFreshDrop` 失败时只提示，不按旧 index 写数组。
- 三列 HTTP 看板未挂载；本地 revision 不是已测的 ETag。

## 测试断言

`order-history.test.mts` 与 `pinned-order.test.mjs` 断言固定槽不可跨越、过期快照被拒绝、撤销和重置增加 revision。不证明键盘传感器、占位高度或触控。

## 真实限制

已挂载：单列、手柄、固定项、上下按钮、过期 drop、一步撤销。未挂载：三列看板、IME 新建、HTTP 409、虚拟列表、SSR。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://github.com/hello-pangea/dnd
