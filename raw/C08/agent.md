# C08 AG Grid Community 36.2.0

实际运行ag-grid-community/ag-grid-react36.2.0，MIT、React19.3；只Provider注册AllCommunityModule，Theming API themeQuartz.withParams。没有Enterprise/SSRM/Infinite/HTTP/Query或license key。全量模块是教学便利，1500行不是性能结论。

## 三个目标与真实模型

basic12行：输入→网格列过滤/排序→真实GridApi模型，稳定getRowId；business150行：React频道过滤/原生分页25及readOnlyEdit应用提交；advanced1500行：Abort+generation拒旧快照、CAS冲突与本地新版本保留。SDK负责网格DOM/编辑器/布局；fixture、React数组、过滤和revision是示例自建。

c08-model的modelRows为过滤/排序后全部行数，page从0开始，firstIds为当前页最多3个起点ID；读数来自GridApi，不是React数组或DOM猜测。业务详情只显示全量前3，不冒充当前页。客户端分页不取服务端数据。

## 不能丢的边界

cellEditRequest.data是提交时rowNode.data。cellEditingStarted先复制id/revision，request消费该版本给applyStatusEdit；编辑停止/Escape/卸载清session。不是让SDK自带CAS。policy校验枚举/安全非负revision、存在ID和版本相等，返回新数组；状态相同不加版本。rowsRef与setRows同分支更新，不写event.data，不用过滤子集提交。

reconcile只遍历incoming ID，新snapshot的普通字段由它拥有，本地status/revision只在更高版本保留，不复活缺失ID。删除分支仅policy测试覆盖，当前刷新fixture不删行。慢700/快100是本地timer，generation+abort双门闩；取消/更晚请求/卸载作废自己任务，旧finally不能清新controller。SDK销毁交AgGridReact，不能全局stop。

## 迁移与操作

复制example/grid-contract/edit-session/edit-policy及.d.mts/styles.css/demo七源，pnpm安装两个36.2.0包，无Lab alias或额外资产。网格有明确370px高度，窄容器可内部横滚，整个网格放客户端边界。真实DOM/SSR hydration不能由Node配置测试推出。

region“AG Grid Community 网格”，c08-workshop/data-level；c08-model、c08-data、c08-edit-session、c08-status、c08-total/c08-input-count、c08-grid。basic排序“来源 ID”第二次降序firstIds12/11/10；business下一页page1/first26，Frontend过滤50；状态编辑枚举active/paused/error→真实期望版本/新版本；advanced原慢/快/取消/模拟旧版本按钮保留。模拟旧版本只是policy，不是网络409或伪SDK事件。

## 来源与状态

主原README是匹配React包目录，固定commit0fee5b7b1e839ae23fe860e404042448f3c1375d，en/36.2.0/45598B/SHA7070a8bcf54603483e9b617fce91e7bcaec8e30f77b75ca02809ad0512ca340c，安装原文一致；全tree无中文，日期/完整7GET在official/source-evidence.json。官网CSP frame-ancestors仅self/ag-grid子域，排除Lab→blocked。

局部SDK2真实导入共享配置与theme API；policy6只业务/编辑快照，不证明网格DOM。入口strict和共享候选编译另记local-validation；本地 Chromium 覆盖见 local-validation.md，正式收据保持 NOT_RUN。屏幕阅读器/触摸、SSR hydration、实际内存/帧率和多实例仍待验。
