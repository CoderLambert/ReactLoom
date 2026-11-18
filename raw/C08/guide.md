# AG Grid：让订阅行模型、编辑和刷新各有主人

订阅中心需要排序、过滤、分页和可编辑状态，又不能让慢快照覆盖刚完成的修改。AG Grid Community负责网格的列、行模型、编辑器和键盘；React持有业务行，应用用稳定ID与revision决定能否提交。当前使用ag-grid-community/ag-grid-react **36.2.0**（MIT，React19.3），只注册AllCommunityModule，没有Enterprise、license key或服务端数据源。

需要现成网格、列过滤和编辑器时适合它；希望完全自己画DOM时可选C07 TanStack Table。全量Community模块方便教学，生产按实际功能拆模块以控制体积。1500行只代表本地fixture对象数，没有吞吐/帧率/内存验收结论。

## 核心模型：数据、视图与业务写入

`rows → React频道过滤shown → rowData → 网格列过滤/排序行模型 → 客户端分页 → 可见DOM`。`getRowId`返回feed-0001等业务ID；排序后ID不变，不把DOM位置或数组下标当身份。虚拟化只挂可见行，DOM行数不等于总数。

页面的“总数/传入网格”来自React；`c08-model`的modelRows/page/pages/pageSize/firstIds来自真实GridApi。modelRows是网格过滤/排序后的全部模型行数，firstIds是当前页起点的最多3个ID，**不是抓DOM猜出来的数据**。页面页码从0开始，原生分页控件显示人用的1开始页码。

[grid-contract.ts](examples/grid-contract.ts)共享实际列、主题、模块、fixture和getRowId；[example.tsx](examples/example.tsx)是唯一React演示。最小接入形状：

```tsx
import { AgGridProvider, AgGridReact } from 'ag-grid-react'
import { createColumns, getSourceId, GRID_THEME, MODULES } from './grid-contract'

<AgGridProvider modules={MODULES}>
  <div style={{ height: 370 }}>
    <AgGridReact rowData={rows} columnDefs={createColumns()}
      theme={GRID_THEME} getRowId={getSourceId} />
  </div>
</AgGridProvider>
```

完整示例用useMemo保持列/defaultColDef引用稳定。36.2的themeQuartz.withParams是Theming API，不再叠旧ag-theme-quartz.css。主题和AllCommunityModule是真SDK；订阅名称、文章数、revision和延时请求是本例fixture/应用策略。

## 目标一：看见真实行模型和稳定身份

运行“数据、列与网格行模型”，12行默认按输入顺序。点击“来源 ID”表头一次升序、再一次降序，实际网格和firstIds应变为feed-0012、feed-0011、feed-0010，而总数/modelRows仍12。点击频道列过滤也会改变网格模型；先清列过滤再比较默认结果。

状态列仍保留编辑能力。不要把模型排序误写回原数组，也不要根据第几行来改业务数据。当前数据详情显示全量业务数组的前3项，用来与排序视图比较，不能把它当当前页数据。

## 目标二：客户端分页和受控编辑

运行“客户端分页与受控编辑”，150行已全部在内存，默认每页25、6页。用网格原生下一页，page变1，firstIds从feed-0026开始。输入频道“Frontend”，React传入50行，模型通常50、2页；清掉输入恢复150。网格自己的列过滤器会叠加，观察前应清掉其他列过滤。换页不会发请求，这是client-side row model。

双击第一行的状态列，或聚焦后按Enter进入agSelectCellEditor，选择另一枚举。`readOnlyEdit`让SDK发cellEditRequest，**不会替应用改rowData**；真正提交由applyStatusEdit返回新数组，同一ID的revision加一，状态区显示期望/新版本。

重要的是哪一个revision：36.2.0实际cellEditRequest.data来自提交时rowNode.data，不能据它声称拿到了开始编辑时的版本。[edit-session.ts](examples/edit-session.ts)在cellEditingStarted复制{id,revision}，提交时消费这份快照；编辑结束（含Escape）/卸载清掉它。SDK先提交cellEditRequest，再停止编辑，因此开始版本仍在；真实浏览器还需核对这个事件接入。

