# React Flow：真实节点式编辑器和业务执行边界

## 概述与版本
@xyflow/react 12.12.0（MIT）提供流程节点、连接、拖动、平移/缩放。此包是旧版 reactflow v11 的继任命名，不要混用 import 来源和CSS。当前示例只使用免费核心能力，不包含Pro功能。

## 安装
pnpm add @xyflow/react@12.12.0
必须在真实示例入口引入 @xyflow/react/dist/style.css；容器必须有明确高度（示例370px），否则初始画布看不到。官方：https://reactflow.dev/learn 。

## 分层实验
basic：2个节点加受控连接、背景和缩放控件；business：4个新闻处理步骤、用户修改节点位置和连线；advanced：添加带稳定ID节点，阻止自身连接并重置完整图状态。实际示例源码 examples/example.tsx；显示源码由它直接生成。

## 业务模型/生命周期
useNodesState/useEdgesState 管理受控数组并提供 onNodesChange/onEdgesChange。onConnect 接受 Connection 并通过 addEdge 维护重复规则。此处仅过滤自己连自己；生产需要额外检查节点输入/输出类型、环路、有向图与权限。缩放、坐标、miniMap归组件内部管理；本示例卸载ReactFlow让库释放监听，不直接操作全局文档事件。

## 典型反例与修复
- 没有固定父容器高度，画布空白 → 显式高度和真实Resize测试。
- 使用数组index作 node id，编辑后连线错乱 → 持久稳定业务ID。
- 把流程图编辑等同后台执行能力 → 明确设计/发布/执行的权限与服务端校验，不能执行任意节点文本。
- 每次render重建节点列表，用户拖动结果被覆盖 → 一次初始化受控state并按NodeChange增量更新。
- 允许非法环路/重复边/连接到不兼容句柄 → 前后端双重验证，官方addEdge仅保护部分重复情形。
- 未加载内置CSS、忘记MiniMap/Controls的键盘操作或视觉焦点 → 引入样式，测试键盘与屏幕阅读器路径，提供文字关系表。

## 相关选型
需要图分析布局时 A07 G6；需要静态Markdown流程图用 A08 Mermaid。D07 TanStack Query 只负责保存草稿或取数，不拥有ReactFlow内置视图状态；后端持久化须支持版本号、冲突和撤销。

## 练习及验收
添加循环检查、节点类型约束、撤销/恢复和版本化保存。测试改变节点位置后状态持久、删除节点后关联边规则、页面卸载无全局事件泄露。当前仅编写真实SDK导入源码；没有SDK运行、TS构建、Chromium验收，不能标PASS。

## AB wave9：连接数据不变式已接线

本示例实际通过 `examples/graph-rules.ts` 检查断开的端点、已移除的节点、同向重复、直接自环和**多跳有向环路**。校验既作为 React Flow 的 `isValidConnection` UI 提示，也用于 `onConnect` 写入前的判定；删除节点时按 NodeChange 的 remove ID 清除关联边，不能留下悬空的执行管线。采用可迭代 DFS，避免深链递归溢出。其他业务规则（句柄类型、权限、服务端并发版本）仍必须单独实现。

定向逻辑测试：`node --experimental-strip-types --test entries/A06-react-flow/tests/graph-rules.test.mts`。这是纯图规则测试，不等于实际 React Flow SDK、浏览器或生产构建通过。


## AB wave19：切换场景与键盘编辑

以前 `useNodesState` 只在第一次渲染时初始化。DemoHost 如果保持同一组件，从 basic 切换至 business 会错误地留在两节点状态。现在 `cloneWorkflowPreset` 复制位置、data 与连线，层级切换和“重置”会重新载入对应完整图，避免 SDK 改动初始常量。

advanced 提供原生 select 选择节点和按钮建立连接，调用与 React Flow 画布相同的 `onConnect/validateConnection/addEdge`。DOM 表格提供删除节点操作，经真实 onNodesChange 删除并同步清除连线；无第二套假 UI 状态。相关 SDK API：https://reactflow.dev/api-reference/utils/apply-node-changes 。

必须在真实 Chromium 测试切换 level、Tab/Space、画布连线、删除并恢复、StrictMode；纯 preset 规则测试不代表 SDK 已通过。

