# B22 独立复核（root，非作者）

2026-11-10；读取实际源码、guide/agent、官方快照/元数据、SDK源码审计、局部日志及完整浏览器提案。未修改业务源码，未重跑有效SDK2/policy17；公共集成测试由root收口。没有确认的P1/P2，动态项待实际浏览器后闭环。

| 六项 | 复核状态与证据 |
| --- | --- |
| 技术准确 | 静态PASS；实际运行包@hello-pangea/dnd18.0.1，旧react-beautiful-dnd13.1.1只历史对照，peer/弃用/归档分开，Apache-2.0正确；SSR2只证明标签/context身份。 |
| 解释清楚 | 静态PASS；频道顺序→context/列表/手柄→回调/事务，三目标各有明确操作结果；FLUID/SNAP并非设备检测，JSON标注区分SDK读数/应用注记。 |
| Demo有用 | NOT_RUN浏览器；提案真实鼠标/键盘/占位/固定槽/取消/undo/过期刷新；程序化业务刷新夹具已明确标注，不伪造SDKDropResult。 |
| 源码可迁移 | 静态PASS；四源无Lab alias；真实innerRef/props/style/placeholder；SDK拖动style含boxSizing:border-box，未被应用覆盖；手柄与按钮分离；context按level重挂。 |
| 官方来源可靠 | 原文/元数据PASS；替代npm固定commit410173402853654f64436d116d68e3f89359d496及10875B snapshot重算SHA一致；旧原文独立版本/commit，官网unknown与实际头相符，不从200推allowed。 |
| 结果可复核 | 限定局部PASS，整体NOT_RUN；SDK2/policy17严格区分，日志/输入/hash在作者validation；root browser未跑与formal NOT_RUN明确保留。 |

## 关键代码核对

快照在onBeforeDragStart同步建立，延后的onDragStart仅记录receipt，不复活已清空会话。每次真实end先清activeDrag，校droppable身份；最终reducer使用实际state再次校reason/落点/revision/level/全visible ids/source id，然后共用固定区间规则，不只在回调检查闭包。隐藏尾部拼回而非丢失。按钮/undo/reset先失效快照；原序reset增加revision但保留旧撤销点，changed reset可撤销；cancel/同位无新事务。

fixed检查闭区间，源/目的/跨越均挡住；SDKisDragDisabled与控件disabled只是交互第一层。SDK拥有传感器/临时style/公告，应用只清快照；源码审计显示SDK style marshal成对删本context两style，不手工清全站。普通页面props不会覆盖transform。真实active-drag teardown/触摸/读屏/复杂portal未覆盖，不能推广为全场景PASS。

## 待root实际运行

公共e2e/quality-remediation-beautiful-dnd-migration.spec.ts的三目标和官方展示；结果需绑定candidate/dist与原始exit，不把提案类型通过写成browser。现代替代运行即便通过也不增加旧库SDK PASS。


## 候选15交互元素过滤修复的独立增量复核（quality_e11，非作者）

时间 2026-11-10T15:48:05.929761+00:00。只读核对产品、guide 与实装 @hello-pangea/dnd18.0.1 类型/分发源码；未修改产品或复跑已有 SDK/policy。候选15三个真实 case 无法提起是 root 已确认的运行失败，原报告的静态无阻断不覆盖该运行结果。

**原 P2 静态已修，无新增 P1/P2。** examples/example.tsx:128 的 Draggable 现在显式传 disableInteractiveElementBlocking；真正 button 手柄独占 dragHandleProps（:144），同行的上下按钮位于手柄外且没有该属性（:155/:163）。fixed 仍同时 isDragDisabled 和按钮 disabled，没有解除固定频道业务门禁。

匹配安装类型 dist/dnd.d.ts:221 声明该可选 bool；dist/dnd.esm.js:6626 把它转换为 canDragInteractiveElements。:5603 的默认交互标签集合含 button，:5791 的过滤会拒绝真实手柄启动；新配置仅跳过这一过滤。:5663–5685 仍先沿 target 的祖先寻找当前 context 的 drag-handle 标记，不会因开关给相邻未标记的按钮凭空赋予手柄身份。guide.md:30 最小代码与 :93 所有权说明同步，保留“应用按钮回退不伪造 SDK 回调”的分工。

运行结论保持 **NOT_RUN（补丁后的浏览器）**：应沿用完全相同的真实鼠标/Space提起、业务固定槽、取消/撤销与过期快照断言，在候选16复验；不改期望绕过失败。未运行原归档 SDK。源 SHA：94bb48bb01fdeeeaceb3dacc573a9108e9b886be021655e940ff3a6912a9053d；guide SHA：0f605836ecaeca34c1c6a0e3ea0464f0ca3984eab76770936d13aab5692de1d6。
