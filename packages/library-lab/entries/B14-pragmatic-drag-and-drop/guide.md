# B14 Pragmatic drag and drop — 实战指南

> 此条目按当前官方API重新实现。三层场景是真实源码中的可选模式，不代表三个独立构建；SDK/browser/build 尚待实际执行验证。

## 什么情况下选 Pragmatic
这是Atlassian面向原生DOM事件的拖放适配器，常用于列表、看板、复杂可定制drop target。它不强迫你使用React，也不像dnd-kit默认提供SortableContext和键盘传感器。必须自行维护业务顺序、可访问性、过滤及监视器范围。

## 安装、入口与数据流
```bash
pnpm add @atlaskit/pragmatic-drag-and-drop@1.8.1
```
```ts
import {draggable,dropTargetForElements,monitorForElements} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import {combine} from '@atlaskit/pragmatic-drag-and-drop/combine';
```
最小行为：DOM元素注册 draggable、同元素注册 drop target；拖动开始的数据放在 getInitialData；监听器onDrop读取source.data与location.current.dropTargets[0]并映射到React状态数组，不能直接挪DOM。

## 三层实验
basic将3个频道的DOM注册为drag source；business扩展为五个新闻分组，stable id排序并输出真正状态；advanced固定一个条目，同时增加撤销、重置和监视器局部scope。列表通过useId生成scope，跨Lab多个示例不能互相接收拖动。

## 生命周期与可访问性
Draggable与dropTarget必须在元素mount后注册，并在unmount时调用combine返回的cleanup；全局monitor必须使用canMonitor只监听本列表，卸载时移除。单个HTML元素对同一adapter不可注册多个同类型drop target。本例对没有原生拖拽或使用屏幕阅读器的人提供上下按钮，其逻辑与拖动共享reorder状态路径。真实触屏、辅助技术和浏览器必须专项测试。

## 反例和正确用法
1. 跨窗口drag不设置scope，导致其他工作区误接收；用业务type+scope过滤。2. 只处理onDrag而每帧写React序列；在onDrop提交一次。3. 用数组index作来源ID，重新排序后节点身份错乱；使用永久业务id。4. 每次render重新注册monitor却忘记cleanup；useEffect作用域绑定。5. 把锁定按钮的disabled当后端权限，仍需持久化边界校验。

## 迁移练习
对比B13 dnd-kit的键盘Sortable、B22 react-beautiful-dnd的Droppable与本库低层事件模型，选择满足任务复杂度的最轻方案。把RSS默认频道分组拖动后联动服务器提交，加入冲突回滚，不要由拖动UI直接写生产数据库。

## 官方来源及授权
- [Atlassian Core](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/)
- [Element adapter](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/adapters/element)
- [监听隔离](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/recipes/isolating-experiences/)

许可：Apache-2.0（请依目标版本复核）；本示例代码和输入数据原创。不调用付费API。

## 固定频道不可被跨越：业务规则而非拖拽SDK特性
原实现仅拒绝锁定的拖拽起点、终点，允许一个可移动条目从固定项前面移到后面；数组重排会把中间固定项的索引悄悄改变。现使用 `examples/pinned-order.ts` 检查从起点到终点的**完整闭区间**，任一条目为 locked/fixed 就拒绝移动，三个SDK实现都使用同一约束。上下按钮在不可合法移动方向直接禁用，避免看起来可点但实际只报错。
本地定向测试在条目目录执行：`node --experimental-strip-types --test tests/pinned-order.test.mjs`；测试从实际TS源文件导入规则，覆盖锁定项、双向跨越、合法同侧重排及越界。**该纯业务规则测试不意味着 SDK、React、Chromium 或触控运行已经验收。**
若产品允许移动其他项跨过固定槽位，先重新定义排序与不变式，并增加对应测试，而不是直接套用 arrayMove/splice。
