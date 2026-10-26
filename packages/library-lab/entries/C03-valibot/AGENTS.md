# C03 Valibot 维护约束

遵循上级 AGENTS.md。实际 SDK 是 valibot，不能改成手写 validator 后报告 SDK PASS。`examples/example.tsx` 是示例源码事实源，`demo.tsx` 仅为入口；新增功能同步 guide/agent 和 SDK 测试。原始 payload 不应泄漏到持久日志。验证结果记录 `verification.json`，未执行保持 NOT_RUN。
