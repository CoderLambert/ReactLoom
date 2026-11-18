# React Flow：从两节点图到可发布的审批工作台

要让用户拖动节点、从端口连线、缩放查看流程，并用React组件定义节点内容，可以选择React Flow。它提供图的交互和渲染；你的应用负责保存什么数据、哪些连接合法，以及流程是否真正执行。静态流程说明可比较Mermaid，关系网络分析可比较G6，自由白板可比较tldraw；不必为一张只读图片引入完整编辑器。

本条目固定 `@xyflow/react@12.12.0`，先在basic操作一个两节点小图，再进入原有完整审批工作台。business和advanced继续保留表单、条件分支、发布快照与工单流转。React Flow没有自动提供审批引擎，`approval-runtime.ts`是本例自建的受限TypeScript执行器，没有外部服务或脚本执行。

## 先理解nodes、edges和受控更新

| 概念 | 小图中的真实数据 | 谁改变它 |
| --- | --- | --- |
| node | `{ id: 'source', position: { x: 0, y: 40 }, data: { label: '订阅源', ... } }` | React状态保存；拖动产生position变更 |
| edge | `{ source: 'source', target: 'target', sourceHandle: 'out', targetHandle: 'in' }` | 连接事件经校验后加入edges状态 |
| Handle | 自定义节点上的命名入口/出口 | 通过`type`区分source/target，用`id`匹配edge |
| viewport | 平移和zoom；决定屏幕上怎样看图 | React Flow管理视口；缩放不改node.position |
| change | 拖动、选择、测量等增量描述 | `onNodesChange`交回应用，应用更新受控数组 |

`nodes`和`edges`传给`ReactFlow`后，就是画布显示的数据源。用户拖动时库会发出change；如果只传数组却不处理change，受控状态不会按预期跟着交互更新。`useNodesState`把React状态和调用`applyNodeChanges(changes, current)`的回调组合好；`useEdgesState`为edges提供同样的能力。数据更新采用新对象，不原地修改旧node。

### 对应实际小图的接线

源码在 [flow-primer.tsx](examples/flow-primer.tsx)，下面选出同一实现的核心调用；初始数据和自定义节点在该原文件中。

```tsx
const [nodes, setNodes, onNodesChange] = useNodesState<PrimerNode>(createNodes())
const [edges, setEdges, onEdgesChange] = useEdgesState(createEdges())
const connect = useCallback((connection: Connection) => {
  if (validConnection(connection)) {
    setEdges((current) => addEdge(connection, current))
  }
}, [setEdges])

<ReactFlow
  nodes={nodes}
  edges={edges}
  nodeTypes={nodeTypes}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={connect}
/>
```

`addEdge`只负责把有效端点组合加进edge数组，并处理相同端点/端口连接的重复；它不保存数据、不执行节点，也不替业务判断DAG、审批角色或条件。两节点练习只允许`source.out → target.in`，这是本练习的约束，库本身不限两节点。完整工作台另外使用`connectionError`检查拓扑与业务端口。

自定义节点中的真实端口是`<Handle id="out" type="source" position={Position.Right} />`与`<Handle id="in" type="target" position={Position.Left} />`。edge的source/target是**节点id**，sourceHandle/targetHandle是**端口id**，不能把节点名称当id。`nodeTypes`在模块作用域保持稳定；容器有明确宽度和300px高度，并导入`@xyflow/react/dist/style.css`。本例保留默认署名，使用MIT开源核心，不复制Pro付费示例或资源。

node.position使用图坐标，默认以节点左上角为原点。缩放后鼠标移动20个屏幕像素，并不等于图坐标增加20；要将外部拖放/点击的client坐标用于新增节点，应使用`screenToFlowPosition`转换。本练习没有实现外部拖放，拖动节点的坐标转换由SDK完成，不手动减画布偏移。

## basic：先操作两节点，再进入线性审批

打开basic场景，顶部“React Flow 图编辑入门”与下面原线性审批工作台独立。

1. 拖动“订阅源”，对照右侧source坐标和“查看同一份nodes / edges JSON”。或者点“源节点向右移动40”，让受控position驱动画布移动。
2. 修改“源节点名称”，观察自定义节点和JSON中的data.label同步变化，节点id不变。
3. 点“清空入门连线”，从source右侧out真实拖到target左侧in；观察连线数从0变1及JSON中的端口id。也可用“连接source → target”按钮走同一个连接回调。
4. 用Controls缩放/平移，核对视口变化不改position。点“重置入门图”恢复原节点/边和视口；离开后重挂也恢复初始图。
5. 向下继续原线性工作台：配置表单→发布→填写申请→经理审批。这一入口没有被小图替代。

入门图只保存当前组件内存，不写localStorage，不执行订阅处理。JSON白名单只展示id/type/position/data及edge端点/端口，不混入measured、selected等瞬时UI字段。两个画布有独立实例，小图的清空和重置不改变审批草稿、已发布版本或工单。

## 快速体验

仓库根目录执行：

```sh
pnpm --filter @reactloom/library-lab dev
```

