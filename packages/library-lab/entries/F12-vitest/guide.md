# Vitest：可重复的单测、场景矩阵与取消竞态验证

## 选型与职责

Vitest 是测试发现、执行、断言、Mock/Spy、隔离、覆盖率和项目分组工具。它**不是 Mock 网络服务**，也不等同真实 Chromium E2E。纯函数/类型映射、缓存键、请求重试、取消与状态流优先用 Vitest；网络拦截可配 F11 MSW，真正键盘/拖拽/跨浏览器行为使用 F13 Playwright。

采用研究基线 `vitest@5.0.5`，MIT；在应用内保留 **CLI/Node 的真实测试源码**，而不是伪造一个能在网页里执行测试进程的窗口。目前该库示例设计为 `node-ci` 类型，Demo Tab 应显示源码与命令，执行证据以真实测试日志为准。

## 安装与运行

```bash
pnpm --filter @reactloom/library-lab add -D vitest@5.0.5
cd packages/library-lab
pnpm exec vitest run entries/F12-vitest/examples/basic.test.ts
pnpm exec vitest run entries/F12-vitest/examples/business.test.ts
pnpm exec vitest run entries/F12-vitest/examples/advanced.test.ts
```

安装依赖应由 PLATFORM 单独修改 package/lockfile；上面的 add 是可复现的命令，不授权分组通道修改共享依赖。所有测试直接 import `vitest`，必须执行真实 runner 才算 SDK 验收通过。

## 配方一：基本输入约束

`examples/domain.ts` 的 `normalizeFeedURL` 实现 HTTPS URL 规范化与凭据拒绝；`basic.test.ts` 使用 `it.each` 枚举合法、异常和危险协议。测试反例是把非法 URI 简单跳过而不断言返回预期错误。构造 URL 时没有真实网络请求，适合作为平台快速单元测试。

## 配方二：业务 Scenario Matrix

`business.test.ts` 的三组固定场景为 HTTP 200、422、503。通过依赖注入的 `request(signal)` 返回本地 `Response`，直接断言解析结果；`vi.fn` 断言请求确实收到相同 signal。**模拟的是业务后端，不是 Mock Vitest 本身。** 如果目标是验证 MSW 的真实拦截，应运行 F11 独立 Node/Service Worker 测试。

## 配方三：过期结果不回写

`advanced.test.ts` 用 `vi.useFakeTimers()` 和 `advanceTimersByTimeAsync` 实际驱动计时器，验证旧请求取消后即使晚到也返回 null，新的结果生效。另用一个忽略 AbortSignal 的 Promise 检查 generation 防线。通过 `afterEach` 恢复真实计时器，防止污染其他测试。异步 expect 必须 await，尤其是 rejects、poll、事件等待。

## 工程实践

1. **断言行为而非实现细节**：关注输出、取消、错误恢复，而不是复制源码内部对象结构作快照。
2. **测试分层**：Node 单测和 jsdom DOM 测试不能冒充 Chromium 浏览器或屏幕阅读器；环境选择必须显示在运行报告。
3. **时间与网络所有权**：fake timers 需要恢复；全局 fetch Mock 可能污染并发测试，业务层优先显式注入请求函数。
4. **可复现性**：在 CI 中固定 Node、Vitest、Vite 和 lockfile；异步定时事件不要依赖真实 sleep。
5. **分组回归**：仅受影响条目执行定向文件；共享策略变化再扩大测试，不强迫每次跑全部 119 项。
6. **测试结果表达**：应保存命令、exit code、commit SHA、依赖和报告。测试源码存在 ≠ PASS；运行环境不可用则 NOT_RUN/BLOCKED。

## 常见错误

- 把 `vi.fn` 一次被调用当成真实 HTTP 请求已成功。
- `expect(promise).rejects.toThrow` 不 await，导致异步断言漏执行。
- fake timers 开启后未恢复，导致其他测试超时或假阳性。
- 在无 DOM 的 Node 环境使用浏览器组件，错误地判定 SDK 行为失败。
- 为简单纯函数造全套 E2E，拖慢 CI；按价值与风险选择层次。

## 验收

3 个 test 文件实际通过后记录具体命令与输出，并补 `pnpm --filter @reactloom/library-lab typecheck`。E2E/真实网页在本节点并非适用的 SDK 主门槛；无需为每个命令行工具强制添加伪 React Demo。

官方 [写测试](https://vitest.dev/guide/learn/writing-tests) · [CLI](https://vitest.dev/guide/cli) · [配置](https://vitest.dev/config/)。
