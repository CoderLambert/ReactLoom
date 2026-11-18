# B14 独立内容复核

复核者quality_f05（非作者），2026-11-10；工作区HEAD `1218066e706a90ba03fac8dff8c9b843dd2429c4`，当前未提交条目，原10文件基线见baseline.json。按授权只写本报告；未修改实现、官方原文或公共文件，未重跑作者有效SDK/policy/类型/公共检查，未执行浏览器。

已读AGENTS、library/guide/agent/verification、全部examples/tests、最终local-validation、official两个来源记录与固定原文、版本搜索/匹配依据、metadata/SDK/policy/类型/格式日志，以及主控公共三条@B14浏览器源码。实际API另核安装1.8.1的dist/types/adapter/element-adapter.d.ts、dist/esm/adapter/element-adapter.js和reorder/combine实现。

## 问题与待测范围

没有已确认P1/P2。复核发现的P3说明措辞已由主控同步：formal NOT_RUN与本地utility2/policy12/类型/metadata结果分开，保留真实DND待候选的准确原因；该措辞问题已闭环，无需重复测试。不能因为局部或共享检查通过就改正式PASS。

原生拖动、真实手柄命中、取消/跨实例drop、浏览器卸载清理和真实键盘回退均未由本复核者执行。会话policy通过不证明浏览器实际跑过“拖动中revision变化”的时序；当前公共三条虽覆盖真实原生拖放、固定区间、双scope、撤销与清理，但没有构造该并发时序，也未证明所有设备/读屏场景。

## 六项结论

| 项 | 状态与层级 | 依据 |
| --- | --- | --- |
| 技术准确 | PASS：匹配安装源码/类型与复用utility检查 | example.tsx:43–60真实注册draggable/dropTargetForElements并combine清理，dragHandle为行内真实节点；168–198真实monitor。150–164将ID转当前索引，经固定区间守卫调用SDK reorder。实际SDK reorder复制数组而保留行对象，combine按注册顺序调用detach；作者2项真实utility测试与源码吻合，不是DOM绑定测试。 |
| 解释清楚 | PASS：静态 | guide由频道排序的工程问题展开源/目标/monitor/业务守卫/reorder；区分浅绿目标接受与最终业务许可、自建上下按钮与SDK原生DND、内存revision与服务端并发。三场景操作/预期/关键源均能对应实现，未堆未实现能力。 |
| Demo有用 | NOT_RUN：整体真实浏览器待主控 | 基础三项排序保留隐藏尾部；业务固定行不能成为源/目标或被跨越；高级两个独立真实列表、跨scope拒绝、各自改序及一次撤销。公共三测试使用实际mouse拖动并检查原生dragstart.isTrusted，没有SDK或DataTransfer替身，但尚待匹配候选执行。 |
| 源码可迁移 | PASS：静态/复用类型检查 | 三sourceFiles齐全、局部内联样式、原创数据、无Lab alias/新依赖。行effect按id/lock/scope绑定并返回combine；列表effect按scope绑定monitor并清会话/detach。稳定key保留节点，ref供长期回调读取最新数组与重排函数；未在模块级注册或清除其它实例。 |
| 官方来源可靠 | PASS：版本依据/字节/响应复核 | 固定官方commit `1287861b7c77439f906dc108c21f6236b34c8f53`的core manifest声明1.8.1，实际安装同为1.8.1/Apache-2.0。npm无gitHead/tag时的版本搜索和匹配局限明确，没有冒称精确发布构建commit。完整tree未截断，14个README候选无中文。目标原文实算216B、SHA256 `bd43a66cfa1697781045dae0873d9fa77ac34ef31e6ecb5fba8583eb23a3e4e2`与metadata/原始GET相同。 |
| 结果可复核 | NOT_RUN：整体交互；局部证据明确 | 真实utility2与policy12原始汇总无fail/skip，类型/格式/metadata日志与cwd/命令保留；初次SDK/policy/type采用顺序shell、没有逐项exit manifest的边界在local-validation坦诚记录。正式三项仍NOT_RUN，不能把工具函数、策略或共享build当原生DOM运行通过。 |

## 实现边界核对

- **隔离与业务约束**：source.data包含scope/type/id，目标canDrop与monitor.canMonitor分别过滤来源；onDrop再验证目标scope/type。两个SortableBoard各有useId、数组、refs和monitor（example.tsx:118–128、276–282），没有以复制文字冒充第二实例。pinned-order.ts对源、目标及整个闭区间的locked/fixed都拒绝，按钮与拖放复用它。
- **会话与撤销**：onDragStart记录activeId/revision/level；onDrop先消耗当前会话再校验。commit递增revision并清会话，no-op不新建undo点；undo/重置及level变化使旧会话失效。一次undo后清除快照。basic将重排前三项与all.slice(3)拼回，data-all-order展示完整真实内存数组，没有丢失隐藏尾部。
- **清理与所有权**：实际SDK draggable返回聚合的adapter usage/registry/draggable属性清理，且包装once；应用只调用自己得到的detach。列表monitor和行源/目标各自清理，不重置全局adapter。浏览器旧行draggable属性清除/重挂仍需实际运行。
- **官网状态**：原始GET200只有81B响应，记录长度/hash与完整头；强制CSP该次为空、无XFO，`Content-Security-Policy-Report-Only`里的frame-ancestors none不等于强制阻断。没有Lab-origin浏览器确认，unknown准确；不从200或iframe load推导allowed。

## 官方入口与后续

[固定官方原文](https://github.com/atlassian/pragmatic-drag-and-drop/blob/1287861b7c77439f906dc108c21f6236b34c8f53/packages/core/README.md)仅是目标包的简短原README，API准确性以实际安装类型/源码为依据。official/source-audit.json、validation/matched-source.json记录匹配版本和公开来源过程，初始失败证据保留。

主控下一匹配候选运行公共quality-remediation-pragmatic.spec.ts的三项及官网展示，再独立记录实际结果。触摸/读屏、虚拟滚动/自动滚动、完整服务端协议、拖动中并发revision时序仍未验收。本报告不改formal verification，不提前记content_done。