[applyStatusEdit](examples/edit-policy.mjs)是本例比较并交换策略：状态/版本非法→invalid，ID不存在→not-found，版本不相等→conflict，相同状态→unchanged，否则该ID新对象revision+1。它使用rowsRef全量同步模型，不拿过滤后的子数组去写行。SDK管理编辑器，应用管理提交和冲突；不在onCellValueChanged里直接改event.data。

## 目标三：旧快照、取消与版本冲突

运行“快照竞态与revision冲突”。先把feed-0001的active改为paused，业务版本应变2。再点“启动慢数据加载”，随即点“启动快数据加载”：旧700ms延时被abort，只有100ms的当前generation能提交；到700ms以后也不能换成旧结果。新fixture快照仍revision1，本地版本2的状态必须保留。

“取消加载”同时作废generation并abort自己的延时；在延时结束前取消后，状态保持“已取消”，数据不被延迟任务替换。“模拟旧版本编辑”用revision0直接调用本例策略，显示conflict并保持行不变；**这个按钮是策略示例，不是假造SDK编辑事件或真实HTTP409响应**。

reconcileFeedSnapshot只遍历incoming ID；incoming其他字段仍以快照为准，本地status/revision仅在本地版本更高时保留。incoming缺少ID时不会复活本地行，这一分支在实际policy测试覆盖；当前刷新fixture不删除行，页面不冒充已演示服务端删除。

延时不是后端：没有HTTP、Query、Infinite datasource或Enterprise Server-Side Row Model。接真实服务时传AbortSignal、使用明确服务器revision/冲突响应，并由服务端最终授权；本地合并策略不能代替服务端并发控制。

## 迁入项目与生命周期

```sh
pnpm add ag-grid-community@36.2.0 ag-grid-react@36.2.0
```

带走源码面板的七文件：example、grid-contract、edit-session、edit-policy及声明、styles.css、demo出口。没有Lab alias、外部图片/字体或额外CSS主题包；styles.css给网格明确高度、窄屏容器和读数换行，列总宽度大时由网格自身横向滚动。SSR时在客户端边界挂载整个网格，Node配置测试不证明DOM/布局或水合可用。

React卸载时作废generation、abort自身timer并清session/API引用；延时自然完成移除abort监听，取消时清timer，旧任务finally不会清掉新controller。AgGridReact负责销毁自己的网格和SDK监听，应用不调用全局stop或移除别的网格。真实滚动/焦点/卸载内存仍需浏览器验收。

## 官方原文和验证边界

[官方React包README](official/readme.md)来自ag-grid/ag-grid固定npm gitHead `0fee5b7b1e839ae23fe860e404042448f3c1375d` 的 `packages/ag-grid-react/README.md`，36.2.0、英文45598B、SHA-256 `7070a8bcf54603483e9b617fce91e7bcaec8e30f77b75ca02809ad0512ca340c`，与实际安装原文逐字节一致。未截断tree未发现中文README。原文保留，与本地中文讲解分开；日期和7次真实请求完整头在[source-evidence.json](official/source-evidence.json)。

[官方React文档](https://www.ag-grid.com/react-data-grid/)响应实际GET200，CSP frame-ancestors仅允许'self'和https://*.ag-grid.com，不包含本地Lab，因此官网面板标blocked并保留直达。不是因raw/GitHub的禁止头误判，也没有把未经浏览器确认的iframe标allowed。

[local-validation.md](local-validation.md)区分真实SDK配置调用、纯策略、类型和真实浏览器；[完整三目标Playwright提案](validation/browser-proposal.txt)由主控统一接入。Node未造DOM，配置/theme调用不等于网格行模型/编辑/分页已运行。键盘、焦点、实际滚动、DOM清理、OS读屏/触摸和SSR hydration仍NOT_RUN，正式verification不升级。

### 编辑期间的外部更新观察

advanced的“模拟外部更新首行”将feed-0001通过相同业务更新边界切换状态并增加revision，是真实React权威模型变化，不是伪造SDK编辑事件。普通鼠标点击可能先结束当前编辑；浏览器专项用明确标注的程序化业务刷新fixture保留输入焦点，再观察SDK是否保留编辑器。若SDK保留，旧版本提交必须冲突且不覆盖外部值；若SDK自动结束，则只能记录旧编辑被结束，不宣称已走冲突回调。fixture同步、内存，不冒充后台请求。
