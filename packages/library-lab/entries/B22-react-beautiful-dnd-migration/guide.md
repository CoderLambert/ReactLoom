# B22 从 react-beautiful-dnd 迁到 @hello-pangea/dnd

`react-beautiful-dnd` 是 Atlassian 的列表拖拽：`DragDropContext`、`Droppable`、`Draggable`，外加键盘和占位高度。它面向列表，不是自由画布、地图或操作系统文件。项目已弃用，GitHub 仓库随后归档为只读。最后的 npm 版本 `13.1.1` 的 peer 是 React 16.8、17 或 18，**没有 React 19**。原库与 fork 都是 **Apache-2.0，不是 MIT**。

不要在 React 19 上用 `--force` 或 `--legacy-peer-deps` 长期锁住 13.1.1。那只绕过安装检查，不会补上并发、Strict Mode 和类型。本条目的可运行依赖是 `@hello-pangea/dnd@18.0.1`，宿主 React 19.3.0。fork 的 v18 发行说明包含 React 19 peer。示例**不导入** `react-beautiful-dnd`。

三条路，Lab 只走第一条：

| 路径 | 包 | 何时 | 代价 |
| --- | --- | --- | --- |
| A 少改组件树 | `@hello-pangea/dnd@18.0.1` | 已有 Droppable/Draggable，要先升上 React 19 | fork 的维护速度要自己跟踪；仍需键盘和触控回归 |
| B 逐步拆掉 RBD 形状 | `@atlaskit/pragmatic-drag-and-drop`（Lab 的 B14 是 1.8.1） | 多类型拖放、框架无关 | 键盘不会自动出现 |
| C 另一套状态 | `@dnd-kit/react` 或 B13 的遗留 core | 愿意重写传感器 | 不能只改包名 |

## Lab 当前示例

`examples/demo.tsx` 再导出 `examples/example.tsx`。顺序事务在 `examples/pinned-order.ts`。没有三列看板、没有 `server/app.mjs`、没有 `If-Match`、没有新建卡片的输入框。

已挂载：

- `DragDropContext` 的 `key={level}`，切换层级时卸掉传感器。`useLayoutEffect` 在绘制前把 `activeDrag` 设为 null，cleanup 再清一次。
- 单个 `Droppable droppableId="reactloom-channels" direction="vertical"`。`ref={provided.innerRef}` 且展开 `droppableProps`。末尾渲染 `provided.placeholder`，否则拖动时容器高度会塌。
- 每个 `Draggable` 的 `key` 和 `draggableId` 都是 `item.id`，`index` 只是当前位置。`isDragDisabled` 当 `item.fixed`。
- `draggableProps` 必须留在 `<li>` 上，**包含 style**。丢掉 style，库的位移就没了。手柄是单独的 `<button>`，只展开 `dragHandleProps`。`touch-action: none` 在手柄。
- `onDragStart` 记下当时可见 id 列表、`state.revision` 和 level。
- `onDragEnd`：没有 destination，或 droppableId 变了，直接返回。`isFreshDrop` 要求快照的 level、revision、id 序列和 `source.index` 上的 id 都还匹配。否则只 dispatch `notice`，不改顺序。键盘上移也会先清掉快照，避免随后的 drop 覆盖按钮结果。
- `reduceOrder` 的 `move` 先走 `canReorderAroundPinned`。固定项以及路径上的固定项拒绝移动，消息说明顺序未改变。成功时 `previous` 记下旧数组，`revision + 1`。
- basic 只把前三项交给 Droppable，移动的 `visibleCount` 是 3，隐藏项留在数组后面。
- advanced：撤销和重置同样清掉进行中的拖动。重置换上初始频道并增加 revision。

初始数据里「国际时事」`fixed: true`。output 用箭头连接 id。

未挂载：跨列、IME 新建卡片、PUT 全板、409/503、`resetServerContext`。fork 18 的说明里旧的 `resetServerContext` 文档已被拿掉，不要从原库 SSR 经验推断 React 19 水合。本示例是客户端。

## 旧形状与第一步替换

历史代码（不要安装旧包）：

