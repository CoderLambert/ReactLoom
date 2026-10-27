# B22 react-beautiful-dnd（历史迁移） — 实战指南

> 此条目按当前官方API重新实现。三层场景是真实源码中的可选模式，不代表三个独立构建；SDK/browser/build 尚待实际执行验证。

## 为什么这是历史迁移而非react-beautiful-dnd的教程
原`react-beautiful-dnd`已停止维护/归档，现代React19项目不应该将旧包强行安装为运行示例。低风险迁移路径先考察`@hello-pangea/dnd` v18.0.1，它保留DragDropContext、Droppable、Draggable及onDragEnd结构，并支持React19。复杂非列表/网格应另评估B13 dnd-kit与B14 Pragmatic。

## 安装与引入
```bash
pnpm remove react-beautiful-dnd
pnpm add @hello-pangea/dnd@18.0.1
```
```tsx
import {DragDropContext,Draggable,Droppable} from '@hello-pangea/dnd';
```
和历史库接近的API减少替换成本，但依赖变化后必须复核React19、拖动占位符、Portal、SSR与辅助技术。

## 三层实战
basic旧版DragDropContext→Pangea的最小替换，稳定draggableId；business模拟NewsHub订阅频道顺序，state数组在onDragEnd一次提交；advanced禁止移动固定频道并提供撤销、恢复和键盘按钮。源码在`examples/example.tsx`，旧接口不再被运行。

## 核心数据合同
`onDragEnd` 检查destination非空、目标droppableId合法、source与destination索引在当前可见列表之内、锁定约束是否满足；React拥有最终items。必须把`provided.innerRef`、`droppableProps`、`draggableProps`与`placeholder`接线完整。迁移不能改变业务ID为数组索引。若Persist调用返回409冲突，需要恢复上一次有效排序并在UI告知。

## 常见失败与处理
1. 只改import却忽略已废弃React renderer下的旧测试；升级依赖后重跑真实拖放。2. 缺少placeholder造成布局抖动。3. 把整条Draggable作为拖动手柄导致文本输入不可用；单独handle。4. 用索引当draggableId，重排状态错位。5. 在拖动完成前同步服务端，产生中间顺序或竞态。6. 锁定仅CSS变灰，onDragEnd缺业务检查。7. 老版React18与19 hydration/StrictMode差异无专项测试。

## 迁移练习
为既有RSS订阅排序先记录可观察契约（鼠标/触控/键盘、拖入空处、锁定、撤销、服务器失败），完成最小依赖替换后再考虑B13/B14重构，不要求一次性推翻业务状态。

## 官方来源及授权
- [Hello Pangea DnD](https://github.com/hello-pangea/dnd)
- [v18 React19发布](https://github.com/hello-pangea/dnd/releases/tag/v18.0.0)
- [历史react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd)

许可：Apache-2.0（请依目标版本复核）；本示例代码和输入数据原创。不调用付费API。

## 固定频道不可被跨越：业务规则而非拖拽SDK特性
原实现仅拒绝锁定的拖拽起点、终点，允许一个可移动条目从固定项前面移到后面；数组重排会把中间固定项的索引悄悄改变。现使用 `examples/pinned-order.ts` 检查从起点到终点的**完整闭区间**，任一条目为 locked/fixed 就拒绝移动，三个SDK实现都使用同一约束。上下按钮在不可合法移动方向直接禁用，避免看起来可点但实际只报错。
本地定向测试在条目目录执行：`node --experimental-strip-types --test tests/pinned-order.test.mjs`；测试从实际TS源文件导入规则，覆盖锁定项、双向跨越、合法同侧重排及越界。**该纯业务规则测试不意味着 SDK、React、Chromium 或触控运行已经验收。**
若产品允许移动其他项跨过固定槽位，先重新定义排序与不变式，并增加对应测试，而不是直接套用 arrayMove/splice。
