# B14 Pragmatic drag and drop：元素适配器与事件作用域

`@atlaskit/pragmatic-drag-and-drop` 是一层浏览器拖放适配器：`draggable`、`dropTargetForElements`、`monitorForElements`。它不是带键盘排序的成品列表，也不是逐帧手势引擎。**许可证 Apache-2.0，不是 MIT。** Library Lab 固定 `1.8.1`，宿主 React 19.3.0。

原研究稿按后来的 4.x 讨论了导入路径迁移（`adapter/element-adapter`，并弃用旧的再导出）。**那不是这一份锁文件。** 当前示例的导入是 1.8.1 上真实存在、并且源码正在使用的路径：

```ts
import {draggable, dropTargetForElements, monitorForElements}
  from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {combine} from '@atlaskit/pragmatic-drag-and-drop/combine';
```

不要为了贴 4.x 笔记去改这些导入，除非 `library.json`、锁文件和示例一起升级并重测。4.x 的破坏性变更不能倒写成 1.8.1 已经具备。

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。锁定规则在 `examples/pinned-order.ts`，与 B13 的纯函数同形，但拖放注册完全不同。

已挂载：

- 每个列表一个 `useId()` scope。`getInitialData` / `getData` 带上 `scope` 和类型：`reactloom-entry` 或 `reactloom-target`。
- `canDrop` 与 `canMonitor` 都要求 scope 和类型匹配，避免页面上另一个示例接收这次拖动。
- 非锁定行在 effect 里 `combine(draggable, dropTargetForElements)`。拖动手柄是 `dragHandle`。cleanup 是 combine 的返回函数。锁定行不注册。
- 手柄 `aria-hidden`，标题写明指针拖动、键盘请用上下按钮。官方无障碍说明：核心**不会**自动提供键盘拖拽。Lab 用上移/下移走同一套 `canReorderAroundPinned`。
- `monitorForElements` 在列表级 effect 里注册一次。`onDragStart` 记录会话；`onDrop` 读 `location.current.dropTargets[0]`，类型必须是 target，且 `isCurrentDragSession` 为真才 `reorder`。cleanup 清会话并 `detach()`。
- 数据 revision：提交、撤销、重置都会递增，使旧 drop 失效。basic 只重排前三项，隐藏项保留。
- advanced 提供撤销和重置。撤销用 ref 里的上一份数组，避免渲染延迟期间读到旧闭包。

未挂载：多列、外部文件、`utils/reorder`（1.8.1 示例自己 splice 出新数组）、服务端版本、自动滚动虚拟列表。触控和滚动冲突必须真机看，文档里的「支持移动端」不是本条目的浏览器 PASS。

## 什么时候使用

适合已经有 DOM 和样式、需要原生拖放、并且愿意自己做键盘和读屏。不适合：希望几行代码得到和 beautiful-dnd 一样的键盘拖动、或需要指针轨迹被弹簧逐帧接管。简单列表若已经在用 dnd-kit 的传感器，不必为了换库重写。跨列看板可以做，但 Lab 没有第二列。

SSR：注册必须在 `useEffect`，模块顶层不能碰 `document`。本示例是客户端。

## 模型

```text
pointerdown 在手柄上
  → draggable 发出带 scope 的 data
  → drop target 的 canDrop 过滤
  → monitor onDrop 取最内层 dropTargets[0]
  → 会话的 revision 仍等于当前数据才改数组
```

`location.current.dropTargets` 的顺序是嵌套投放区。Lab 每行只有一个目标，取第 0 个。若以后行内再套目标，要明确哪一层才是排序行。

拖动样式是 `data-state`，不是库替你写的预览层。没有 `provided.draggableProps.style` 这种必须展开的对象；那是 B22 的 API。

## 三层渐进

### Demo ① 前三项（已挂载）

AI、前端、开源。拖到另一行松手，output 改变。拖到列表外：monitor 看到的 target 类型不对就返回。上下按钮对前三项有效，不会把隐藏的国际资讯卷进这次 basic 重排。

### Demo ② 含锁定频道（已挂载）

国际资讯 `locked`，不注册 draggable，也不注册 drop target。从别的行拖到它上面没有目标。按钮在路径含锁时禁用。status 会说明顺序未改变。

### Demo ③ 作用域和撤销（已挂载）

两个实例会有不同的 `useId` scope，monitor 互不处理。撤销恢复上一份并作废会话。重置写回 `INITIAL`。拖动途中点撤销，随后的 drop 不得覆盖。

