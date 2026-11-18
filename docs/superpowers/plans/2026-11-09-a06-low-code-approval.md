# React Flow 表单审批低代码实现计划

> 执行方式：本 session 按 executing-plans 与 test-driven-development 顺序实现，最后独立评审。用户已确认场景，连续执行。

**Goal:** A06 配置可发布的表单与审批流程，实际提交、处理和恢复本地工单。

**Architecture:** 条目内独立 schema/运行时/存储、配置器和动态表单工单界面。发布和工单均持有不可变定义快照。

**Tech Stack:** React、@xyflow/react 12.12.0、TypeScript、Node test、Playwright；不新增依赖。

**Spec:** docs/superpowers/specs/2026-11-09-a06-low-code-approval-design.md

## Global constraints

仅修改 A06 及必要 e2e、生成索引/文档。生产模板不受影响。无任意脚本执行，无外部服务，无虚假验证收据。不自动提交推送。

## Review focus

非法 JSON/存储损坏拒绝替换现有状态；条件分支必须完整；同节点重复点击不重复流转；旧工单使用旧定义；存储配额错误可见。

### Task 1: 定义与执行引擎

Files: `entries/A06-react-flow/examples/approval-model.ts`, `approval-runtime.ts`, `approval-storage.ts` (相对 packages/library-lab)；`tests/approval.test.mts`。

接口：createDefinition(level)、validateDefinition、parseDefinition、publishDefinition；submitRequest、actOnRequest；parseWorkspace、saveWorkspace/loadWorkspace。测试先 RED，执行规则实现后 GREEN。

- [x] 覆盖断链、环、错误条件、非法 JSON，必填与有限数值，大小额、驳回、错误角色、重复审批、快照隔离、持久化。
- [x] `pnpm exec node --test packages/library-lab/entries/A06-react-flow/tests/*.test.mts` 通过。

### Task 2: 实际配置器与业务操作

Files: `examples/approval-designer.tsx`, `approval-workbench.tsx`, `approval-workbench.css`, `example.tsx`；`e2e/a06-approval.spec.ts`。

消费 Task 1 定义、发布/运行接口；UI 不实现第二套审批规则。用 applyNodeChanges/applyEdgeChanges 保持单一图状态；自定义节点用稳定 nodeTypes。E2E 先 RED，再接 UI。

- [x] 配置字段、节点、键盘和 Handle 连线、图属性、保存/发布、导入导出。
- [x] 动态申请页、角色审批、历史、刷新恢复，发布及实例隔离。
- [x] 定向 Playwright @A06、Biome、Lab typecheck/build。

### Task 3: 教学文档与最终验证

Files: A06 library.json、guide.md、agent.md、verification.json 及生成目录。

- [x] 元数据列全必要源码，文档说明实际能力与本地/生产边界。
- [x] 独立评审执行与导入边界，修复影响使用的问题，重跑受影响检查。
- [x] 记录真实命令、结果和未执行项；不把本地测试冒充正式收据。

## 执行记录

任务完成于当前任务分支，未提交或推送。实现先以 Node 策略测试观察缺少模块的失败，再实现规则；UI 用例先观察工作台未挂载的失败。独立只读评审发现旧标签覆盖和导入选项空白两个问题，各自用失败测试复现后修复。最终 20 项条目测试、5 项生产预览浏览器用例、类型与构建通过。

Ruling: 用户已确认明确场景后直接连续实现，在干净任务分支原地修改，复用已安装依赖；不创建额外 worktree、不自动提交或推送。收据命令要求干净已提交输入，因此机器状态保留 NOT_RUN，本地证据单独报告。
