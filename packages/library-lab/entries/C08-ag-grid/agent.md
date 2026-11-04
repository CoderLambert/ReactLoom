# C08 AG Grid — 工程手册

## 适用

Community 能覆盖的排序、过滤、分页和单元格编辑。Enterprise SSRM、分组和收费导出不在本 pin 里。完全自定义表格用 TanStack Table。

## 版本

`ag-grid-community@36.2.0` 与 `ag-grid-react@36.2.0`，MIT。模块只注册 `AllCommunityModule`。主题用 `themeQuartz.withParams`，不要再引旧的 CSS 主题文件。

## 迁移

带走 `examples/example.tsx` 和 `examples/edit-policy.mjs`。用 API client 替换 `reload` 的定时器。保持 `readOnlyEdit`、`getRowId` 和 revision 比较。不要把现在的 `pagination` 讲成服务端分页。

## 不可删的清理

编辑用 `rowsRef` 上的同步快照。`applyStatusEdit` 对不上 revision 就返回 `conflict` 且不改行。快照合并只保留 incoming 里的 ID。加载的 generation 和 AbortController 在卸载、取消和更晚的请求里作废。

## 反例

```tsx
<AgGridReact getRowId={p => String(p.rowIndex)} onCellValueChanged={e => { e.data.status = e.newValue }} />
```

- client-side 分页当成按页请求。
- Community 项目复制 SSRM 示例。
- `cacheBlockSize` 小于页大小（一旦启用 Infinite）。
- 卸载后仍 `successCallback`。
- 单元格拼接 HTML。
- 过滤后的子集交给需要完整依赖的图。

## 测试断言

- 未知状态或非法 revision 得到 `invalid`。
- revision 不匹配得到 `conflict`，行数组保持原引用语义（不修改该行）。
- 相同状态得到 `unchanged`。
- 快照 revision 更旧时保留本地状态；快照缺少的 ID 被丢弃。
- 策略单测没有挂载 `AgGridReact`。

## 真实限制

数据全在内存。150 和 1500 不是性能结果。没有 Infinite datasource，没有 IME 搜索门闩，没有屏幕阅读器收据。过滤是 React 里的 `includes`，不是网格的服务端 filter model。

## 证据

没有收据不要写 PASS。Actions 41779873259 不是本条目。不要改 `verification.json`。
