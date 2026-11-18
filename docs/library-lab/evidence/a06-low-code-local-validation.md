# A06 低代码表单审批本地验证（2026-11-09）

范围：A06 React Flow 条目及新增 `e2e/a06-approval.spec.ts`；任务分支 `feat/a06-low-code-approval`，基线 `1218066`。这是未提交工作树的本地执行记录，不是 verify:record 收据，不覆盖其他条目或生产服务。

|检查|实际命令|结果|
|---|---|---|
|原始索引基线|`pnpm --filter @reactloom/library-lab catalog:index`|修改前 exit 0，119 项一致|
|条目策略与兼容回归|`pnpm exec node --test packages/library-lab/entries/A06-react-flow/tests/*.test.mts`|exit 0，20/20|
|新源码、样式、测试及元数据|`pnpm exec biome check packages/library-lab/entries/A06-react-flow/examples/approval-*.ts packages/library-lab/entries/A06-react-flow/examples/approval-*.tsx packages/library-lab/entries/A06-react-flow/examples/approval-workbench.css packages/library-lab/entries/A06-react-flow/examples/example.tsx packages/library-lab/entries/A06-react-flow/tests/approval.test.mts packages/library-lab/e2e/a06-approval.spec.ts packages/library-lab/entries/A06-react-flow/library.json`|exit 0，10 文件，无新诊断|
|Lab lint|`pnpm --filter @reactloom/library-lab lint`|exit 0，既有公共代码 11 warnings、76 infos；未改动这些文件|
|Lab 类型|`pnpm --filter @reactloom/library-lab typecheck`|exit 0|
|完整 Lab 及 runner 构建|`pnpm --filter @reactloom/library-lab build`|exit 0|
|生产预览浏览器|`LAB_PREBUILT=1 pnpm --filter @reactloom/library-lab test:e2e --grep '@A06'`|exit 0，5/5，通过真实产物和 SDK，无路由/SDK mock|
|目录静态契约|`pnpm --filter @reactloom/library-lab catalog:check`|exit 0，119 条目、162 包引用一致|

浏览器覆盖：配置字段改变实际表单；大小额流转；经理/财务角色；驳回及意见；发布快照隔离；刷新恢复；自环拒绝；删除节点清边及发布失败；坏 JSON 保留当前配置；阈值修改改变实际选路；旧标签保存冲突拒绝覆盖；真实节点鼠标拖动与 Handle 重连；390px 无水平溢出；停止卸载。

桌面配置、工单与移动截图在忽略目录 `packages/library-lab/.local-evidence/a06/{designer,request,mobile}.png`，已查看。浏览器原始输出 `/tmp/a06-browser-production.log`，类型/构建/规则/静态检查分别为 `/tmp/a06-{typecheck,build,policy,biome,catalog,lint}.log`；这些本机临时文件不作为持久收据。

独立评审两个问题已有失败复现并修复：保存前比较加载时的原始存储内容，阻止旧标签覆盖；导入规范化单选选项并拒绝规范化后的重复。存储比较不是数据库 CAS，不承诺严格并发安全。

NOT_RUN：正式 `verify:record` 收据（要求已提交且干净的运行输入）；A06 独立 Node SDK 套件；其他 118 条目的全量回归；生产后端、真实身份/权限、跨设备并发与部署。UI 顶部机器验收保持 NOT_RUN；这与上述明确列出的本地通过结果不是同一层证据。
