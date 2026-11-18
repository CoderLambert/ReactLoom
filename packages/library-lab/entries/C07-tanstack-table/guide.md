# TanStack Table：从原始数据、行模型到你写的表格

订阅源列表需要排序、筛选、分页和选中，但产品想自己掌握表头、单元格与样式。TanStack Table适合提供这些状态和行处理能力：它给出当前应该显示哪些行、每行怎样取值；React代码仍要真正输出table、th、td和可操作控件。它不发请求，不提供整套可视化网格，也不自动虚拟化DOM。需要开箱企业网格可比较AG Grid；行数造成DOM成本时再考虑TanStack Virtual，虚拟化不代替服务端分页。

本例固定 **@tanstack/react-table 9.2.4**，MIT，使用真实v9适配器。数据是18条原创RSS fixture，没有真实RSS服务。保留三个目标：先看原始数据怎样变成行模型，再操作客户端分页，最后对比由本地“服务端”负责排序和分页的边界。

## 第一条数据怎样来到DOM

| 层 | 本例数据与职责 | 实际调用 |
| --- | --- | --- |
| 原始fixture | id、title、category、subscribers、status；18条 | `feedSeed`，应用拥有数据 |
| 传入data | 客户端为应用筛选后的全部行；高级为已排序/切片的当前页 | `useTable({ data, ... })` |
| core行模型 | 为数据建立row，保留row.original并确定row.id | `table.getCoreRowModel()`，v9自动提供 |
| 排序模型 | 客户端按受控sorting重排；manualSorting时不再处理 | `table.getSortedRowModel()` |
| 最终行模型 | 客户端继续分页；manualPagination时保留已经给出的页 | `table.getRowModel().rows` |
| DOM | 表头按钮、单元格、checkbox与语义由应用生成 | `table.FlexRender`和真实table/tbody/tr/td |

展开“查看原始数据、行模型与选择ID”，能检查上述阶段的真实ID序列，而不是另写的示意数组。始终可见的数量摘要也来自这些实际对象。注意业务场景的检索由应用JavaScript先filter，再把结果交给Table；本例没有注册filteredRowModel，不能把这个检索称为SDK自动过滤。

行的创建位置不是业务身份。`getRowId: row => row.id`使row.id与feed-100等持久ID一致；排序改变位置，但不会把同一个checkbox的选择转移给别的来源。列定义、features与静态fixture都保持稳定引用；空响应也使用固定fallback，避免无意义地重建模型。

## 9.2.4的最小接线

v9改为`useTable`和显式features；不要直接复制v8的useReactTable构造方式。本例的同源注册在[table-data.ts](examples/table-data.ts)：

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

core模型自动包含，不需要把`getCoreRowModel()`工厂传入options；读取实例上的`table.getCoreRowModel()`仍是有效v9 API。功能对象与行模型factory都在tableFeatures里注册，列helper使用对应features类型。

[example.tsx](examples/example.tsx)把sorting、pagination、rowSelection作为受控状态交回：

```tsx
const table = useTable({
  features, columns, data: rows,
  getRowId: row => row.id,
  state: { sorting, pagination, rowSelection },
  onSortingChange: onSort,
  onPaginationChange,
  onRowSelectionChange: setRowSelection,
})
```

同一个slice只保留一个主人，不再混用initialState或atoms写它。渲染时遍历getHeaderGroups和getRowModel；单元格用`<table.FlexRender cell={cell} />`。实例方法依赖上下文，不要把row.getValue解构成独立函数再调用。

## 实验一：排序改变行顺序，不改变身份

工程问题：排序后的第一行，还是原始数据的第一行吗？选择应该跟位置还是跟实体走？

1. basic初始展示18行，feed-100的订阅数100，最大feed-117为627。展开检查器，inputIds/coreIds/sortedIds/visibleIds最初按相同顺序。
2. 勾选第一条来源，查看“已选中的业务ID”。点击“订阅数”，根据表头aria-sort与箭头观察方向；数值降序时sortedIds和DOM以feed-117、116、115开头，inputIds/coreIds仍按原始顺序。
3. 继续切换排序方向，选中仍属于原来的业务ID。标题等单元格直接来自row.original/列取值，SDK不会为你生成某种固定DOM样式。
4. 点击“清空选择”，受控ID集合清空，checkbox同步。

basic的pageSize为18，所以没有分页控件；它展示排序与身份的关系，不用换一套标题重复客户端分页实验。

## 实验二：客户端筛选、排序、再分页

工程问题：所有数据都在浏览器时，分页和筛选由谁处理？

1. business初始传入18行，每页5行。检查器显示core/sorted仍有18行，最终DOM只有5行。
2. 输入“技术”并点击“查询”。应用在全部fixture中筛出6条，页码归零；Table对这6条排序/分页，第一页5行，下一页1行。
3. 改“每页行数”为3或10。排序和搜索在本例明确归零页码；setPageSize则由SDK计算新的分页位置，并让请求身份失效，不能假定所有操作都自动回到第一页。
4. 选第一页的行，翻到下一页，再返回。rowSelection保存业务ID。把筛选改成无匹配文本，明确显示空状态，选择ID不会被一段空结果冒充成已全部清除。

检索使用提交后的query，不随每次按键改变。组合输入期间的Enter、229事件以及compositionend后的80ms保护窗不提交，这是本例输入策略。后端搜索应按产品和输入法验收，不能照搬该时间作为平台保证。

