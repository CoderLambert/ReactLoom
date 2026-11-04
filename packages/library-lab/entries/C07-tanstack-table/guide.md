# TanStack Table 9.2.4｜表头是你的，行身份是业务 ID

Lab 锁定 `@tanstack/react-table@9.2.4`（MIT）。这是 headless 表格状态机。它不请求数据，不输出 `<table>`，也不虚拟化 DOM。v8 的 `useReactTable` 和 `getCoreRowModel()` 不能抄进这份代码。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 调用真实的 `useTable`。`demo.tsx` 只做再导出。18 行 RSS fixture 在组件内，没有 `127.0.0.1:4173` 的 mock 服务。

```ts
const features = tableFeatures({
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortFns: { text: sortFn_text },
})
const helper = createColumnHelper<typeof features, Feed>()
```

- **basic**：18 行都在浏览器里。`getRowId: row => row.id`。排序、选择、`table.FlexRender` 都在。pageSize 18，所以分页控件不出现。
- **business**：本地过滤、排序、分页。搜索在提交时 `trim`。Enter 在 `isComposing`、`keyCode === 229` 或组合结束后 80ms 内被拦住。排序只保留一列（`enableMultiSort: false`）。
- **advanced**：`manualSorting` 和 `manualPagination`。`fetchLocalPage` 是 360ms 的本地延迟，可 `abort`。请求身份由 [`page-policy.mjs`](examples/page-policy.mjs) 的 `tableQueryIdentity` 序列化：页码、页大小、唯一排序、查询、失败开关、服务端条数上限。`createPageRequestGate` 用 epoch 处理 A→B→A：后返回的 A 不能写回已经再次变成 A 的界面。`clampPageIndex` 在总数变少时把页码拉回最后一页，并且**不**把旧页的行提交上去。503 按钮只是 `fail: true`。选中状态按业务 ID 保留；当前页的 `getSelectedRowModel` 不等于全部已选实体。

## 什么时候用

要自己画表格语义、自己决定哪些状态进 URL 或请求的时候用它。需要开箱的过滤弹层、企业分组和图表时看 AG Grid 的 Community / Enterprise 边界。行数大到 DOM 成为问题时加 TanStack Virtual，虚拟化不代替服务端分页。

## 数据与模型

三方所有权：

1. **行数据**在 React state 或 Query 缓存。`data` 只是这一次交给表的快照。
2. **features** 不注册就没有那项能力。核心行模型在 v9 里默认就有，不要再写 `getCoreRowModel()`。
3. **DOM** 由你写。Lab 用了 `<table>`、`<caption>`、`<th scope="col">`、`aria-sort` 和带名字的 checkbox。

客户端模式：表对**已在内存中的全部行**排序再分页。服务端模式：你交给它的 `data` 必须已经是当前页，并且 `manualSorting` / `manualPagination` 打开，同时传入 `rowCount`。只给一页又开客户端排序，会把这一页排完就当成全局顺序。

`row.id` 默认是当前位置。选中 map 的键就是这个 id。翻页后第一行会变成另一条数据。`getRowId` 必须返回全局稳定的业务 ID。

不要同时用 `initialState`、受控 `state` 和 `atoms` 写同一个分页 slice。Lab 只用受控 `state` 加 `onSortingChange` / `onPaginationChange`。

`pageCount = -1` 会让「下一页」一直可点。未知总数时改用服务端的 `hasNextPage`。排序和搜索在 Lab 里会把 `pageIndex` 设为 0。

v9 的行方法依赖 `this`。不要 `const { getValue } = row` 再调用。用 `row.getValue('title')`。渲染用 `table.FlexRender`。

## 三层示例

### 基本

点「订阅数」或标题。`aria-sort` 在 `ascending`、`descending`、`none` 之间变。勾选一行，下面列出 `feed-1xx`。排序之后同一个 ID 仍勾着。列头是 `<button>`，不只是 `th` 的 onClick。

### 业务

输入检索词再点查询。组合中文时按 Enter 不提交。每页 3、5 或 10。空结果有一行「没有匹配的来源」。这里的过滤发生在浏览器里的 18 行上，不要把它讲成远程 API。

### 进阶

先点「模拟后台缩减到 2 条」，若停在后面的页，页码会被夹到合法范围，并且不会短暂把上一页的行当成新总数的结果。点「模拟服务端 503」，状态行出现错误，当前身份对不上时不显示旧错误。快速改排序或页码：旧的 360ms 定时器被 abort，epoch 对不上的结果被丢掉。

「已选中的业务 ID」可以包含不在当前页的 id。不要用当前页模型去做「删除全部搜索结果」。

