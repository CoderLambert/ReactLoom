# A06 React Flow — 表单审批工程手册

## 适用与版本

`@xyflow/react@12.12.0` 和 `@xyflow/react/dist/style.css`。使用 v12 命名导入；不混用 v11 reactflow。适合节点式低代码业务编排；自由白板用 A09/A10，关系分析用 A07，静态说明用 A08。默认保留署名。

## 最小图先看什么

首次接触库先读guide的nodes/edges/Handle/viewport说明及examples/flow-primer.tsx。该独立小图用真实useNodesState/useEdgesState处理受控change，用addEdge接入source.out→target.in。拖动或“向右移动40”改变node.position；修改名称改变data.label；清空/真实Handle重连改变edges。数据检查器读取同份状态，不是另写展示数据。nodeTypes模块级稳定，画布高300px，独立ReactFlow id防止与下方工作台共用UI描述id；保留CSS与默认署名。

迁移小图只复制flow-primer.tsx和flow-primer.css，固定@xyflow/react12.12.0。它不持久化、不执行节点、没有自建监听/定时器；重置重建受控数组并重挂视口，离开组件交SDK清理。不要为这个示例新增无关审批引擎依赖。若使用Tailwind CSS v4，按官方文档将React Flow主样式在全局Tailwind之后导入。

## 当前真实实现

读取 library.json、examples/approval-model.ts、approval-runtime.ts、approval-storage.ts、approval-designer.tsx、approval-workbench.tsx 及 verification.json。demo.tsx → example.tsx；basic先挂FlowPrimer再挂原ApprovalWorkbench，business/advanced继续挂原工作台。代码独立于 Lab 宿主，可迁移；basic/business/advanced 共用引擎，存储按层隔离。

- Definition 描述字段、节点及端口边。Release 是发布版本快照；Request 复制 Release 与经校验的输入。
- 字段为 text/number/select；条件仅「必填 number >= threshold」，没有 eval、网络或脚本节点。
- stable nodeTypes 与 Handle id in/next/yes/no；固定画布高度，测量/选择只留在 UI，业务 JSON 用白名单字段。
- connectionError 用 graph-rules 的 DAG 检查，并检查端口方向和每出口一边。画布和键盘入口共用。
- 删除节点必须同步移除关联边。发布校验唯一起止、可达、出口完整、字段类型、角色和 id。
- inspectRequest 重放记录，自动前进到人工节点或终态；actOnRequest 检查 expectedNodeId 和 actor。
- 发布/提交/审批必须先保存完整工作区，再展示成功；配额/权限错误可见。恢复时重放验证每张工单。

## 不可删的边界

快照必须独立拷贝；修改草稿、发布新版不能重定向在途工单。恢复和导入不能信任 TS 类型：需有界 JSON 解析、严格白名单、实际拓扑/输入校验及动作重放。不能持久化 measured/selected/dragging。不能用 localStorage.clear 清理示例。未知 schemaVersion 拒绝。

上限是应用策略而非 SDK 能力：12 字段、24 节点、48 边、50 工单、每单选12选项；配置200000/工作区2000000 UTF-16 code units。文本2000、意见500、角色/名称80；数值0..1e12。这里只支持互斥条件汇合，不支持并行 join。

## 反例

```ts
// 错：运行时读取会变化的草稿
const role = workspace.draft.nodes.find(n => n.id === request.currentNodeId);
// 对：引擎只读取 request.release.definition
const state = inspectRequest(request);
```

不要只 addEdge 而跳过连接规则；不要用 UI 禁用按钮替代 actOnRequest 校验；不要修改已发布配置对象；不要在节点 data 中保存函数；不要用组件状态数字伪装真实 SDK 渲染结果。

## 验证

`tests/approval.test.mts` 是真实策略测试，不是 SDK 测试。旧 graph-rules/workflow-preset 测试不渲染画布。`e2e/a06-approval.spec.ts` 的 @A06 通过真实页面检查节点挂载、配置驱动表单、两分支、角色、驳回、版本隔离、恢复、非法连接和删除。仅按实际结果报告；没有 verify:record 收据时 verification.json 不写 PASS。

## 生产限制

当前是浏览器本地项目，角色切换仅演示，不是鉴权或可信审计；不提供多标签页/多设备并发保证。上线需要服务端身份授权、schema/拓扑重复校验、数据库不可变版本、事务、revision/409 和幂等键。没有会签、通知、撤回、外部API执行或脚本。不得把本地通过描述为已部署生产系统。


## 当轮质量证据

官方原文固定包README packages/react/README.md@3d35b57317576b0916c0bfeaaedd573aaacc2839（12.12.0），实际核对根/包目录只有英文README；见official/readme.md与source-evidence.json。官网只做HTTP头观察，未经Lab-origin浏览器确认所以unknown。新增小图交互需真实浏览器验证，不能用SDK工具函数的Node单测或历史审批工作台PASS代替；本轮状态见local-validation.md。
