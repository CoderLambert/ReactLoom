# AG Grid Community 36.2.0｜网格画视图，revision 决定能不能改

Lab 锁定 `ag-grid-community@36.2.0` 和 `ag-grid-react@36.2.0`（MIT）。只注册 `AllCommunityModule`。没有 Enterprise 包，没有 license key，也没有 Server-Side Row Model。行数是教学用的 fixture，不是吞吐承诺。

没有收据时 sdk / build / browser 保持 NOT_RUN。Actions 41779873259 不是本条目 PASS。

## Lab 当前示例

[`examples/example.tsx`](examples/example.tsx) 使用真实的 `AgGridProvider` 和 `AgGridReact`。主题是 `themeQuartz.withParams`，不要再叠旧的 `ag-theme-quartz.css`。`demo.tsx` 只做再导出。没有 `localhost:4178` 的 API。

- **basic**：12 行。状态列 `editable`，编辑器是 `agSelectCellEditor`，值只允许 `active`、`paused`、`error`。`readOnlyEdit` 加上 `onCellEditRequest`。真正改数据的是 [`edit-policy.mjs`](examples/edit-policy.mjs) 的 `applyStatusEdit`。
- **business**：150 行，频道名称过滤在 React 里做，网格开分页，每页 25，可选 25/50/100。过滤后的数组才是 `rowData`。
- **advanced**：1500 行。慢加载 700ms、快加载 100ms，用 generation 和 `AbortController`。返回的快照经过 `reconcileFeedSnapshot`：按稳定 ID 保留 revision 更高的本地状态，服务器快照里已经没有的 ID 不会被本地行复活。`applyStatusEdit(..., 0)` 期望 `conflict`。拖动或双击状态列时，请求带上编辑开始时看到的 `revision`。

`rowsRef` 在渲染之外保存同步副本，避免慢请求和编辑互相读到旧的 `useState`。

研究笔记里的 Infinite datasource、`successCallback`、`cacheBlockSize` 和 SSRM 没有挂载。那些规则写在下面，避免把当前的 client-side 分页说成服务端分页。

## 什么时候用

需要排序、列过滤、单元格编辑和键盘网格、又不想自己画表头时，Community 足够。列透视、行分组的企业模型和高级导出要先看官方功能矩阵再采购。高度自定义、无样式的表用 C07。

Client-side 分页只是把已经在浏览器里的行分成页。它不会按页去服务器取数。

## 数据与模型

`getRowId={(params) => params.data.id}` 返回 `feed-0001` 这种稳定字符串。排序和过滤不能改这个 ID。不要用数组下标。

`readOnlyEdit` 让网格提出变更，React 决定是否接受。默认的 `onCellValueChanged` 可能直接改你传进去的行对象，和不可变 state 冲突。

`applyStatusEdit` 是比较并交换：

- 状态不在白名单，或 revision 不是非负安全整数：`invalid`
- 找不到 ID：`not-found`
- `current.revision !== expectedRevision`：`conflict`
- 状态相同：`unchanged`
- 否则新数组里该行 `revision + 1`

`reconcileFeedSnapshot` 只遍历**新快照**里的 ID。本地有更新的 revision 就保留本地状态；本地有、快照没有的行被丢掉。

列定义和 `defaultColDef` 用 `useMemo` 固定引用。主题对象是模块常量。

Community Infinite 若以后要接：`endRow` 不包含，`cacheBlockSize` 不得小于 `paginationPageSize`，`successCallback(rows, lastRow)` 和 `failCallback()` 二选一。那不是现在这个组件。SSRM 的 datasource 类型也不同，不能把企业示例塞进 Community。

## 三层示例

### 基本

双击状态列，改成另一个枚举值。状态行出现「已按 revision 提交」，版本列加一。再排序，同一 ID 仍是新状态。非法值在回调里被丢掉。

### 业务

过滤「Frontend」。显示计数变小，网格分页只针对过滤后的行。清空过滤，150 行还在。这是客户端过滤，不是服务端 `filterModel`。

### 进阶

先点慢加载，再点快加载或取消。只有 generation 仍匹配的那次能 `setRows`。点「模拟旧版本编辑」，`applyStatusEdit` 用 revision 0，结果应是 `conflict`，行不变。在慢加载返回前把某一行改到更高 revision，随后到达的旧快照不能把状态改回去。

1500 只说明循环造了多少对象。没有帧时间和堆快照，就不能写性能结论。

## 反例

### 1. 新旧主题一起上

```tsx
import 'ag-grid-community/styles/ag-theme-quartz.css'
<AgGridReact theme={themeQuartz} />
```

36.x 用 Theming API。旧 CSS 另做迁移，不要叠。

### 2. 不注册模块

`<AgGridReact>` 外面要有 `AgGridProvider modules={[AllCommunityModule]}`，或按需模块。本示例用全量 Community，没有 Enterprise。

### 3. getRowId 用 index

排序后选择和编辑打到别的频道。用 `params.data.id`。

### 4. 让网格直接改行对象

```tsx
<AgGridReact onCellValueChanged={event => { event.data.status = event.newValue }} />
```

改为 `readOnlyEdit` 和 `onCellEditRequest`，用新数组更新。

### 5. 把 client-side pagination 当成服务端分页

用户以为换页会查数据库。真分页要用 Infinite 或自己的请求，并说明排序发生在哪一层。当前 Demo 的 1500 行都在内存里。

### 6. Infinite 只排序已加载的 50 行