研究笔记里的 PATCH revision、SQL 白名单和 413 大包不在这个文件里。`tableQueryIdentity` 已经拒绝不在白名单里的 sort id，这是客户端身份，不是数据库参数化。

## 反例

### 1. 省略 getRowId

翻页后选中从 `feed-100` 粘到别的标题上。改为 `getRowId: row => row.id`，并且 ID 不复用。

### 2. 一页数据却用客户端排序

```tsx
useTable({ data: currentPage, features }) // 没有 manualSorting
```

只会排这一页。服务端模式打开 `manualSorting` 和 `manualPagination`，把 `rowCount` 设成筛选后的总数。

### 3. 排序后停在第 9 页

新排序的第 9 页常常是空的。Lab 在 `onSort` 里把 `pageIndex` 设为 0，并 `invalidate`。

### 4. 只 abort 不看 epoch

请求 A 发出、改成 B、又改回 A。A 的第一次响应如果只比较查询字符串，会写进第二次的 A。`createPageRequestGate` 的 epoch 就是为了这个。

### 5. getSelectedRowModel 当全局已选

它只有当前加载的行。批量操作提交 `Object.keys(rowSelection)`，服务端再查权限。

### 6. 三处同时拥有 pagination

`initialState` 和受控 `state` 打架时，按钮和请求各看各的。一个 slice 一个主人。

### 7. v8 API 混进来

`useReactTable is not a function` 或类型对不上时，先确认包是 9.2.4，再换成 `useTable` 和 `tableFeatures`。`createColumnHelper` 需要 features 类型参数。

### 8. sortId 拼进 SQL

即便前端有白名单，服务端仍要参数化。Lab 的白名单只保护本地排序身份。

### 9. 列定义每次渲染换 id

选择和宽度会重置。列数组保持稳定。

### 10. 以为 useTable 会虚拟化一万行

它会创建行模型。DOM 窗口是 C10 的事。分页和虚拟化解决的是不同的成本。

## 组合

**Query + nuqs。** URL 里放 `q`、页码和白名单排序。Query key 用同一份身份。`queryFn` 接收 `signal`。表不自己 `fetch`。编辑成功后按 ID 更新缓存或 invalidate。本 Demo 没有这两份库。

**Virtual + RHF。** 只有 DOM 成为瓶颈才加虚拟行。编辑草稿按业务 ID 放在表单状态里，行被卸载不能丢掉未提交的值。服务端分页和虚拟窗口可以同时存在，但排序只能有一个主人。

## 生产清单

- `getRowId` 使用稳定 ID。
- 服务端模式手动排序和分页，并传筛选后的 `rowCount`。
- 排序、搜索、改 pageSize 时决定页码是否归零，并作废进行中的请求。
- 回包同时看 abort 和 epoch。
- 表头可键盘操作，`aria-sort` 与实际方向一致。
- 单元格用文本节点。不要把 RSS 标题丢进 HTML。
- 中文搜索不要每个键都打请求。Lab 用提交，并挡住组合 Enter。
- SSR 时服务端和客户端使用同一批初始行和同一套 ID，避免水合不一致。本 Demo 没有 SSR 收据。

## 升级

从 v8 迁到 9.2.4：删掉 `getCoreRowModel`，`useReactTable` 改为 `useTable`，列 helper 加上 features 类型，不要解构实例方法，`getState()` 改为读受控 state 或 store 快照，全局 `onStateChange` 改成具体的 `onSortingChange`。验收要包括跨页选择和 A→B→A，不只是「能看见表」。

官方迁移说明：https://tanstack.com/table/latest/docs/framework/react/guide/migrating

## 练习

1. 勾选第一页两行，翻到第二页再回来，ID 不变。
2. advanced 下先慢请求再立刻改排序，旧行不能闪回来。
3. 把总数缩到 2 条时，页码被夹住，且不渲染夹住之前那一页的行。
4. 组合输入期间按 Enter，查询词不变。

## 官方链接

- https://tanstack.com/table/latest
- https://tanstack.com/table/latest/docs/guide/features
- https://tanstack.com/table/latest/docs/framework/react/guide/sorting
- https://tanstack.com/table/latest/docs/framework/react/guide/pagination
- https://tanstack.com/table/latest/docs/framework/react/guide/row-selection
- https://github.com/TanStack/table

## 证据

`page-policy` 单测不渲染 `useTable`。sdk 要真实 import `@tanstack/react-table@9.2.4` 并在 `docs/library-lab/evidence/runs/` 留下收据。键盘排序和 IME 属于 browser。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C07 的条目 PASS。不要改 `verification.json`。
