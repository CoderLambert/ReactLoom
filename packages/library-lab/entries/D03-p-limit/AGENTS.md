# p-limit 条目维护

先读上级 AGENTS.md、library.json、agent.md、verification.json。修改 examples 后同步指南，展示代码由生成器读取同一文件；不得手写第二份。不得将库替换为 Mock 后标记 SDK PASS。

第22轮附加：任务卡片终态只能通过 `job-policy.mjs` 的状态转换演进；跨 Demo level 先销毁旧批次所有权。官方 SDK 的 clearQueue/AbortSignal 测试与纯 Node 状态机测试必须分别记账。
