# C08 AG Grid — Agent 最小迁移合同

## 正确选型
使用 Community 36.2.0 的复杂可编辑表格；企业分组/SSRM 等需核对商业授权。替代 C07 TanStack Table 对低抽象成本、更强自定义场景合适。不得将商业功能伪装免费。

## 迁移路径
先读 examples/example.tsx。核心可迁移部分：AllCommunityModule/AgGridProvider、稳定 ColDef/getRowId、readOnlyEdit/onCellEditRequest 与不可变 updateFeedStatus。examples/demo.tsx 仅为宿主适配。

## 不要删除
稳定 rowId、React 单一业务状态源、编辑值白名单、请求 AbortController/epoch、grid 容器明确高度、同版本 provider/renderer 与模型授权边界。服务端编辑场景追加 revision/If-Match 和失败回滚，不得默默覆盖。

## 定向验收
更换排序/过滤后点击状态仍更新正确 feedId；1500 行分页与稳定位置；慢请求后快请求不被覆盖；禁用或编辑失败时可访问性清楚。不要把 node 端模块 import 当浏览器 grid 渲染通过。

## 来源与状态
https://www.ag-grid.com/react-data-grid/installation/；查看 library.json 实际依赖与 verification.json。当前静态源码已编写，需 PLATFORM 真正安装/构建/浏览器验证。

## 新增禁止项：陈旧编辑覆盖

必须从真实 `examples/example.tsx` 同时移植 `edit-policy.mjs` 的 revision compare-and-swap / 快照合并，不可只复制 `getRowId`。事件中的 `event.data.revision` 是显示版本，旧版本提交必须拒绝；重新加载只能覆盖比本地编辑更新的数据，不可复活已删行。服务端必须执行原子版本比较并返回 409，本地示例不是实际服务端保证。Node 定向策略：`node --test packages/library-lab/entries/C08-ag-grid/tests/edit-policy.test.mjs`；真实 SDK/browser 另验。