```tsx
import {DragDropContext, Draggable, Droppable} from 'react-beautiful-dnd';

<DragDropContext onDragEnd={onDragEnd}>
  <Droppable droppableId="inbox">{provided => (
    <ul ref={provided.innerRef} {...provided.droppableProps}>
      {items.map((item, index) => (
        <Draggable draggableId={item.id} key={item.id} index={index}>
          {drag => (
            <li ref={drag.innerRef} {...drag.draggableProps}>
              <button type="button" {...drag.dragHandleProps}>{item.title}</button>
            </li>
          )}
        </Draggable>
      ))}
      {provided.placeholder}
    </ul>
  )}</Droppable>
</DragDropContext>
```

迁到 fork 时，把导入改成 `@hello-pangea/dnd` 只是第一步。还要核对：context 不嵌套、placeholder 还在、style 还在、id 不是 index、Strict Mode 下拖动快照不会在数据已经变了之后写入。Lab 用 `isFreshDrop` 做最后这条。

`DropResult` 含 `draggableId`、`source`、`destination`（取消时为 null）、`reason`。库不更新你的数组。不 `setState`，松手会跳回旧位置。取消和没有落点时不要写服务器，也不要写本地顺序。

## 模型

```text
onDragStart → 快照 {ids, revision, level}
onDragEnd
  → destination 为空则忽略
  → isFreshDrop 失败则只提示
  → reduceOrder：不可变搬移，revision+1
键盘按钮 → 先丢掉快照，再走同一个 reduceOrder
```

`isFreshDrop` 把可见 id 逐个比较。拖动过程中若撤销或重置，revision 或 id 序列对不上，drop 被拒绝。这防止「用开始时的 index 覆盖已经变过的数组」。

生产上的保存还应是：乐观更新之后单飞 PUT，带预期修订号；200 用响应校正；409/503 重新 GET；abort 只表示客户端不再等待。Lab 没有这条网络。不要把本地 `revision` 说成 HTTP `ETag`。全量提交大数组在真实项目里应改成按 id 和锚点的增量操作。

## 三层渐进

### Demo ① 换入口（已挂载）

三张卡：AI、前端、RSS。拖动手柄或上下按钮。output 改变。后两张（国际时事、深度阅读）不在这层的 Droppable 里，basic 的重排不得弄丢它们。

### Demo ② 整列与手柄（已挂载）

五张都在。固定项不能拖。手柄和上下按钮分开，避免以后若有链接或开关时整卡拖拽把点击吃掉。当前行内没有输入框。

未挂载的业务看板：三列「收件箱 / 阅读中 / 已完成」、选择目标列的下拉框、乐观 PUT。那些按钮必须在不拖拽时也能改列。Lab 只有一列顺序。

### Demo ③ 过期 drop（已挂载）

撤销回到 `previous`。重置回到初始标签。拖动开始后若先按撤销，松手应出现「拖动期间列表或层级已变更」而不是把旧 index 写回去。切换 level 会重挂 context。

未挂载：中文输入法。原研究里的新建卡片要在 `compositionstart/end` 和 `isComposing` 期间忽略 Enter。这里没有该输入，不要声称已经验过搜狗或 Gboard。

## 反例

```tsx
// 错
import {DragDropContext} from 'react-beautiful-dnd';

// 对
import {DragDropContext, Draggable, Droppable} from '@hello-pangea/dnd';
```

```tsx
// 错：身份跟着下标变，跨位置后 React 复用错节点
<Draggable key={index} draggableId={String(index)} index={index} />

// 对：draggableId={item.id} key={item.id}
```

```tsx
// 错：原地 splice
items.splice(source, 1);

// 对：reduceOrder 复制可见段再插入，并接上不可见后缀
```

```tsx
// 错：Esc 取消也保存
onDragEnd={result => save(result.source.index, result.destination.index)}

// 对：没有 destination 就返回
```

```tsx
// 错：拖动开始时的 index 在撤销之后仍然生效
dispatch({type: 'move', from: source.index, to: destination.index});

// 对：isFreshDrop(snapshot, state, level, source.index, draggableId, visible.length)
```

```tsx
// 错：整张 li 都是 dragHandleProps，里面的按钮无法点击
<li {...drag.dragHandleProps} />

// 对：手柄按钮单独接收 dragHandleProps
```

```tsx
// 错：不渲染 placeholder
<ul ref={provided.innerRef}>{children}</ul>

// 对：子节点之后 {provided.placeholder}
```

