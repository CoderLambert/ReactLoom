# AG Grid Community：React 数据网格实战

## 什么时候选择
当业务需要排序、筛选、编辑、列配置和大量数据时，AG Grid Community 可以减少大量底层网格代码。若要完全自定义无样式组件，比较 C07 TanStack Table。不要把收费的 Enterprise 分组、透视、SSRM 功能混作免费。

## 安装与版本
基线 ag-grid-react 与 ag-grid-community 均为 36.2.0，版本必须同步。安装：

    pnpm add ag-grid-react@36.2.0 ag-grid-community@36.2.0

遵循 36.x 的 AgGridProvider + AllCommunityModule 显式注册方式；新主题使用 themeQuartz.withParams。完整真实源码为 examples/example.tsx。

## 入门：列、排序、状态编辑
ColDef<Source>[] 强类型声明列，getRowId 返回稳定 feed ID，client-side row model 做排序、筛选；readOnlyEdit 模式将编辑事件交给 React，由 onCellEditRequest 做不可变更新，业务后端若存在则在服务端完成权限与版本检查。

## 业务：RSS 来源后台
将显示结果从服务数据派生而不是让网格内部变成唯一持有者；当租户/分组改变时，清理旧请求并刷新数据源。示例通过 150 条 fixtures 展示分页、过滤与状态修改，真实网格负责行与列的交互，未连接外部 HTTP。

## 进阶：大表与请求竞态
1500 条数据在 client-side 模型下仍可展示，但生产中不能假设服务器端分页和 row virtualization 等于同一件事。慢/快本地数据加载使用 AbortController 与递增 generation，防旧结果回写。跨页选择、服务端事务、排序字段映射需要目标 API 另行设计。

## 关键反模式
1. 使用数组 index 当 rowId：排序和插入后将错配编辑/选中状态。
2. 同时修改 Grid 内部行与 React 数据：两个事实源产生覆盖。示例选择 readOnlyEdit。
3. 把 Community 与 Enterprise 组件随意混装、或混用 35/36 major：模块注册与许可可能不一致。
4. 每次渲染重建 columnDefs/getRowId，产生额外重置与高成本更新。

## 可访问性、性能与验证
排序与筛选需键盘/读屏可用，动态可编辑单元格的错误信息不能只靠颜色。对 10k+ 服务数据应明确选择 client-side/infinite/SSRM 模式及对应授权；不要拿本地 1500 行 mock 断言生产性能。新包未在本分支实际构建，所有 SDK/browser 结果以 verification.json 为准。

## 官方来源
https://www.ag-grid.com/react-data-grid/installation/
https://www.ag-grid.com/react-data-grid/community-vs-enterprise/

## 本轮重要更正：可编辑行的版本所有权

`onCellEditRequest` 携带 Grid 显示时的 `event.data.revision`，交由示例真实调用的 `examples/edit-policy.mjs` 做 compare-and-swap。若同一行已经有更新版本，旧编辑返回 `conflict`，不再让过期编辑覆盖较新的状态。业务接口应映射 `If-Match`/版本字段，并向用户呈现 409；此处仅为本地 fixture，不证明服务器并发一致性。

慢加载回包通过 `reconcileFeedSnapshot` 逐行按稳定 ID 比较版本：只保留较新的本地可编辑 `status`，其他服务器字段由新快照持有；服务器删除的行不会复活。生产端需有权威 revision、冲突处理和取消策略，不能拿纯前端计数器当分布式版本号。`tests/edit-policy.test.mjs` 使用 Node 验证领域规则；AG Grid 真实编辑/排序/分页仍需要 SDK、类型与浏览器测试。
