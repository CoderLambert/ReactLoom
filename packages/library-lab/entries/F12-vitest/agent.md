# F12 Vitest — Agent 迁移手册

优先用于 Vite/TS/React 项目的纯函数、异步数据流、状态与可注入服务测试。与 F11 MSW 负责的网络层、F13 Playwright 负责的真实浏览器职责分开。

**示例**：`examples/domain.ts` 为纯业务逻辑，`basic.test.ts` 覆盖输入约束，`business.test.ts` 使用真实 Vitest vi.fn + it.each 运行 200/422/503 场景，`advanced.test.ts` 用 fake timers 和 AbortSignal 验证旧结果不可回写。直接从这些真实文件迁移，不需要 Lab 页面运行器。

**配置**：在目标 package 安装并锁定 vitest，按实际 Vite/Node/TS 兼容矩阵核验；真实执行 `pnpm exec vitest run <path>`。仅当命令成功退出并保存日志/版本时记录 PASS。

**反例**：业务 Mock 当作真实后端验证；Vitest Mock 目标SDK后称集成通过；忘记恢复 vi.useRealTimers；异步 expect 不 await；用 jsdom 模拟结果冒充真实浏览器可访问性。
**迁移验收**：输入拒绝、场景矩阵、取消代次、超时、请求信号和真实 CLI 断言；E2E 另由 Playwright 承担。
当前测试文件仅已提交，实际 Vitest runner 未执行，状态 NOT_RUN/BLOCKED。许可 MIT。https://vitest.dev/guide/


迁移新增：verifyCode 必须在调用 request 前、收到 Response 后以及 await response.json() 后分别检查 signal.aborted；不能只在发起 fetch 前检查。取消错误统一保持 AbortError，generation 处理并行旧结果，活动错误不得吞掉。参看 business.test.ts 的请求体延迟解码案例与 advanced.test.ts 的 reject ownership 测试；这些源码存在不表示真实 Vitest 已运行。