未挂载的生产教学：松手后 PUT 带预期修订号；409 拉回权威顺序；abort 不等于服务端没写入。过滤视图在拖动期间应冻结，否则 index 会漂。

## 反例

```tsx
// 错：按 4.x 笔记改 1.8.1 的源码导入
import {draggable} from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter';

// 对：与 example.tsx 一致
import {draggable} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
```

```tsx
// 错：模块顶层 monitor，SSR 和多列表互相丢事件，且没有 detach
monitorForElements({onDrop: () => setItems(...)});

// 对：useEffect 里按 scope 注册，return detach
```

```tsx
// 错：不看 drop target 类型，把拖动源自己的 data 当成落点
const to = source.data.id;

// 对：target.data.type === 'reactloom-target' 且 scope 相同
```

```tsx
// 错：键盘用户没有任何路径，文档却写「可拖拽排序」
// 对：上移/下移调用同一 reorder，手柄对读屏隐藏
```

```tsx
// 错：锁定行仍然 draggable，只是光标变成 not-allowed
// 对：locked 时 effect 直接 return，不注册
```

```tsx
// 错：onDrop 忽略 revision，撤销后的原生 drop 写回旧顺序
// 对：isCurrentDragSession(snapshot, id, revision, level)
```

```tsx
// 错：把 Apache-2.0 写成 MIT，或假定所有 Atlaskit 包同一许可证
// 对：核心 1.8.1 是 Apache-2.0；额外包逐个看
```

不要在拖动时卸载行组件却留下监听。effect 依赖 `item.id` 和 `locked`，id 变化会先清理再注册。

## 组合

**Pragmatic + React**：React 只渲染和在 effect 里注册。不要在渲染期间调用 `draggable()`。

**Pragmatic + Query**：monitor 的 onDrop 里调用 mutation，不要在 `onDrag` 每帧打网络。冲突时用服务端顺序替换，并递增 revision 丢掉迟到的 drop。

**Pragmatic + 无头按钮**：上下按钮是无障碍路径。若产品需要「空格提起、箭头移动、空格放下」，那是另一套交互，要自己设计公告，库不会附送。

**不要**和 dnd-kit 同时注册在同一 DOM 上。选一个事件主人。

## 生产清单

- scope 隔离每个列表实例。
- data 里只放 id 和类型，不放函数或 DOM 节点。
- cleanup 一定调用。
- 锁定不注册源和目标。
- 键盘替代与拖放共用纯函数。
- 手柄不抢按钮的点击（按钮在手柄之外）。
- `touch-action: none` 只在手柄，避免整页不能滚动。
- 真机看 iOS/Android 的滚动和拖动谁赢。
- 大列表的自动滚动和虚拟窗口会让 index 失效，应改用 id。

## 升级

留在 1.8.1 时保持 `/element/adapter` 与 `/combine`。若要上 4.x，先读那一版 CHANGELOG 的导出表，改 `library.json` 和全部导入，再跑会话测试和浏览器拖放。不要只改指南里的路径。

从 react-beautiful-dnd 迁到 Pragmatic 时，键盘、预览和占位高度都要重做。想少改组件树应看 B22 的 fork，而不是假装 Pragmatic 兼容 `provided.placeholder`。

## 验收

basic：拖动改变前三项 output，后两项 id 仍在数据末尾。business：锁不能被拖走，也不能被当作落点跨过。advanced：第二个列表的拖动不改变第一个（scope）；撤销后顺序恢复；拖动中重置使随后 drop 无效。只用键盘时，上下按钮仍能重排未锁定项。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成适配器 PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B14 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B14-pragmatic-drag-and-drop/tests/drag-session.test.mts packages/library-lab/entries/B14-pragmatic-drag-and-drop/tests/pinned-order.test.mjs
```

断言锁定区间和会话匹配。不证明原生 dragover 或触摸。

## 官方资料

- https://atlassian.design/components/pragmatic-drag-and-drop/core-package
- https://atlassian.design/components/pragmatic-drag-and-drop/core-package/drop-targets
- https://atlassian.design/components/pragmatic-drag-and-drop/core-package/monitors
- https://atlassian.design/components/pragmatic-drag-and-drop/accessibility
- https://www.npmjs.com/package/@atlaskit/pragmatic-drag-and-drop
- https://github.com/atlassian/pragmatic-drag-and-drop