打开 `http://127.0.0.1:4319/libraries/react-flow?tab=demo&example=business`。先点「发布流程」，再到「填写申请」。

1. 提交金额 200 的申请。在工单中心以「直属经理」通过，工单完成。
2. 提交金额 5000 的申请。经理通过后进入「财务」，切换角色后再通过。
3. 再提一张申请，输入意见并驳回，查看历史原因。
4. 修改草稿的审批角色，再发布 v2。v1 工单仍按 v1 的角色审批，新申请才使用 v2。
5. 保存工作区并刷新，已保存的草稿、最新发布版本、工单及记录会恢复。

数据只在当前浏览器、当前 origin 的独立 localStorage key 中。角色切换是演示操作，不是身份鉴权。停止 Demo 会卸载 UI，但不会清除已保存数据。basic/business/advanced 存储分离；未保存的草稿在离开或重置示例后丢失。不要填真实个人或财务信息。

## 三个学习层级

|层级|初始配置|重点|
|---|---|---|
|basic|两节点独立练习；原开始 → 经理 → 结束仍保留|nodes/edges受控更新、坐标/Handle，再做线性审批|
|business|经理 → 金额判断 → 财务或完成|条件分支、审批人、通过/驳回、历史|
|advanced|与业务层相同，开放 JSON 迁移|导入导出、版本隔离、无效配置校验|

审批工作台的三个层级共享真实配置与执行代码；basic上方的两节点练习独立，只教图编辑。不是预录动画，也不是按按钮假装改变几段状态文字。条件值、表单字段和连线改变后，发布出的行为随配置改变。

## 从配置到运行

```text
草稿 Definition ──校验/发布──> Release vN
                                  │
                           生成表单 / 校验输入
                                  │
                                  ▼
                         Request（复制 vN 快照）
                                  │
                       自动节点与条件 / 人工审批
                                  │
                          通过、待审批或驳回
```

`Definition` 是唯一业务配置。字段、节点、边都在里面。React Flow 的选择、测量和拖动标记不进入业务 JSON。`Release` 有版本、发布时间和独立配置快照。每个 `Request` 复制提交时的 Release 和表单值，不去读取最新草稿；后续发布不会改写在途工单。

## 源码分工

|文件|职责|
|---|---|
|examples/demo.tsx / example.tsx|Lab 的 `{level}` 适配出口；basic加入入门小图，三层原工作台继续保留|
|examples/flow-primer.tsx / flow-primer.css|独立两节点受控图，真实命名Handle、图数据检查器和重置；不持久化|
|examples/approval-workbench.tsx|配置、申请、工单页面；事务式本地保存|
|examples/approval-designer.tsx|真实 React Flow 自定义节点、Handle、连线与属性编辑|
|examples/approval-model.ts|定义类型、结构解析、发布校验和初始配置|
|examples/approval-runtime.ts|字段校验、条件执行、人工动作、确定性历史重放|
|examples/approval-storage.ts|有界工作区恢复，复核工单决策顺序|
|examples/approval-workbench.css|以 lc-app 为作用域的布局和样式|
|examples/graph-rules.ts|无 SDK 依赖的端点、自环、重复和有向环检查|

只迁移最小图时复制flow-primer.tsx和flow-primer.css、安装固定SDK即可；不需要审批引擎或Lab内部模块。迁移完整工作台时复制其表中业务模块与样式并安装条目所列SDK；示例不导入主站内部组件。现有 `workflow-preset.ts` 与对应测试是旧两节点示例的兼容辅助材料，当前工作台不再使用它。

## 表单配置

支持文本、数值、单选。字段标识稳定，修改名称不会断开条件引用。单选选项用逗号分隔；导入规范化首尾空白，发布时拒绝空选项和规范化后重复的选项。数值非负、有限且不超过 10¹²；文本最多 2000 字符。必填校验在 HTML 表单和运行时都有，不只依赖浏览器。

条件仅支持「必填数值字段 ≥ 阈值」。这是有意受限的表达式白名单，不使用 `eval` / `Function`。删掉被条件引用的字段、改成文本或取消必填时，发布校验会失败，要求重新指定条件。

## 节点和端口

模块级 `nodeTypes` 保持引用稳定。自定义 Node 使用命名 Handle：

- 开始：一个 next 出口，没有入口。
- 审批：in 入口，next 出口；通过沿 next，驳回直接终止。
- 条件：in 入口、yes/no 出口；两个出口都必须连接。
- 结束：in 入口，没有出口。

画布高 460px，小屏 380px，支持拖动、缩放、Controls、MiniMap。点击节点配置名称、角色、比较字段和阈值。也可用键盘节点清单、起点/出口/终点选择框完成相同操作。为避免输入编辑与 Delete 冲突，禁用画布 Delete 快捷键，通过明确的删除按钮操作；开始和结束节点不可删除。

每个出口只允许一条边；先删除旧边，再接新边。缺端点、未知节点、自环、重复 source→target、有向环、开始入边和结束出边都被拒绝。当前策略不允许 yes/no 两条边直连同一目标；可使用独立业务步骤。删除节点同步删除所有关联边。

