# B13 dnd-kit：遗留 sortable API 与稳定身份

dnd-kit 感知拖动、碰撞和键盘传感器。它不签发业务 id，不解决权限、冲突合并或操作系统文件拖入。Library Lab **这一条挂载的是遗留稳定接口**：`@dnd-kit/core@6.3.1` 与 `@dnd-kit/sortable@10.0.0`，宿主 React 19.3.0。许可证 MIT。`library.json` 写明不要和 `@dnd-kit/react` 混写。

新适配层（`DragDropProvider`、另一套 `useSortable`、`@dnd-kit/helpers` 的 `move`）是不同的包和教程。原研究稿曾建议新项目优先评估 `@dnd-kit/react@0.5.0`。那是选型建议，**不是本条目已安装的 API**。把新教程贴进 `examples/example.tsx` 会和现有 `DndContext` / `SortableContext` 冲突。维护旧列表时留在这条遗留线上，并固定版本。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。规则在 `examples/pinned-order.ts`。没有多列看板、没有 Mock HTTP、没有 `If-Match`。

已挂载：

- `DndContext`：`PointerSensor` 需要移动 6px 才激活，`KeyboardSensor` 使用 `sortableKeyboardCoordinates`，碰撞是 `closestCenter`。
- `SortableContext` 的 items 是可见 id 列表，策略 `verticalListSortingStrategy`。
- `useSortable`：`disabled` 当 `item.locked`。拖动手柄是独立按钮，`setActivatorNodeRef`，`listeners` 和 `attributes` 只放在手柄上。`touch-action: none` 只在手柄。
- 变换写成 `translate3d` 加 scale，用的是 sortable 给出的 transform，不另起一套 Motion。
- `reorderVisible` 只重排可见前缀，隐藏项保持在后面。重复 id 或经过锁定项时返回 null，数组不变。
- `DragSession` 记下 activeId、数据 revision 和 level。键盘移动、撤销、恢复会增加 revision，使进行中的 drop 失效。`onDragEnd` 只有 `isCurrentDragSession` 为真才写入。`onDragCancel` 清会话。切换 level 也清会话。
- 每行有上移/下移，禁用条件与 `canReorderAroundPinned` 相同：锁定项以及路径上的锁定项都不能跨。
- `basic` 只显示前三项。`advanced` 里「国际资讯」带锁，并提供撤销和恢复。撤销同样作废拖动会话。

未挂载：跨列 `useDroppable`、空列、操作系统文件、`@dnd-kit/react` 的 DragDropProvider、虚拟化万行、服务端 409。外部文件要用浏览器 `DataTransfer`，不是这个 sortable 示例。

## 什么时候使用

| 场景 | 选择 |
| --- | --- |
| 维护已有 `DndContext` 列表，并与 Lab 对齐 | 本条目的 core 6.3.1 + sortable 10 |
| 新代码愿意跟 0.x 适配层及其迁移指南 | 单独评估 `@dnd-kit/react`，不要改这一份示例来演示 |
| 只要 DOM 拖动、框架无关、键盘自己做 | B14 |
| 要保持 `DragDropContext` / `Draggable` 形状 | B22 的 fork，不是 dnd-kit |
| 树 | 专用树库，不要把父子约束压成一个 index |
| 操作系统文件 | 原生拖放或 dropzone |

## 模型

```text
指针或键盘传感器
  → onDragStart 记录 {activeId, revision, level}
  → onDragEnd：会话仍匹配才 reorderVisible
  → React state 换成新数组（不可变）
  → output 显示 id 顺序
```

库给出位置，锁定规则在 `pinned-order.ts`。`canReorderAroundPinned` 要求下标是整数、在范围内、且源和目标之间（含端点）没有 `locked` 或 `fixed`。

basic 的可见长度是 3。把第三项拖到隐藏项上不会发生，因为那些 id 不在 `SortableContext` 里。`reorderVisible` 仍把隐藏后缀接回去，避免 basic 的重排丢掉后面的频道。

## 三层渐进

### Demo ① 三个频道（已挂载）

技术快讯、AI、开源。拖动手柄或按钮。output 用箭头连接 id。距离小于 6px 的点击不应开拖，避免和按钮冲突——这是传感器约束，仍要在浏览器里确认。

### Demo ② 六条优先级（已挂载）

完整列表，其中一条已锁定。拖过锁定项会被拒绝，status 说明固定频道或过期目标。顺序字符串是验收面，不依赖像素。

