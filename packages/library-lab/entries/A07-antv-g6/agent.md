# A07 AntV G6 — AI Agent 工程迁移手册

## 任务选择
当需要呈现关系网络、依赖拓扑、知识图谱时选择 G6；常规图表优先 A01/A02，拖拽流程画布考虑 A06。当前 SDK 基线 `@antv/g6@5.1.1`（MIT），严格区别 4.x 接口。

## 先读取
`library.json` → `examples/example.tsx` → `guide.md` → `verification.json`。目标项目只移植 Graph 的数据映射、容器管理和 cleanup；实验室控制按钮与 fixture 不需要复制。

## 实施要点
- Graph 挂载到 ref，给容器确定高度；节点 ID 稳定、边引用合法。
- 构造/渲染异步：使用 mount-generation 或 disposed 守卫，避免卸载后写状态。
- 卸载必须取消 ResizeObserver 与事件，然后 Graph.destroy()。StrictMode 二次挂载应无残余实例。
- 高频数据变化考虑 `setData`/`render` 而非频繁构造 GPU/Canvas。
- Canvas 图提供 DOM 表格/列表，键盘可访问的业务动作不绑在纯 Canvas 上。

## 禁忌与验证
不得混用 G6 4.x 的 `changeData`；不得默认所有图边无环；不得从用户输入拼接任意 HTML 标签；不得只看静态截图声称交互有效。验证真实 import、node/edge 更新、resize、StrictMode 重挂载、销毁、窄屏和辅助技术数据表。没有当前 sourceFingerprint 的实际证据保持 NOT_RUN。

## 官方来源
https://g6.antv.antgroup.com/en/manual/getting-started/integration/react
