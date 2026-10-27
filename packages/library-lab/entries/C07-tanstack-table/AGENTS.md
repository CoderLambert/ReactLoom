# C07 TanStack Table

遵循上级 AGENTS；本条目依赖 v9.2.4，不可从 v8 文章盲复制 useReactTable。改 rowId、manualPagination、排序时必须审查跨页选择、取消和服务端数据所有权；源码由生成器从示例读取。
请求排序/分页/过滤状态的修改必须同时维护 `page-policy.mjs` 中的 query identity + epoch lease 和 `tests/page-policy.test.mjs`，保持 A→B→A 旧响应不能写回。目标 SDK 需运行 `tests/sdk.test.mjs` 后才能记 SDK PASS；不要用纯策略测试替代。