### Demo ③ 撤销（已挂载）

撤销恢复上一次提交前的数组，并增加 revision。恢复默认同样走 `commit`。若拖到一半时按撤销，随后的 drop 必须被忽略。这是 `isCurrentDragSession` 的用途。

未挂载的生产教学：乐观顺序提交 `If-Match`，409 用服务端数组覆盖，503 回滚。拖动期间不要改过滤条件，否则 index 会指向别的行。保存应使用 id 和锚点，而不是显示下标。

## 反例

```tsx
// 错：新包 API 和遗留包写在一起
import {DragDropProvider} from '@dnd-kit/react';
import {DndContext} from '@dnd-kit/core';

// 对：本文件只从 core 和 sortable 导入
```

```tsx
// 错：key 和 sortable id 用 index
<SortableContext items={items.map((_, index) => String(index))} />

// 对：items={visible.map(item => item.id)}，且 id 唯一
```

```tsx
// 错：整行都是监听器，点「上移」也开始拖
<li {...listeners} />

// 对：listeners 只在手柄按钮；上移调用 reorder
```

```tsx
// 错：onDragEnd 不看会话，撤销后的旧 drop 覆盖新顺序
onDragEnd={event => reorder(event.active.id, event.over?.id)}

// 对：isCurrentDragSession(session, activeId, revision, level)
```

```tsx
// 错：原地 splice
items.splice(from, 1);

// 对：reorderVisible 返回新数组或 null
```

```tsx
// 错：锁定只写 disabled，键盘按钮仍能跨过锁
move(lockedId, 1);

// 对：canReorderAroundPinned 对拖放和按钮同一套
```

```tsx
// 错：用 dnd-kit 读用户从桌面拖进的文件
// 对：那是 DataTransfer.files，本示例的 data 里没有文件
```

不要在拖动中每帧 `setState` 业务字段。sortable 的 transform 留在样式里。若再加 Motion，不要和 `translate3d` 写在同一个节点上。

## 组合

**dnd-kit + Query**：松手后 mutation 提交 id 顺序。进行中的拖动不要被 refetch 换成新数组，除非先作废会话（增加 revision）。409 时用响应替换 state。

**dnd-kit + 虚拟列表**：只注册可见 DOM，但 id 必须稳定，滚动时 source 不能变成另一个实体。本示例没有虚拟化，不要宣称万行 60fps。

**键盘**：库提供传感器，Lab 仍保留上移/下移，因为锁定规则和读屏需要一条不依赖拖动的路径。两条路径都必须走 `reorderVisible`。

## 生产清单

- id 永久、唯一、不用下标。
- 手柄与操作按钮分离，手柄 `touch-action: none`。
- 锁定在数据层。
- drop 与数据 revision、level 绑定。
- 取消拖动不写顺序。
- 状态区域 `aria-live` 报结果。Lab 用 `role="status"` 和 `<output>`。
- 大列表先定虚拟化方案再谈拖动。
- 触控延迟和滚动冲突在真机看。6px 约束是指针，不是触摸延迟的全部故事。

## 升级

遗留 6.3.1 / sortable 10 与 `@dnd-kit/react` 0.x 没有机械替换表。若产品决定迁移，新开模块对照官方迁移指南，保留 id、锁定和撤销测试，再删旧导入。不要在同一个 PR 里半套混用。0.5.0 仍在 1.0 之前，API 不能假设长期不变。

## 验收

basic：三项顺序改变反映在 output；隐藏的后三项 id 还在 state 里（界面上看不到）。business：不能把项拖过「国际资讯」。advanced：撤销回到上一次；拖动过程中按恢复默认，松手不会把旧顺序写回去。上移到顶、下移到底按钮禁用。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成 dnd-kit PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B13 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B13-dnd-kit/tests/reorder-policy.test.mts packages/library-lab/entries/B13-dnd-kit/tests/drag-session.test.mts packages/library-lab/entries/B13-dnd-kit/tests/pinned-order.test.mjs
```

断言锁定区间、可见前缀重排、过期会话被拒绝。不证明指针坐标或键盘传感器。

## 官方资料

- https://docs.dndkit.com/
- https://dndkit.com/react/guides/migration/
- https://github.com/clauderic/dnd-kit
- https://www.npmjs.com/package/@dnd-kit/core
- https://www.npmjs.com/package/@dnd-kit/sortable