```tsx
// 错：丢掉 draggableProps.style，或再用 transform 盖住它
<li style={{transform: 'none'}} {...drag.draggableProps} />

// 对：style={{...drag.draggableProps.style, display: 'flex', ...}}
```

```tsx
// 错：Abort 之后假设服务器没有写入
// 对：不确定时重新 GET 并禁止继续改，直到权威顺序回来。Lab 无请求，不要假装测过
```

```tsx
// 错：过滤之后仍把视觉 index 提交给后端
// 对：拖动期间冻结过滤，或按 id 重新定位。basic 用 visibleCount 把隐藏项留在后面，而不是把它们的 index 当成另一列
```

固定定位和祖先 `transform` 会改变拖动坐标。Portal 重父节点要按 fork 文档做，不要随手 `appendChild`。本示例没有 portal 克隆。

## 组合

**fork + Query**：拖动中的草稿可以在本地，权威 cache 在 mutation 结束或 409 之后更新。refetch 不要在拖动中途替换数组，除非先使快照失效（增加 revision）。Lab 的 revision 就是这个失效开关，只是没有 Query。

**fork + 虚拟列表**：窗口滚动会使 `source.index` 失去意义。要按官方虚拟列表示例测「滚动中拖动」。本列表最多五项可见，不是该模式。

**若键盘模型不够**：保留上下按钮。空格提起再按箭头是库自带传感器的行为，仍要在浏览器里看公告是否够。不要只写「可拖拽」三个字。

路径 B 的 Pragmatic 迁移包版本要单独查，不要假设 B14 的 1.8.1 等于研究稿里的 4.x。路径 C 不要和 `Draggable` 同时绑在一个节点上。

## 生产清单

- 导入只有 `@hello-pangea/dnd`。
- id 稳定，Apache-2.0 声明保持在依赖记录里。
- placeholder 和 style 都在。
- 手柄与其他控件分离。
- 取消不写顺序。
- 固定项在 reducer 里拒绝，不只靠 `isDragDisabled`。
- 快照对不上就不写。
- 键盘按钮与拖放同一 reducer。
- 不嵌套 DragDropContext。
- 大列表不要一次 PUT 整个 JSON 还说这是性能方案。
- 触控、读屏、Esc 取消需要浏览器，policy 测试看不到。

## 升级

1. 停用旧包，改导入，跑现有键盘和指针回归。
2. 去掉对 `resetServerContext` 的依赖，按 fork 18 文档处理 SSR。本 Lab 不跑 SSR。
3. 把 index 写入改成 id 校验（Lab 已做 `isFreshDrop`）。
4. 若产品超出单列，评估 B14 或 B13，而不是在 fork 上堆自由坐标。

练习：把快照在拖动中按撤销，确认松手不改变撤销结果。再在 basic 重排后检查隐藏两项的相对顺序仍在数组末尾。

## 验收

basic：前三项顺序变，后两项 id 仍在后面。business：国际时事不能拖，也不能被上下按钮跨越。advanced：撤销恢复上一份；拖动中重置或撤销后，过期 drop 只改 status 文案。placeholder 节点存在。依赖列表里没有 `react-beautiful-dnd`。

sdk、build、browser 为 NOT_RUN。没有匹配 receipt 就不能写成 fork 的拖拽 PASS，更不能写成原库 PASS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件 / 153 项测试、45 个 Playwright，不是 B22 的 PASS。

```bash
node --experimental-strip-types --test packages/library-lab/entries/B22-react-beautiful-dnd-migration/tests/order-history.test.mts packages/library-lab/entries/B22-react-beautiful-dnd-migration/tests/pinned-order.test.mjs
```

断言固定槽、revision 和过期 drop。不证明传感器或占位高度。

## 官方资料

- https://github.com/atlassian/react-beautiful-dnd
- https://github.com/atlassian/react-beautiful-dnd/blob/master/LICENSE
- https://github.com/hello-pangea/dnd
- https://github.com/hello-pangea/dnd/releases/tag/v18.0.1
- https://github.com/hello-pangea/dnd/blob/main/LICENSE
- https://github.com/hello-pangea/dnd/blob/main/docs/api/drag-drop-context.md
- https://www.npmjs.com/package/@hello-pangea/dnd
- https://dndkit.com/react/guides/migration/
