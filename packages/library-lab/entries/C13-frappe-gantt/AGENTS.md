# C13 Frappe Gantt 条目维护

遵守根/平台 AGENTS 与 CD 所有权。先读 library.json、agent.md、verification.json。维护同源 examples、指南、依赖声明与三层使用场景；目标 SDK 不可 Mock 后标 PASS，运行日志和源码指纹必须一致。不得写 root package、锁文件、CI 或主分支。

C13 新增 `examples/plan-policy.mjs` 为实际示例唯一拓扑/日期校验来源；修改时同步 `.d.mts` 与 `tests/plan-policy.test.mjs`，不要复制第二份只供文档展示的校验器。
