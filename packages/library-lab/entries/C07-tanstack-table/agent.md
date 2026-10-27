# C07 TanStack Table — Agent v9 工程使用手册

本条目版本为 `@tanstack/react-table@9.2.4`（MIT），**不是 v8**。引入 `useTable` + `tableFeatures` + 独立 feature/rowModel factories；请以 `examples/example.tsx` 为源码合同，`examples/demo.tsx` 仅展示包装。

## 迁移到目标项目时

首先明确数据所有权：客户端全量还是后端分页？无论哪种都定义稳定的 `getRowId: row => row.id`；服务器查询必须以排序、搜索、页码、pageSize 完整标识；不要在后端分页数据上执行本地排序。用户跨页选择仅以 ID 集合保存，不能从当前页表格模型算全量对象。输入法组合期间谨慎处理搜索、页号重置。

## 必保留的处理

- v9 `features: tableFeatures`，不混入 v8 `useReactTable`。
- `manualPagination` 与 `manualSorting` 成对跟随后端能力，同时传入完整 rowCount。
- 请求支持 AbortSignal，sequence 校验防旧响应覆盖；卸载中止计时器/请求。
- 无障碍 table/caption/th scope/aria-sort、操作按钮、状态文本。
- 数据列定义不要在每次渲染不断创建，引起不稳定重算。

## 常见错误

索引 rowId、跨页选择丢失、服务端分页之后又在前端排序、未重设页号、旧慢请求覆盖新结果，以及未向 Agent 说明 v8/v9 API 断层。

## 验证与可信范围

定向测试稳定 rowId/跨页选择、分页排序/搜索、503 恢复、取消竞态、键盘导航。当前仅编写真实 v9 SDK 入口，不代表包已安装、通过 typecheck/build/browser。任何 PASS 需与 sourceFingerprint+命令+日志绑定。

文档：https://tanstack.com/table/latest · https://github.com/TanStack/table

## 加固约束（不可在迁移中删除）

后端分页总数减少时按业务 rowCount 校正 pageIndex；超限后重新请求，而不是仅把页码文本改成1。新查询加载时清除旧页的可见记录，避免旧数据闪现。切换 Demo 模式需重新建立 pageSize 所有权，输入法组合确认的 Enter 不提交搜索。纯策略测试和真实 v9/Chromium 验收分开记录。

## 最终请求所有权补充（第24轮）

- 将 `tableQueryIdentity` 覆盖全部后端分页输入；当前渲染不能读另一个 identity 的旧 rows/total/error。业务换租户时还必须包含租户授权身份并清理外部缓存；本示例仅单租户 fixture。
- `createPageRequestGate` 的 epoch 与 AbortSignal 双重保护不可删：切换排序/页号/筛选/模拟故障先同步 invalidate；真正完成结果必须 `lease.owns()`。A→B→A 的等价 key 仍需拒绝第一次 A 的响应。
- 先做源码与策略核验，再在真实 `@tanstack/react-table@9.2.4` 环境执行 `tests/sdk.test.mjs`，最后完整 TS/Vite/Chromium 验证。策略 PASS 不等于 SDK PASS；不能因为离线 SDK 不可用而删除测试或模拟目标包。
