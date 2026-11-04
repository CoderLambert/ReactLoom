# A06 React Flow — Agent 实战约束

**用途**：在 React 应用中编辑交互式节点管线，非后台工作流执行器。版本 @xyflow/react 12.12.0 / MIT；无需旧 reactflow v11。
**迁移源码**：examples/example.tsx；examples/demo.tsx 仅负责Lab导出。移动时一起包含 @xyflow/react/dist/style.css，父级显式高度，稳定节点/边ID。
**数据所有权**：ReactFlow 的节点和连接数组由受控 useNodesState/useEdgesState 管理，onNodesChange/onEdgesChange不能省略；onConnect 使用 addEdge，仅创建合法 Connection。节点文案不可信，不应执行脚本或URL。
**校验边界**：防自环只是示例；产品必须增加节点类型、句柄约束、有向无环性、版本冲突以及后端权限。自动执行、网络调用必须另设计安全边界。
**反例**：父容器高度0、直接改数组且不触发更新、索引ID、ReactFlow+旧reactflow混装、未加载CSS、把图形连接误当业务权限验证。
**检查**：真实包构建、React19类型、拖拽/连接/重置、新节点ID稳定、键盘辅助控件、卸载资源及文字替代数据表。没有执行前所有验证维度保持NOT_RUN。
**参考**：https://reactflow.dev/learn ; https://reactflow.dev/api-reference/utils/add-edge。相关 A07 G6 和 A08 Mermaid。

## 本条目新增的规则文件

同时迁移 `examples/graph-rules.ts` 与 `examples/example.tsx`，不能只复制 ReactFlow 组件并删除 `validateConnection` / `pruneEdgesForRemovedNodes`。两处防护：`isValidConnection` 阻止无效连接交互，`onConnect` 拒绝提交非法边。节点 remove 时同步清除关联边；本地 DAG 校验不替代服务端版本、权限、句柄语义或执行引擎审查。运行纯规则测试后仍需真实SDK与Chromium验证。


## wave19 场景一致性与可访问编辑

复制 `examples/workflow-preset.ts` 与原有 graph-rules 一起使用；切换 level 时不得复用首次初始化的受控图或变异 preset。键盘 select/按钮和画布共用 onConnect 校验与 addEdge，删除按钮共用 handleNodesChange 与 incident edges 清理。保留非交互式可读关系表，仍需真实 React Flow 与 Chromium 交互验收。

