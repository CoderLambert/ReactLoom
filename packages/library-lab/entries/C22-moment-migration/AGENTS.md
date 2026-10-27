# C22 Moment 历史迁移

先读根目录及 Lab AGENTS.md、library.json、agent.md 和 verification.json。本库仅作为历史迁移指南，不得新增 `moment` 到主应用依赖，不得将注释中的旧 API 当作可执行实现。测试真正调用 date-fns / Day.js / TZDate；浏览器验收前不填 PASS。源码面板与运行示例共同引用 examples/example.tsx。
