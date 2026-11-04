# A06 React Flow 12.12.0：受控节点、边和业务校验

React Flow 是可编辑的节点工作区：节点、端口、边、视口、拖拽和缩放。它不是执行引擎，连上两个节点不会去抓 RSS。它也不是十万点的 WebGL 关系图，渲染主体是 HTML 节点加 SVG 边。

Library Lab 钉 `@xyflow/react@12.12.0`。不要装旧的 `reactflow` 或 `react-flow-renderer`。核心库 MIT。Pro 示例、去署名和技术支持是另一份协议。默认保留归属标识。[remove attribution](https://reactflow.dev/remove-attribution)。

## Lab 当前示例

`examples/demo.tsx` 导出 `examples/example.tsx`。规则在 `examples/graph-rules.ts`，快照在 `examples/workflow-preset.ts`。样式是 `@xyflow/react/dist/style.css`。

已挂载：

- `useNodesState` / `useEdgesState` 受控。没有 `defaultNodes` 混用。
- basic 只克隆前两个节点（输入、清洗）和两端都还在的边。business / advanced 用四节点链：订阅源输入 → 清洗 / 去重 → 摘要生成 → 输出文章。
- `cloneWorkflowPreset` 每次层级切换和重置都拷贝 `position` 和 `data`，避免复用被 SDK 改过的对象。宿主可能不卸载组件，所以用 `useEffect([level])` 把图设回去。
- 容器高度 370。`fitView`，缩放 0.2..2。`Background`、`Controls`；非 basic 还有 `MiniMap`。
- `isValidConnection` 与 `onConnect` 都走 `validateConnection`。拒绝：缺端点、未知节点、自环、重复边、有向环。环的判定是：加上 source→target 会成环，当且仅当 target 已经能走到 source。
- `onConnect` 先看渲染期快照，再在 `setEdges` 里对**队列中的当前边**复检，通过才 `addEdge`。
- advanced 可加节点、从表格删除。`handleNodesChange` 看到 `remove` 就 `pruneEdgesForRemovedNodes`。输入节点和输出节点的删除按钮禁用。键盘用两个 `<select>` 调同一个 `onConnect`。
- 节点数和边数写在状态文案和表里。表是画布的文字等价物。

没有挂上：自定义 `nodeTypes`（用的是内置 input/default/output）、`ReactFlowProvider`、`screenToFlowPosition`、`useUpdateNodeInternals`、JSON 持久化、revision / 409、Abort、IME 组合输入、`nodrag` 侧栏改名。研究稿里的 `canConnect` 还禁止「来源有入边、发布有出边」；Lab 的纯函数**没有**这条端口方向规则，只有拓扑和重复检查。生产若需要，要加进 `validateConnection` 并在服务端再做一次，不能只靠画布。

## 五个对象

1. **Node。** `id` 唯一。`position` 是流程坐标，不是 `clientX`。`data.label` 是展示文案，不是可执行代码。`selected`、`dragging`、`measured` 是瞬时字段。
2. **Edge。** `source` / `target` 必须是还在的节点 id。有边不等于业务允许运行。
3. **Handle。** 多端口时要稳定的 handle id。动态增删端口后调用 `useUpdateNodeInternals`。Lab 使用默认端口。
4. **Viewport。** `x/y/zoom` 和节点坐标不是一回事。从屏幕落下新节点用 `screenToFlowPosition`，不要减 `offsetLeft`。`fitView` 需要容器已经有尺寸。
5. **Provider。** `<ReactFlow>` 的子组件自带上下文。要在画布**外面**用 `useReactFlow`，才包 `ReactFlowProvider`。否则是 zustand provider 报错。Lab 的按钮都在画布外，但它们不调用 `useReactFlow`。

业务文档、交互测量、服务端修订是三份所有权。`useNodesState` 适合这种中小受控示例。上了 Zustand 之后不要再留第二份可变节点数组。

## 三层

### 01 两节点

basic 只能看到输入和清洗，以及它们之间的边。可以拖、可以从 Handle 拉线。非法连接被拒绝并写入 `role="status"`。

### 02 四步流水线

business 展示完整链和 MiniMap。仍然不能改名、不能存盘。节点文字由 React Flow 渲染为文本，不要改成 `dangerouslySetInnerHTML`。

### 03 变更和键盘

advanced 加步骤、重置、键盘连线、按行删除。删除会收掉相关边。自环按钮会禁用，因为 `keyboardConnection.valid` 为假。

生产还要自己做：schemaVersion、revision、白名单持久化（不要存 `selected` / `measured` / 函数）、服务端 409、导入体积上限。`toObject()` 适合视口恢复，不适合当业务文档。

## API 要点

| API | Lab | 注意 |
|---|---|---|
| `useNodesState` / `useEdgesState` | 受控 | 不要同时传 `defaultNodes` |
| `addEdge` | 校验通过后 | 不管 DAG。业务规则在 `setEdges` 内再查一次 |
| `isValidConnection` | 拖线过程 | 服务端再执行同一规则 |
| `onNodesChange` | 先交给 hook，再修剪边 | 只处理 `type==='remove'` |
| `MiniMap` / `Controls` | 画布内部 | 生产给 MiniMap 可读名称 |
| `nodeTypes` | 未自定义 | 对象必须稳定，放模块顶层；组件 `memo` |
| `useStore(selector)` | 未用 | 不要订阅整份 nodes 来画一个侧栏 |
| `parentId`、`measured` | v12 字段 | 迁移时不要再写 `parentNode` 或 `node.width` |

不可变更新：改标签时新建 node 和 `data`，不要 `node.data.label = text`。v12 靠引用变化跳过渲染。[performance](https://reactflow.dev/learn/advanced-use/performance)。

## 反例

只调用 `addEdge`：

```tsx
// 错：自环、重复和环都能进去
const onConnect = (connection: Connection) => {
  setEdges((edges) => addEdge(connection, edges));
};

// 对：与 Lab 相同，对当前队列复检
const onConnect = (connection: Connection) => {
  setEdges((current) =>
    validateConnection(nodes, current, connection.source, connection.target).valid
      ? addEdge(connection, current)
      : current,
  );
};
```

| 错误 | 正确 |
|---|---|
| `import ReactFlow from 'reactflow'` | `import { ReactFlow } from '@xyflow/react'`，CSS 用 `/dist/style.css` |
| 父级高度 0 | 明确像素高度。Lab 是 370 |
| render 里 `nodeTypes={{ stage: View }}` | 模块级常量 |
| 原地改 `data.label` | 新对象 |
| 只信前端校验 | 服务端重复 parse：版本、id、端点、环、大小 |
| 持久化 `dragging` / `measured` | 白名单字段加 schemaVersion |
| 用 `position` 当鼠标坐标 | `screenToFlowPosition` |
| `useNodes()` 取全量做属性面板 | 细 selector |
| abort 了就当 PUT 没发生 | 再 GET revision。取消不等于回滚 |
| 在节点输入框上不设 `nodrag` / `nopan` | 否则拖拽和 IME 抢事件 |
| 改了 Handle 数量却不通知 | `useUpdateNodeInternals` |
| 关掉所有键盘来避免 Delete 冲突 | 调 `deleteKeyCode`，保留焦点 |
| SSR 零配置连线 | 需要节点宽高或客户端测量。[SSR](https://reactflow.dev/learn/advanced-use/ssr-ssg-configuration) |

## 性能、安全、无障碍

节点里嵌整张图表、很深的 DOM、很长的 SVG 路径，都会掉帧。官方文档没有「几万节点一定流畅」的承诺。Lab 没有节点上限；研究稿 demo 曾限 200/400，那是应用策略，不是库限制。生产要自己封顶。

公网编辑器需要身份、对象级授权、审计和持久库。本示例只在浏览器内存里改数组。

`Controls` 和表按钮是可聚焦的。画布拖拽不能代替读屏。`prefers-reduced-motion` 盖不住库内部全部动画，要在浏览器里再看。导出图片通常靠单独的截图方案，并检查字体和外链；React Flow 不会把业务 JSON 和 PNG 合成一件事。

## 组合

**React Flow + TanStack Query + Zod + Zustand。** Query 做 GET/PUT 和 409；Zod 校验文档；Zustand 只放草稿和 UI，不复制服务器事实。Lab 没有这三份依赖。

**React Flow + ELK。** 布局放 Worker，搜索用单独索引。自动布局不要悄悄覆盖用户刚拖过的坐标。

**React Flow + ECharts。** 耗时图放在侧栏，数据来自 API。节点拖动时不要在每个 Node 里 `new` 图表；卸载 `dispose`。

## 生产清单

1. 包名 `@xyflow/react`，CSS 已引入，容器高度大于 0。
2. 节点和边受控，重置时深拷贝。
3. 连接规则在拖线和提交时各跑一次，服务端再跑。
4. 删节点必删边。
5. id 稳定，不把下标当 id。
6. 不持久化瞬时字段和函数。
7. `nodeTypes` 引用稳定。
8. 画布外的键盘路径和表同步。
9. 中文输入不在组合态提交。
10. 卸载不留下过期 PUT。

## 升级与练习

**v11 → v12。** 换包和 CSS；`parentNode` 改 `parentId`；`onEdgeUpdate` 改 `onReconnect`；宽度读 `node.measured?.width`。[migrate to v12](https://reactflow.dev/learn/troubleshooting/migrate-to-v12)。

**版本冲突。** 两人同时拿 revision 4，先提交的变成 5，后者 409，UI 展示差异，禁止自动覆盖。迟到响应不得覆盖新草稿。

**压力。** 1000 个节点记录拖拽时长和长任务，写上硬件。不要借用别人的 FPS。

## 故障排查

空白：高度、CSS、id 是否齐全。有节点无边：Handle 类型、source/target 是否存在。`nodeTypes` 警告：渲染时新建了对象。拖拽全树重渲染：订阅了整个 nodes。422：前后端规则不一致。409：读服务器修订，不要强写。中文被截断：输入组件被重建，或没挡住 composition。Delete 删掉了输入框的字：`deleteKeyCode` 和焦点范围。

## 官方链接

- [Learn](https://reactflow.dev/learn)
- [12.12.0 更新说明](https://reactflow.dev/whats-new/2026-09-24)
- [API](https://reactflow.dev/api-reference)
- [防环示例](https://reactflow.dev/examples/interaction/prevent-cycles)
- [保存与恢复](https://reactflow.dev/examples/interaction/save-and-restore)
- [性能](https://reactflow.dev/learn/advanced-use/performance)
- [v12 迁移](https://reactflow.dev/learn/troubleshooting/migrate-to-v12)
- [npm @xyflow/react](https://www.npmjs.com/package/@xyflow/react)

## 证据

sdk、build、browser 在 `docs/library-lab/evidence/runs/` 有本条目收据之前为 **NOT_RUN**。`graph-rules` 与 `workflow-preset` 测试只证明纯函数：环、自环、重复、缺端点和拷贝。它们不证明画布、Handle 或 CSS。Actions run `41779873259` 是仓库级 install、typecheck、build、52 个 SDK 文件（153 个测试）和 45 个 Playwright，不是 A06 的 PASS，不要写入 `verification.json`。
