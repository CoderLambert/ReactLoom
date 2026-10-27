# dnd-kit：生产排序与键盘/触摸边界

## 选型与版本
本示例使用稳定的经典 Sortable 栈：@dnd-kit/core 6.3.1、@dnd-kit/sortable 10.0.0（MIT）。**新架构 @dnd-kit/react（0.x）与这里不是同一接口**，不要混用 DragDropProvider/useSortable 与旧 DndContext。官方旧API：https://dndkit.com/legacy/presets/sortable/overview/ 。

## 安装
pnpm add @dnd-kit/core@6.3.1 @dnd-kit/sortable@10.0.0
PLATFORM 负责实际安装、核对 React19 peer 与锁文件。注意 npm 的 sortable 包可能依赖 utils 和 core，不能单凭 npm 显示最新就认定安装兼容。

## 演示场景
- basic：对三个 RSS 频道排序；明确 Draggable/Droppable 唯一稳定 id。
- business：六频道、可见顺序与键盘上下移，拖拽手柄不会吞掉行内按钮操作。
- advanced：锁定频道、不允许拖到锁定位置、撤销一步和重置，展示受控顺序所有权。

运行时实际源码在 examples/example.tsx；examples/demo.tsx 仅导出入口；网页源代码与运行版本来自相同文件。

## 工作机理
DndContext 处理 sensors/collision；SortableContext 提供 id 顺序；useSortable 绑定 DOM、CSS transforms 与拖动手柄。只有 onDragEnd 更新 React 数据，UI 序号不是 ID。PointerSensor distance=6 减少误触；KeyboardSensor + sortableKeyboardCoordinates 支持手柄键盘激活。触控手柄设置 touchAction:none，避免被系统滚动手势抢占。增加上下按钮作为非拖拽路径。

## 典型生产错误与修复
1. **数组索引当 ID**：移动后组件身份错乱，表单/媒体内部状态错位 → 使用唯一持久化 id。
2. **拖动整行劫持链接/输入**：设置独立 activator/handle，listener 只在手柄上。
3. **只实现指针不实现键盘**：启用 KeyboardSensor 并验证 Space、箭头和 Escape；仍保留上移/下移按钮。
4. **禁用仅改透明度**：必须传给 useSortable disabled，并在实际 reorder 提交函数校验权限；服务端也应验证。
5. **误认为 DndContext 负责保存业务**：只提供交互事件，排序持久化需要请求、乐观更新与失败恢复。
6. **下标越界/移到锁定位置**：在数据提交前根据真实 ID 和业务规则过滤，不能只依赖前端样式。
7. **混用经典与新版API**：包名和受控生命周期不同；迁移时独立验证键盘、触控和多列表。

## 组合及边界
与 TanStack Query 组合时先在本地按 id 重排、请求后端排序接口，失败按版本回滚；与 react-arborist 是树形交互不同需求。复杂跨容器和可访问性可以考虑 Pragmatic drag and drop。

## 练习与验收
加入后台持久化失败回滚和权限检查；测试鼠标距离阈值、触控、键盘手柄、锁定条目、稳定焦点、Esc取消和撤销。当前仅有真实目标库 import 源码，SDK/build/browser NOT_RUN。禁止据此声称 React19 全兼容或完整可访问性通过。

## 固定频道不可被跨越：业务规则而非拖拽SDK特性
原实现仅拒绝锁定的拖拽起点、终点，允许一个可移动条目从固定项前面移到后面；数组重排会把中间固定项的索引悄悄改变。现使用 `examples/pinned-order.ts` 检查从起点到终点的**完整闭区间**，任一条目为 locked/fixed 就拒绝移动，三个SDK实现都使用同一约束。上下按钮在不可合法移动方向直接禁用，避免看起来可点但实际只报错。
本地定向测试在条目目录执行：`node --experimental-strip-types --test tests/pinned-order.test.mjs`；测试从实际TS源文件导入规则，覆盖锁定项、双向跨越、合法同侧重排及越界。**该纯业务规则测试不意味着 SDK、React、Chromium 或触控运行已经验收。**
若产品允许移动其他项跨过固定槽位，先重新定义排序与不变式，并增加对应测试，而不是直接套用 arrayMove/splice。

## AB wave16：快速多事件重排的一致性

拖拽事件、上下键和重置统一在当前 `itemsRef` 快照上提交；`pinned-order.ts` 的 `reorderVisible` 按真实ID验证目标、去重、锁定闭区间、可见前缀，并保留basic模式未显示的尾部频道。避免连续事件依据旧React闭包数组产生丢序/错误撤销快照。`tests/reorder-policy.test.mts` 额外覆盖隐藏尾部、固定槽位、旧目标和重复ID；键盘传感器/触摸与DOM焦点仍待真实浏览器。
