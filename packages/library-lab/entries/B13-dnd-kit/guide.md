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
