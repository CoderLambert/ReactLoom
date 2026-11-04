# C07 TanStack Table — 工程手册

## 适用

需要自己拥有表格 DOM 和数据请求的列表。不要把它当成数据源或虚拟化库。开箱网格比较 C08，大 DOM 比较 C10。

## 版本

`@tanstack/react-table@9.2.4`，MIT。入口是 `useTable`、`tableFeatures`、`createColumnHelper<typeof features, Feed>()`。不要从 v8 文章复制 `useReactTable` 或 `getCoreRowModel`。

## 迁移

带走 `examples/example.tsx` 和 `examples/page-policy.mjs`。用 API client 替换 `fetchLocalPage` 的 `setTimeout`。保持 `manualSorting`、`manualPagination`、`rowCount` 和 `getRowId`。排序字段继续走白名单，服务端再查一次。

## 不可删的清理

任何会改变查询身份的操作先 `invalidate`。回包必须 `lease.owns()`。页码被 `clampPageIndex` 改掉时不要提交旧页的行。卸载时 effect cleanup 调用 `lease.cancel()`。行的 React key 使用 `row.id`。

## 反例

```tsx
useTable({ data: onePage }) // 客户端排序被误当成全局排序
const { getValue } = row
getValue('title')
```

- 省略 `getRowId`。
- 只 `abort`，不比较 epoch，导致 A→B→A 回写。
- 用 `getSelectedRowModel()` 当跨页已选集合。
- `initialState`、`state`、`atoms` 同时写分页。
- 把 `sortId` 拼进 SQL。
- 列头只有点击、没有按钮和 `aria-sort`。

## 测试断言

- 身份函数拒绝未知 sort id、多列排序和非整数页码。
- `clampPageIndex` 在总数变小时回到最后一页，空表回到 0。
- gate 的旧 lease 在新的 begin 之后 `owns()` 为假，包括 A→B→A。
- 策略测试不是浏览器里的表格 PASS。

## 真实限制

advanced 的 503 和延迟都是本地定时器。没有 Query、没有 URL 状态、没有虚拟行。18 行不是性能数字。中文 Enter 的 80ms 是示例策略。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
