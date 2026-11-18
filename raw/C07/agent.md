# C07 TanStack Table v9复用指南

需要拥有表格DOM/样式/数据请求，同时使用行模型、排序、分页、选择时使用。开箱网格比较C08；C10虚拟化不代替分页。固定@tanstack/react-table9.2.4（MIT），React>=18。

## 真实API与迁移

v9是useTable/tableFeatures，features里注册rowSortingFeature/rowPaginationFeature/rowSelectionFeature及sortedRowModel/createSortedRowModel、paginatedRowModel/createPaginatedRowModel。core自动包含，不传v8 getCoreRowModel工厂；table.getCoreRowModel实例读取仍存在。列用createColumnHelper<typeof features,Feed>()，渲染table.FlexRender，不解构依赖this的方法。

带走example.tsx、table-data.ts、fixture-page.ts、page-policy.mjs/.d.mts、workshop.css，保持相对导入；.ts导入需allowImportingTsExtensions或目标构建器对应写法。features/columns/data保持稳定引用；应用写table/th/td、aria-sort和命名checkbox，SDK不输出样式/DOM。

## 数据与三个目标

basic：原18行→core18→sorted18→DOM18，排序改变ID顺序但稳定rowId选择不变。business：应用JS先filter，再给Table全部匹配数据，SDK排序后分页；默认5/18，“技术”6条时第一页5/下一页1。advanced：360ms本地fixture完成排序/分页，manual flags让SDK不再处理，传入5行/rowCount18时各模型只有当前5行。

c07-model-summary与c07-row-model展示同份数据/模型ID；c07-table行data-row-id；c07-selection保存跨页ID。getSelectedRowModel只物化当前传入data范围：客户端可能有离开当前页的行，服务端不能凭空恢复未加载页。批量操作由服务端重新鉴权。

## 不能删的边界

getRowId=业务id；受控sorting/pagination/rowSelection；single-sort与排序/搜索归零；pageSize按SDK计算位置。manualSorting/manualPagination/rowCount与真实数据处理所有权一致，不能给一页却当成全局排序。

page-policy的query identity包含页/大小/排序/query/fail/limit；每次身份改变invalidate推进epoch并abort；提交必须lease.owns，展示回包/错误需当前generation，A→B→A旧结果不能复活。总数缩小时clamp后重新读取，不提交旧页。effect cleanup只取消本lease。保留中文IME保护与失败/加载/空状态区分。

## 定向验收

真实SDK测试覆盖同源features/fixture、排序→分页→SSR DOM、稳定ID/选择、manual bypass与rowCount；10项page-policy是纯策略。browser需实际头部按钮/aria-sort、跨页checkbox、中文Enter、503恢复、缩至2条及竞态，不从SSR/类型推出PASS。

固定官方包README来自d01c01bedbab0ff6c2641f18b2fc9a11545d9bf6（9.2.4），英文回退有候选依据；官网GET200的X-Frame-Options: DENY明确禁止iframe，按blocked保留直达入口；Lab-origin浏览器未运行，不冒称allowed。正式sdk/build/browser保持NOT_RUN直到匹配收据；局部结果与来源见local-validation.md。