客户端模式只能处理已经交给它的完整数据。先从服务器取一页，再打开客户端排序，只能排这一页，不能得到全局顺序。

## 实验三：当前页来自服务端时，Table不再处理一次

工程问题：排序/页码改变后，如何避免旧请求、旧总数或旧页内容混进新视图？

1. advanced首次用360ms本地异步fixture返回当前页5行与total18。manualSorting和manualPagination开启；core/sorted/visible都只有这5行，没有再次切片。rowCount18用于计算总页数。
2. 操作排序或翻页，观察当前显示的数据被清空并出现读取说明。只有当前请求身份和generation都匹配的结果才能提交；不会把旧页行短暂当作新页。
3. 在后面页点击“模拟后台缩减到2条”。回包计算合法页码，夹回第1页，再重新读取；最终只提交2条，而不是提交夹页前的空页结果。
4. 点击“模拟服务端503”，显示失败，并说明没有提交旧页数据。点击“恢复并刷新”恢复来源上限/成功请求；重复同一身份的重试也按新generation区分旧错误。
5. 先选第一页一行，再翻页选择另一行；ID集合可以跨页。当前传入data里只有这一页，所以getSelectedRowModel只能把当前已加载的已选ID物化成行，不能恢复未加载远程页的实体。

[fixture-page.ts](examples/fixture-page.ts)才真正做本地过滤、排序、切页和延迟；Table的manual开关只是跳过对应客户端阶段，**不会向服务端发送请求**。fixture对字符串使用localeCompare与ID兜底，生产排序规则需与服务端约定；本例不是SQL接口或数据库性能基准。

[page-policy.mjs](examples/page-policy.mjs)保留两层所有权：

- tableQueryIdentity包含pageIndex/pageSize、单列白名单sorting、query、fail和limit；不同身份不能复用回包。
- createPageRequestGate在begin/invalidate时推进epoch并abort前一个延迟。lease.owns检查当前代，即使A→B→A回到相同字符串，第一次A也不能写回。
- 失效时旧generation的行与错误立即不可见；夹页时丢弃旧页回包并请求修正页。卸载cleanup只取消属于本例lease的工作，旧cleanup不能取消更新请求。

rowSelection可以保留不在当前data中的ID。客户端模式输入全部已筛选数据时，getSelectedRowModel可能包含离开当前分页的行；服务端模式只能物化当前页。批量操作应提交受控选择ID并在服务端重新鉴权，不能把当前模型当“全数据库选中结果”。

## 迁入自己的项目

```sh
pnpm add @tanstack/react-table@9.2.4
```

React peer为>=18。复制example.tsx、table-data.ts、fixture-page.ts、page-policy.mjs及.d.mts、workshop.css，保持相对路径；demo.tsx是Lab出口。fixture-page用.ts导入同源配置以支持Node验证，TS工程需allowImportingTsExtensions或调整为目标构建器支持的导入。Table没有UI样式，本地CSS只负责语义表格布局、焦点与表格自身横向滚动。

替换fixture时用应用API client接收signal，并验证rows/total。保持manualSorting、manualPagination、稳定getRowId、受控状态和rowCount；不能只换成当前页HTTP数据却留下客户端处理。服务端还要校验sort字段、参数化查询、鉴权和页大小上限；客户端身份白名单不等于服务端安全。

排序/过滤/分页只有一个数据所有者。可将相同身份用于TanStack Query或URL状态，但本例没有引入Query、nuqs或虚拟行。大数据先明确客户端可承受的数据量与DOM预算，再决定服务端分页和虚拟化；18条fixture不是性能结果。

## 官方来源与证据边界

匹配版本来自`@tanstack/react-table@9.2.4`标签提交`d01c01bedbab0ff6c2641f18b2fc9a11545d9bf6`；实际核对本地dist/useTable.d.ts、core行模型和manual选项类型，以及同版本随包提供的官方getting-started/client-vs-server说明。官方当前文档也明确v9接口，不从v8博客推断。

官方README选目标包packages/react-table/README.md英文原文；该ref根/目标包候选没有中文README。固定来源/语言/版本/日期/SHA与完整响应保存在library.json和official/source-evidence.json。官网本次GET200但X-Frame-Options: DENY明确禁止iframe，标记blocked并保留直达入口。完整响应头包括未出现的CSP事实；Lab-origin浏览器尚未执行，不能写allowed。

- [v9行模型](https://tanstack.com/table/latest/docs/guide/row-models)
- [客户端与服务端](https://tanstack.com/table/latest/docs/guide/client-side-vs-server-side)
- [v9分页](https://tanstack.com/table/latest/docs/guide/pagination)
- [v9选择](https://tanstack.com/table/latest/docs/guide/row-selection)
- [v9迁移](https://tanstack.com/table/latest/docs/framework/react/guide/migrating)

真实SDK套件使用v9 React适配器、同源features/fixture和SSR DOM，验证排序在分页前、manual跳过处理、rowCount与选择物化边界。纯page-policy测试不运行SDK；两者都不能证明鼠标/键盘排序、IME、360ms请求竞态或真实浏览器布局。实际命令、六项复核和当前未测项见local-validation.md，正式verification状态仍按匹配收据。
