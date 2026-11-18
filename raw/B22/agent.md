# B22 React19历史迁移复用

身份保留历史react-beautiful-dnd迁移条目，实际只导入@hello-pangea/dnd18.0.1，React/DOM19.3.0。原13.1.1的peer只16.8.5/17/18，npm已弃用、仓库归档；未安装执行原库，不得把替代SDK通过写成原库PASS。两者运行时Apache-2.0。

目标：基础真实SDK鼠标/键盘+稳定id/隐藏尾部；业务五项/手柄/固定区间；高级CANCEL/一次undo/reset/最终快照校验。无跨列、HTTP、持久化、IME新建或虚拟化。迁移四sourceFiles含CSS，保留innerRef、droppableProps、draggableProps及其style、独立dragHandleProps、placeholder；key/id稳定，index仅位置。

SDK自有鼠标/触摸/键盘传感器，不是HTML5 DND。不要用DataTransfer假拖动或locator.dragTo当真实迁移验收。mode的FLUID/SNAP是移动模式，字段id/source/destination/mode/reason来自SDK；receipt的phase/snapshotRevision是应用标注，按钮改序不是SDK事件。

快照放同步onBeforeDragStart；异步onDragStart只观测。取消/无落点、level/revision/id序列/source ID与固定闭区间校验都在reducer最终drop写入层；不能在组件早做检查后无条件写旧index。manual move/undo/reset先清快照，level layout cleanup再清并key重挂context。no-op reset仍递增revision失效会话但不造新undo，same-position drop不造事务；basic保留尾部两项。

SDK管理传感器/注册/内部style/焦点，应用不清全站资源；browser按context id核它自己两style标签卸载与重挂。提供中文用法说明不等于默认公告和真实读屏已验收；原resetServerContext不在18.0.1公开导出，完整SSR hydration未测。

b22-workshop data-level/revision/all-order；b22-list/row data-item-id/data-dragging为实际SDK render snapshot，b22-order实际可见数组，b22-sdk-event真实回调子集，b22-status最终业务结果。原手柄/上下按钮、撤销/恢复标签保留，标题删除未实现的持久化承诺。

主official/readme是hello-pangea18.0.1固定commit410173402853654f64436d116d68e3f89359d496原文；legacy-readme是原13.1.1 npm gitHead历史快照，严格分开。站点GET200但未Lab iframe确认→unknown，最终响应头/脱敏cookie属性与hash/日期/SHA均在source-evidence。

Node SDK2只真实替代库React19 SSR，policy17只业务守卫；三条browser提案使用真实键盘/鼠标与SDK位移/回调，程序化恢复按钮仅作并发业务fixture，不伪造SDK DropResult。正式三项及整体运行未满足条件仍NOT_RUN。复核local-validation实际命令/日志与剩余，不从原库名字、目录齐或共享build推导SDK PASS。

本例手柄为真实button，Draggable必须带disableInteractiveElementBlocking解除SDK默认交互元素阻止；dragHandleProps仍仅限专用手柄，非手柄按钮仍不能提起。
