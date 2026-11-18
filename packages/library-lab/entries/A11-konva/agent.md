# Konva 10.9.0 工程复用

适用：自定义二维图元编排，需要Canvas命中、拖拽或Transformer。完整白板先评估Excalidraw/tldraw；React声明式图元用react-konva，并让包装器独占Stage。

## 迁移路径

读example.tsx的两类effect：Stage资源只在挂载/lesson变化时创建；业务Card数组按id增量同步Group/Rect/Text。必要依赖konva10.9.0和React客户端，复制example.tsx、stage-policy.ts；demo.tsx只是适配重导出，无外部图片或字体。

Card数组是业务事实。拖拽中保留SDK临时位置，dragend提交实际坐标。transformend将Group scale乘进Rect业务宽高后归1；boundBoxFunc绝对盒子除Stage scale，最小85×48世界单位。视口stage position/scale与卡片x/y分开。

## 三目标与观察

basic真实Canvas点选、DOM选择与键盘移动；business真实拖拽提交、容器ResizeObserver；advanced实际Transformer、指针锚定滚轮、新增/删除与销毁。诊断详情读取真实SDK对象和Transformer锚点，属于示例观察面板。DOM列表与SDK快照必须一致。

## 所有权与清理

Observer断开、rAF取消并检查当前Stage；命名空间wheel.a11和各Group事件随自有节点销毁。Stage.destroy递归销毁，清空自己Map/ref，不清理其他组件的Stage。ready使用Stage版本递增，确保effect重放后重新同步，不能依赖已为true的布尔值。删除卡片也须group.destroy。宽度非法不写Stage。

## 验证边界

SDK Node套件真实导入Konva并覆盖场景图父子/变换矩阵/事件卸载/子树destroy，不创建Canvas；policy只验证示例上限/宽度。真实绘图、鼠标命中/拖拽、Transformer手柄、滚轮坐标、RO和destroy必须Chromium观察，不用普通对象模拟SDK。

本例仅内存，无保存/PNG/文字输入/触控缩放。24卡片与0.6–2是示例预算。正式sdk/build/browser凭匹配recorder收据，不能从本地测试或旧CI推定。
