# react-konva 19.3.2：React 声明式 Canvas

## 用途与安装
`pnpm add react-konva@19.3.2 konva@10.9.0`。本版本与仓库React/ReactDOM 19.3版本线匹配（需实际peer验证）；React18/19.2不能直接复用该锁定版本。浏览器端导入 `Stage, Layer, Rect, Text`，它们是canvas场景节点，非DOM节点。

## Demo 的三个层次
- **basic**：声明式Stage/Layer/Rect/Text，点击选中视觉状态。
- **business**：工作流连线与节点拖拽，`onDragEnd`按稳定业务ID写回坐标，避免每次更新覆盖正在拖拽的内部状态。
- **advanced**：新增/删除节点、锁定拖拽、容器 ResizeObserver、缩放逻辑以及完整DOM表格/键盘移动替代。

主站加载`examples/demo.tsx`，真正可迁移源码为`examples/example.tsx`，无需独立编写第二套Demo展示实现。

## 数据流与尺寸
`nodes[]`是单一事实源；React渲染图元属性，Konva管理Canvas命中与像素绘制。UI尺寸和业务世界坐标是两套体系：外部容器实际宽度决定`Stage.width`，逻辑坐标通过`scaleX/scaleY`映射。别把经缩放后的鼠标屏幕坐标直接持久化为文档坐标。

## 生产级边界
1. **React 版本线**：react-konva 19.3要求React和ReactDOM 19.3；其他版本应按官方矩阵锁定，不按大版本号瞎装。
2. **稳定Key**：图元应用业务ID，不能使用排序索引导致拖拽后交换状态。
3. **拖拽与状态**：仅在`onDragEnd`保存坐标；对实时协作更频繁更新需节流并处理冲突。
4. **性能**：超过大量节点时，分图层、只绘制可视区域、控制复杂hitGraph；不要仅凭优化口号宣称支持百万节点。
5. **无障碍**：canvas文本通常不能被DOM无障碍树读取；保留旁边HTML列表和键盘按钮，不能只写`aria-label`就认为图形可操作。
6. **卸载**：react-konva负责Stage的React生命周期；外部ResizeObserver、事件订阅和上传图片ObjectURL仍由业务组件自行清理。

## 取舍
A11 Konva适合命令式绘制/框架无关宿主；A12适合React状态驱动。Excalidraw/tldraw自带更完整编辑产品能力，若需求是白板协作，不该仅凭React-Konva重新造选框、撤销、权限与文档存储。

## 验收
目前真实SDK代码已写，typecheck/build/browser **NOT_RUN**。后续必须跑React19.3 peer与Canvas渲染，重复挂载卸载，点击/拖拽/键盘同一模型、尺寸缩放与DOM替代，不能用截图或Mock SDK代替运行。

来源：https://konvajs.org/docs/react/index.html · https://github.com/konvajs/react-konva/blob/master/docs/react-compatibility.md （MIT）。

## 窄屏与拖拽边界补丁（2026-10-27）
宿主宽度来自实际 clientWidth，不再强制最小320px；`stage-policy.ts`将尺寸/逻辑世界坐标分离（620×260），dragMove与dragEnd在Konva Group的局部坐标上夹紧，DOM键盘移动使用相同规则。动态节点最多24个，新增ID由事件处理器递增，不在React updater产生副作用。以上仅是纯规则测试，缩放后的pointer坐标、真实Canvas焦点和StrictMode仍待SDK/Chromium实测。
