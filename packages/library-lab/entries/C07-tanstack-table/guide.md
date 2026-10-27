# C07 TanStack Table v9：数据所有权与 Headless 表格

本条目选用 **@tanstack/react-table@9.2.4**，MIT；与旧 v8 的 `useReactTable/getSortedRowModel` API 有明显差异。**不要把最新版 v9 文档和 v8 示例混写**。当前主站采用 React 19，业务数据为本地固定 RSS fixture。安装：`pnpm add @tanstack/react-table@9.2.4`。

## 源文件及 v9 API

运行、展示与代码引用同源：`examples/example.tsx`，`examples/demo.tsx` 只重导出。v9 使用 `tableFeatures({ rowSortingFeature, rowPaginationFeature, rowSelectionFeature, sortedRowModel:createSortedRowModel(), paginatedRowModel:createPaginatedRowModel() })` 和 `useTable({features,columns,data,...})`，用 `table.FlexRender` 输出 header/cell。

## 三层实战

### 入门：业务行 ID

在固定 RSS 列表上排序并选择行，`getRowId: row => row.id` 必需。不能用索引作为持久 ID：排序、筛选、翻页后选择会错位。保持 `rowSelection` 独立状态，筛选变化不要覆盖跨页 ID。

### 业务：本地筛选 + 排序 + 分页

所有已知行在浏览器内：开启 v9 的 `createSortedRowModel/createPaginatedRowModel`；搜索提交而不是输入法组合期间乱跳；筛选改变重置 pageIndex。表格是 Headless，只计算行模型，不负责可访问 DOM 布局：实际用语义化 table/caption/th/td 与可操作按钮。

### 进阶：服务端数据所有权

`manualPagination/manualSorting` 告诉 Table **不要**在已分页的数据上再次排序分页。服务器必须返回当前页行和完整匹配的 rowCount；排序、筛选、页号和 pageSize 全部进入查询身份。示例 `fetchLocalPage` 使用延迟的本地 fixture 模拟服务端，绑定 AbortSignal 和递增的 sequence，在快速翻页/排序时旧结果不能回写。故意模拟 503，显示可恢复错误，不能把模拟视为真实 HTTP。

## 关键反例

1. `getRowId` 默认数组 index，排序和选中错位；使用不可变 feed.id。
2. 手动分页场景仍启用客户端排序，最终仅对当前页排序；用 manualSorting 联动后端。
3. `rowSelection` 跨页保留 ID，但从 `getSelectedRowModel()` 读全选实体；它只能看到当前 data，有缺失。根据 ID 集合和后端查询获取全量。
4. 用不稳定 columns/data 引起不必要计算；静态列放模块级，动态数据用明确 state/memo 管理。
5. 输入查询发生变化但 pageIndex 不归零，结果为空；搜索提交后重设页号。
6. 以 Promise 顺序保证新结果获胜，切换分页时旧慢请求覆盖；传入 AbortSignal 并检查 sequence。

## 选型、性能与无障碍

客户端分页适合可装入内存、需要局部交互的数据；数据体积与传输成本较大时选服务端分页。虚拟化减少 DOM 行数，但不减少完整数据装载；可与 C10 TanStack Virtual 组合。C08 AG Grid 更适合复杂成品表格，但许可证（Enterprise）需分别核实。为 th 输出 aria-sort，键盘通过原生 button/input，加载和错误有文本反馈。

## 定向验收

排序/分页后已选业务 ID 不变；改变查询时重置页号；高级模式只向 UI 提供当前页数据；故意 503 显示失败并可恢复；快速两次查询旧响应无回写；卸载时计时器与 abort listener 清理。此源码尚未真实执行 SDK/TS build/Playwright，verification.json 维持 NOT_RUN。

官方：https://tanstack.com/table/latest · https://github.com/TanStack/table

## 后端总数变化及中文输入法（第十一轮加固）

高级场景翻到末页后点「模拟后台缩减到2条」，异步 fixture 返回更新后的 total。通过 `clampPageIndex(pageIndex,pageSize,total)` 校正越界页并重新请求该页，避免将老行误作新查询或长期停留在空的末页。恢复按钮重置服务端 fixture。切换 Demo 层级也重置 pageSize/pageIndex，避免基础模式每页18行泄漏到业务模式。

IME 组合中的 Enter 只确认候选，不应触发搜索；组合结束后才能正常提交。模拟服务端分页与真实 v9 SDK 类型/浏览器渲染是两种不同证据。`node --test packages/library-lab/entries/C07-tanstack-table/tests/page-policy.test.mjs` 仅覆盖不依赖 SDK 的分页政策；SDK/tsc/Chromium 仍待真实运行。
