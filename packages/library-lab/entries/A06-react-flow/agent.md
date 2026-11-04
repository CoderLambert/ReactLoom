# A06 React Flow — 工程手册

## 适用

`@xyflow/react@12.12.0` 做可编辑节点和边。它不执行业务，也不做自动图分析。静态说明用 A08，大规模关系布局用 A07，自由白板用 A09/A10。Lab 用内置节点类型和受控 `useNodesState` / `useEdgesState`。

## 版本

只依赖 `@xyflow/react@12.12.0` 和 `@xyflow/react/dist/style.css`。不要安装 `reactflow` v11。MIT 核心不等于 Pro 去署名。类型随包提供。

## 迁移

v11 默认导入、`parentNode`、`onEdgeUpdate`、`node.width` 分别换成命名导入、`parentId`、`onReconnect`、`measured`。改 `data` 时新建对象。层级切换要 `cloneWorkflowPreset`，因为宿主可能不卸载组件，且 SDK 会改节点对象。

## 不可删的清理

`onConnect` 必须对 `setEdges` 收到的当前数组再跑 `validateConnection`。删除节点要 `pruneEdgesForRemovedNodes`。重置和换 level 时替换成新拷贝，不要把已交互的节点引用塞回去。若加上请求，卸载时 abort，并以序号丢掉迟到响应。

## 反例

```tsx
setEdges((edges) => addEdge(connection, edges)); // 错：不看环和重复
setEdges((current) =>
  validateConnection(nodes, current, connection.source, connection.target).valid
    ? addEdge(connection, current) : current);
```

高度为 0、render 中创建 `nodeTypes`、原地改 label、持久化 `dragging`，都不要做。Lab 规则不含「源节点禁止入边」，需要的话自己加，并在服务端重复。

## 测试断言

纯函数测试覆盖缺端点、未知 id、自环、重复、有向环，以及 basic 只留前两个节点。SDK 收据还要看到真实 `ReactFlow`、非法连接不增加边、删除节点后边消失、`fitView` 容器高度大于 0。没有 runs 收据则为 NOT_RUN。

## 真实限制

没有自定义节点、坐标转换、JSON 修订、409、IME。键盘连接和画布共用同一校验。MiniMap 在 basic 不渲染。节点文案不是可执行脚本。没有规模或帧率数字。

## 断言边界

`tests/graph-rules.test.mts` 与 `tests/workflow-preset.test.mts` 不渲染画布。SDK 用例要 `import { ReactFlow, addEdge } from '@xyflow/react'`，容器高度大于 0，非法连接后边数不变，删除节点后相关边消失。不要用假的 nodes 数组宣称 Handle 可用。缺收据时保持 NOT_RUN。样式表路径是 `@xyflow/react/dist/style.css`，漏引会让画布看起来像库失败。

## 证据

Actions `41779873259` 的仓库级 install、typecheck、build、52 SDK 文件（153 测试）和 45 Playwright 不是 A06 PASS。不要把规则测试或历史研究 PASS 写入 `verification.json`。

对照 `library.json` 的版本编写 import，不要升到条目未钉死的版本。
`tests/` 中的策略用例不能改写成 sdk 字段的 PASS。
浏览器与构建未留下收据时，对应字段维持 NOT_RUN。
