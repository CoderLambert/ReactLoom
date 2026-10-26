# A01 ECharts 维护规则

先读本目录 library.json、agent.md、verification.json 与上级 AGENTS.md。仅编辑本库 entry；不要改公共运行器、依赖锁或生成索引。保留实际示例源码与页面引用一致。ECharts 的 ResizeObserver、事件监听和实例必须在卸载时清理。没有真实目标SDK/浏览器证据不得写 PASS；若缺依赖请在 AB progress 写 dependencyRequests。