# B13 dnd-kit 工程指南

本例固定@dnd-kit/core6.3.1 + sortable10.0.0，使用经典DndContext/SortableContext/useSortable。适合React单列表自定义排序；新@dnd-kit/react接口、操作系统文件和服务端保存不在本例。先读library、guide、example/pinned-order、verification。

## 迁移与模型

复制examples/example.tsx、pinned-order.ts和workshop.css，保持相对导入，安装两个声明依赖。items是完整业务数组；basic显示前三项并保留隐藏后缀。业务ID永久唯一，SortableContext.items与可见DOM顺序一致；React key与useSortable id都用同一个ID。完整数组的重复ID应拒绝，不能只检查可见前缀。

PointerSensor距离约束6px；KeyboardSensor用sortableKeyboardCoordinates。setNodeRef在行，setActivatorNodeRef/listeners/attributes在唯一手柄按钮；touch-action:none只在手柄。保留原生上下按钮作为额外输入，而非用它冒充键盘Sensor。transform/transition来自SDK，只是预览。

## 约束与撤销

basic教真实排序与数组/DOM同步；business教news固定第4位且不能跨越；advanced教单层撤销与迟到drop。锁定不能只靠disabled：canReorderAroundPinned检查整段源到目标，拖放和按钮共用reorderVisible，不原地修改原数组。

拖动开始记录activeId/revision/level；数据提交、撤销或恢复使旧revision失效，结束必须通过isCurrentDragSession。取消、模式变化和卸载清会话引用；应用不清全局监听。SDK拥有传感器监听，内部有延迟文档监听回收，真实卸载/重进需browser验证。恢复默认可撤销；只存一层历史。

## 断言

- basic初始tech/ai/oss，指针或Space→ArrowDown→Space提交后DOM与b13-visible-order一致，b13-all-order仍带news/read/later；Escape不改顺序。
- business锁定news手柄disabled、移动不能跨过它，上下两侧内部合法排序仍成功；预览动画不代表业务已提交。
- advanced合法移动→撤销恢复且按钮失效；恢复默认/其他提交后的旧drop被忽略，revision递增；停止/卸载不再写排序。
- SSR suite真实core/sortable hooks与closestCenter只证明SDK API/给定几何；三个policy suite证明数组/锁/会话，不证明实际传感器或DOM测量。

观察点：b13-workshop[data-level]、b13-item-<id>[data-item-id/data-locked]、b13-visible-order、b13-all-order、b13-status、b13-revision、b13-drag-state。按钮名字继续为拖动/上移/下移+频道名，advanced撤销/恢复默认。

## 来源

官方core tag6.3.1固定commit e9215e820798459ae036896fce7fd9a6fe855772，同commit声明sortable10.0.0。官方Sortable包README英语原文、无中文候选，元数据固定sha/时间；官网有完整头但无Lab iframe实测，unknown。本轮不沿用旧CI或研究PASS，正式状态仍依verification与收据。
