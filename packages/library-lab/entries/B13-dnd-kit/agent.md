# B13 dnd-kit

## 适用

维护 React 列表排序，并且要指针距离约束、键盘传感器和自定义锁定时，使用本条目的遗留 `@dnd-kit/core` + `@dnd-kit/sortable`。操作系统文件、树和无框架 DOM 拖放另选。新包 `@dnd-kit/react` 不要写进这个示例。

## 版本

`@dnd-kit/core@6.3.1`，`@dnd-kit/sortable@10.0.0`，React 19.3.0。许可证 MIT。API 是 `DndContext`、`SortableContext`、`useSortable`。不是 `DragDropProvider`。

## 迁移

从手写 HTML5 拖放迁入时保留业务 id。若将来改 `@dnd-kit/react`，单独开模块并重写传感器注册，不能半文件混用。B22 的 `Draggable` 形状也不是这个包。

## 不可删的清理

手柄独占 listeners。`touch-action: none` 不放到整行。`DragSession` 绑定 revision 和 level。撤销、重置、键盘移动和切换 level 都作废进行中的 drop。锁定用 `canReorderAroundPinned`，拖放和按钮共用。`reorderVisible` 保留不可见后缀。

## 反例

index 当 id。整行展开 listeners。忽略会话把旧 drop 写回。原地 splice。只禁用手柄却让上移跨过锁。导入 `@dnd-kit/react`。用本库读取桌面文件。和 Motion 共写一个 transform。

复用时保留这些不变的约定：

- 只使用 `@dnd-kit/core` 6.3.1 与 `@dnd-kit/sortable` 10。
- 不导入 `@dnd-kit/react` 的 DragDropProvider。
- listeners 只在手柄；锁定规则拖放和按钮共用。
- drop 必须通过 revision 与 level 组成的会话检查。
- 操作系统文件拖入不是这个示例的能力。

## 测试断言

`reorder-policy.test.mts`、`drag-session.test.mts`、`pinned-order.test.mjs` 断言锁定区间、唯一 id、可见前缀、会话的 id/revision/level。不证明碰撞检测或键盘传感器。

## 真实限制

已挂载：单列、6px 指针约束、键盘坐标传感器、锁定、撤销、basic 只显示前三项。未挂载：多列、空列、HTTP 409、虚拟列表、新 React 适配层。

复用检查：

- 版本以该条目 `library.json` 为准，不跟研究稿里的 Vite 脚本或 workshop 目录。
- 未挂载的生产模式留在 `guide.md`，不补进 `examples/`。
- 不修改 `verification.json`。没有匹配 receipt 时 sdk、build、browser 保持 NOT_RUN。

## 证据

sdk、build、browser 为 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有匹配 receipt。Actions run `41779873259` 是仓库级检查，不是本条目 PASS。文档：https://docs.dndkit.com/