发布必须满足唯一起止、标识不重复、所有节点可达、所有出口完整、审批角色非空以及条件字段有效。有限 DAG 加完整出口保证路径最终到达结束。编辑时允许暂时断链；断链草稿可保存，但不能发布或导出为有效运行配置。

## 执行与审批

`submitRequest` 再校验发布定义与表单值，复制快照并产生新工单。`inspectRequest` 从开始节点重放已记录决策，自动执行条件，遇到待审批节点停止。每次最多遍历节点数加一，不能无限循环。

`actOnRequest` 要求 expectedNodeId 与当前节点相同，actor 与该节点角色相同。错误角色、过期节点、重复决策和终态操作被拒绝。审批意见最多 500 字符。历史包含提交、人工处理、条件选路和完成；节点文字只作为 React 文本显示。

这是本地单浏览器执行。保存前比较已读取的存储内容，发现其他标签页已更新时拒绝旧状态覆盖，保留内存草稿并提示重新载入；这不是数据库事务，仍不提供跨设备或严格多标签页并发审批保证。UI 的发布、申请和审批先验证并保存完整工作区，再展示成功；存储配额或权限失败时保留原内存状态并提示错误，不显示虚假的已保存结果。

## JSON 和持久化边界

advanced 可将配置导出到文本框，或粘贴配置导入。导入只替换草稿；不发布、不清空工单。结构或图校验失败时保留原草稿。JSON 不接受未知字段（包括脚本）、函数或 React Flow 瞬时字段。

限制：12 个字段、24 个节点、48 条边、每个单选 12 个选项；配置 JSON 最多 200,000 个 UTF-16 code units，工作区 JSON 最多 2,000,000，50 张工单。界面 KB/MB 为近似说明，不是网络字节配额。恢复时复核每份工单的定义、输入及审批顺序，损坏数据不会悄悄当成通过。

这是 schemaVersion=1；不支持自动升级未知版本。保存覆盖本层级独立 key，不调用 localStorage.clear，不触碰其他示例数据。

## 接入真实生产系统

本项目可以学习和迁移，但本地角色选择不具备权限意义。上线需将发布、提交、审批和历史存储移到服务端：

1. 服务端重复执行 schema 和拓扑校验，使用数据库中的不可变发布版本。
2. 审批角色来自真实登录和对象级授权，不能相信客户端传来的 actor。
3. 通过 expectedNodeId、revision 和幂等键在数据库事务中更新；冲突返回 409。
4. 历史由服务端生成可信时间和身份，建立审计及保留策略。
5. 客户端用 `@reactloom/api-client` 和 TanStack Query 处理请求、取消及错误；取消不意味着服务端回滚。

当前未实现多租户、会签、附件、撤回、抄送、通知、外部请求节点或并行网关。多个入口是互斥分支汇合，不是等待全部输入完成的并行 join。不要将受限表达式升级为任意代码执行端点。

## 验证与证据

```sh
pnpm exec node --test packages/library-lab/entries/A06-react-flow/tests/*.test.mts
pnpm --filter @reactloom/library-lab typecheck
pnpm --filter @reactloom/library-lab build
pnpm --filter @reactloom/library-lab test:e2e --grep '@A06'
```

策略测试验证规则和流转；Playwright `@A06` 真实挂载 React Flow 并操作页面。两者分开报告。正式 `verification.json` 的 PASS 仍需要 `verify:record` 的匹配收据；本地日志和旧仓库 Actions 不能替代收据，也不能证明生产鉴权、后端或移动端验收。

## 官方原文与官网

官方README原文保存在 [official/readme.md](official/readme.md)，选自`xyflow/xyflow`的目标包`packages/react/README.md`，固定于`@xyflow/react@12.12.0`解引用提交`3d35b57317576b0916c0bfeaaedd573aaacc2839`，英文原文，保留上游字节与署名。实际核对该提交根目录和packages/react清单，未发现官方中文README候选。tag、下载响应、语言与摘要见official/source-evidence.json和library.json。

[官网](https://reactflow.dev/)本轮GET200，未见X-Frame-Options/CSP frame-ancestors限制；尚未从实际Lab origin用浏览器核实嵌入，所以状态保持unknown，保留直达入口。新入门交互的当轮验收状态见 [local-validation.md](local-validation.md)；2026-11-09原工作台的20策略/5浏览器历史本地证据仍保留，不能直接替代新增小图的浏览器验证。正式verification仍分别NOT_RUN。

## 官方参考

- [自定义节点](https://reactflow.dev/learn/customization/custom-nodes)
- [Handle](https://reactflow.dev/learn/customization/handles)
- [受控状态](https://reactflow.dev/api-reference/hooks/use-nodes-state)
- [连接校验](https://reactflow.dev/examples/interaction/validation)
- [保存与恢复](https://reactflow.dev/examples/interaction/save-and-restore)
- [性能](https://reactflow.dev/learn/advanced-use/performance)
