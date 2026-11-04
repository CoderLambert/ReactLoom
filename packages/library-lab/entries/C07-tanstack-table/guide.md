# TanStack Table 9.2.4｜表头无样式，行身份要稳定

Lab 锁定 `@tanstack/react-table@9.2.4`。这是 v9：`useTable`、`tableFeatures`、`createColumnHelper`。不要从 v8 文章抄 `useReactTable` 或 `getCoreRowModel`。库不画 CSS，也不拥有远程数据。

没有逐库收据时 sdk / build / browser 是 NOT_RUN。Actions [41779873259](https://github.com/CoderLambert/ReactLoom/actions/runs/41779873259) 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 用真实的 `useTable`。[`examples/page-policy.mjs`](examples/page-policy.mjs) 管页码和请求租约。18 行种子在组件里，不请求网络。

已挂载：

- `getRowId: row => row.id`。选择和排序不靠数组下标。
- 功能一次注册：排序、分页、行选择，以及 `sortFn_text`。
- basic：本地 18 行，表头可排序，复选框按标题命名。
- business：本地筛选加排序加分页。筛选只是视图，不另存一份「当前页就是全部数据」。
- advanced：`manualSorting` 和 `manualPagination`。查询身份是页码、页大小、排序、搜索词和失败开关。`createPageRequestGate` 给每次请求一个 generation。响应写回前必须对上身份和代数。A→B→A 的慢响应不能覆盖新的 A。
- 失败时表格不把空数组说成「服务器确认没有数据」，除非状态文案写明失败。

没有挂载：真 HTTP、列宽拖拽、虚拟滚动、跨页「全选所有过滤结果」的服务端协议。行选择是当前数据里的 id，不是「第 3 行」。

## 1. 谁拥有什么

```text
业务记录（id 稳定） → data
查询状态（页、排序、搜索） → React 或 URL
useTable → 行模型、可见行、选择 API
DOM → 你自己画
```

远程分页时，`data` 只是这一页。`rowCount` / total 告诉分页还有多少。不要把这一页 sort 完当成全局顺序，除非 `manualSorting` 关掉、数据确实全在本地。

## 2. 三层

**入门**：18 行都在内存。点表头改变排序状态，行组件的 key 仍是 `feed-100` 这种 id。

**业务**：筛选、排序、分页都在客户端。翻页不应丢掉已选 id，除非该 id 已不在全集里。Lab 的选择状态跟表格实例走，切换 level 会卸掉旧表。

**进阶**：手动模式。你负责按查询取数。`tableQueryIdentity` 把会改变结果的字段拼进身份。`clampPageIndex` 在总数变小后把页码收回来。租约的 `revision()` 对不上就丢弃响应。

## 3. 反例

### 反例 1：v8 API

```ts
useReactTable({ getCoreRowModel: getCoreRowModel() })
```

v9 是 `useTable({ features, columns, data, getRowId })`。混用会在类型和运行时一起坏。

### 反例 2：行 key 用 index

```tsx
{rows.map((row, index) => <tr key={index} />)}
```

排序后选择框会粘在错误的标题上。用 `row.id`。

### 反例 3：手动分页却在客户端再 sort 当前页

打开 `manualSorting` 就不要再让表格对这一页做第二种顺序。服务端顺序是权威。Lab 的 advanced 把两种 manual 一起打开。

### 反例 4：慢请求覆盖新筛选

```ts
fetch(url).then(setRows)
```

搜索从 A 改到 B，A 的响应不能写入。Lab 用 identity + generation。取消还要把 signal 传给 fetch；策略对象本身不会发 HTTP。

### 反例 5：全选等于所有页

当前页的 toggle-all 只包含 `data` 里的行。若产品文案是「选中全部 1 万条」，那是服务端的选择集合，不要用这一页的 `RowSelectionState` 假装。

### 反例 6：把不可信标题插进 HTML

表头和单元格用 React 文本。不要 `dangerouslySetInnerHTML` 渲染 RSS 标题。

## 4. 组合

**Query**：queryKey 含页、排序、搜索、租户。表格只消费已经返回的行。不要把 Query 缓存再抄进 Zustand。

**Virtual**：行高和 overscan 归虚拟列表。表格仍提供行模型。不要两套都做分页还不说明谁说了算。

## 5. 练习

1. 删除中间一行再排序，选择应留在同一个 id。
2. advanced 里快速改搜索，只有最后一次身份能出现在表格上。
3. 把总数从 18 改成 5，页码要被夹回合法范围。

## 6. 证据

`page-policy` 单测不渲染表格。`tests/sdk.test.mjs` 若 import 了 `@tanstack/react-table`，要跑过并有收据才是 sdk PASS。

## 7. 资料

- https://tanstack.com/table/latest
- https://tanstack.com/table/latest/docs/guide/tables
- https://www.npmjs.com/package/@tanstack/react-table
