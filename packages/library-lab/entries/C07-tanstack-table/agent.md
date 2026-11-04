# C07 TanStack Table — 工程手册

## 适用

无样式的排序、分页、行选择。要现成表格皮肤用别的组件库，把本库放在头less 层。不要从 v8 文档抄 API。

## 版本

`@tanstack/react-table@9.2.4`。入口是 `useTable` 和 `tableFeatures`。

## 迁移

带走 `examples/example.tsx` 的列定义和 `examples/page-policy.mjs`。`getRowId` 必须是业务 id。advanced 的手动分页和手动排序要一起保留，除非你明确改回客户端全量数据。

## 不可删的清理

请求租约在新的查询开始时递增。写回 `setRemote` 前核对 identity 和 generation。卸载或切换 level 时旧响应不能落地。页码用 `clampPageIndex`。

## 反例

- `useReactTable` / `getCoreRowModel`。
- 行 key 用数组下标。
- 手动排序又在客户端重排当前页。
- 不取消的 fetch 覆盖新筛选。
- 把当前页全选说成选中全部结果。
- 用 HTML 字符串渲染不可信标题。

## 测试断言

- 同一 id 在排序后仍被选中。
- 身份不匹配的响应被丢弃。
- 总数变小后页码不会停在空页。
- 策略单测不是浏览器表格证明。

## 真实限制

种子数据是本地 18 行。没有列虚拟化，没有服务端「选择全部」。失败文案必须和空结果区分。

## 证据

没有收据不要写 PASS。仓库级 CI 不能抄到本条目。
