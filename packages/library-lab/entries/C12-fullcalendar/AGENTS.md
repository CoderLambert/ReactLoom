# C12 FullCalendar 条目维护

遵守根/平台 AGENTS 与 CD 所有权。先读 library.json、agent.md、verification.json。维护同源 examples、指南、依赖声明与三层使用场景；目标 SDK 不可 Mock 后标 PASS，运行日志和源码指纹必须一致。不得写 root package、锁文件、CI 或主分支。

C12 中 `examples/calendar-policy.mjs` 是时间严格校验和本地事件 ID 唯一来源。不要用 JS Date 宽松解析接受没有 offset 的定时值；更新 `.d.mts`、源码列表和策略测试。