`sortModel` 要交给后端，返回的是全局顺序里的那一截。Lab 还没做这一层。

### 7. cacheBlockSize 小于 pageSize

官方不支持。若以后同时开 Infinite 和分页，两者至少对齐。现在的 25/50/100 只是 client-side 的页大小。

### 8. 卸载后仍 successCallback

旧 Promise 会打到已经销毁的网格。用 abort 和 generation。Lab 的 `reload` 已经这样做。

### 9. Community 里打开 SSRM

企业模型不会因为 import 路径像就免费。先对矩阵，再谈实现。

### 10. 单元格用 HTML 拼接标题

返回 React 文本。RSS 名称不需要 `dangerouslySetInnerHTML`。

### 11. 把「当前页选中」当成全集

未加载的行不在选择里。批量操作把明确的 ID 或查询条件交给服务端。

### 12. 过滤掉的行仍参与一个有依赖的图

本网格没有依赖图。若和甘特图共用数据，不要把过滤后的子集交给需要完整拓扑的引擎。

## 组合

**Query。** 网格消费查询结果。mutation 携带所见 revision。409 时不要乐观留下新状态。refetch 用 `reconcileFeedSnapshot` 的规则合并，而不是整表替换掉更新的本地行。本 Demo 没有 Query。

**TanStack Table。** 要完全自己画 DOM、没有内置列过滤器时用 C07。不要两套网格同时拥有同一份选择状态。

**Virtual。** AG Grid 自己有行虚拟化。旁边的非网格长列表才考虑 C10。关掉行虚拟化去「方便读屏」会改变内存，应另给语义表格，而不是默认 `suppressRowVirtualisation`。

## 生产清单

- 只注册付过费或确定免费的模块。本条目只有 Community。
- `getRowId`、`readOnlyEdit`、列定义引用稳定。
- 编辑携带 revision。冲突不写行。
- 快照合并不复活已删除 ID。
- 加载用 abort 和 generation。卸载时两者都作废。
- 状态不只靠颜色。Lab 把结果写在 `role="status"`。
- 键盘：Tab、方向键、Enter、Escape 要在浏览器里看。网格的 `role="grid"` 不等于已经用 NVDA 验收。
- 搜索如果以后防抖，组合期间不要发请求。当前过滤是受控输入的本地 `includes`，没有请求。

## 升级

36.2 的主题是 `theme` 属性。从 32 以前的 CSS 文件迁过来时删掉旧主题 import，再回归编辑、分页和 `getRowId`。Enterprise 功能升级要单独的许可检查，不能随 Community 版本号一起打开。

`rowsRef` 必须在 `setRows` 的同一分支更新。只更新 state、不更新 ref，下一次编辑会拿旧 revision 去比较，把合法修改看成冲突。只更新 ref、不 `setRows`，网格仍画旧行。

## 练习

1. 改 `feed-0001` 的状态，排序后版本仍加一。
2. 用 revision 0 再改同一行，结果是 `conflict`，界面行不变。
3. 慢加载期间把某行 revision 加高，快照返回后该行保持本地状态。
4. 快照里删掉一个 ID，合并结果里不再出现该行。

## 故障排查

| 现象 | 先看 |
| --- | --- |
| 模块缺失或功能是空的 | `AgGridProvider` 是否只注册了 `AllCommunityModule` |
| 样式叠成两套 | 是否同时引了旧的 `ag-theme-quartz.css` 和 `theme` 属性 |
| 排序后选中串行 | `getRowId` 是否用了 index |
| 编辑改了原对象 | 是否忘了 `readOnlyEdit`，在 `onCellValueChanged` 里写了 `event.data` |
| 翻页仍像在查服务器 | client-side `pagination` 只切已经在内存里的行 |
| 旧快照盖住新编辑 | `reconcileFeedSnapshot` 是否整表替换，而不是比较 revision |
| 取消后行仍被替换 | `reload` 的 generation 是否在 `setRows` 前比较 |

Community Infinite 若以后启用：`endRow` 不包含，`successCallback` 和 `failCallback` 只能走一个，`cacheBlockSize` 不得小于页大小。SSRM 的 datasource 类型不同，不能从企业文档复制进来。1500 行没有堆快照，不能写成容量结论。

## 官方链接

- https://www.ag-grid.com/react-data-grid/installation/
- https://www.ag-grid.com/react-data-grid/community-vs-enterprise/
- https://www.ag-grid.com/react-data-grid/row-ids/
- https://www.ag-grid.com/react-data-grid/value-setters/
- https://www.ag-grid.com/react-data-grid/react-hooks/

过滤用 `toLocaleLowerCase` 比较频道名，再把结果数组交给 `rowData`。网格自己的列过滤器仍然开着。两套过滤会叠在一起。教学时先清空列过滤，再看输入框，避免把「没有行」误判成 revision 冲突。编辑请求仍用 `rowsRef` 里的全量行，不使用过滤后的数组去 `applyStatusEdit`，否则被滤掉的行会变成 `not-found`。

## 证据

`edit-policy` 单测不创建网格。sdk 要真实 import `ag-grid-react@36.2.0` 并在 `docs/library-lab/evidence/runs/` 留下收据。键盘和滚动属于 browser。

GitHub Actions 41779873259 是仓库级安装、typecheck、build、52 个 SDK 文件（153 项测试）和 45 项 Playwright 的结果，不是 C08 的条目 PASS。不要改 `verification.json`。
