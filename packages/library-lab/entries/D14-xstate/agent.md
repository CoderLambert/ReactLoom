# D14 XState — Agent 决策与移植手册

用在状态受明确事件驱动、存在 guarded transition/重试/流程取消的业务。不要为了三个状态值给整个项目改用 XState。

## 从哪个文件复制
`examples/example.tsx` 中的 `reviewMachine` 可移植，替换领域事件类型与 context；不要复制课程 UI。保留 Actor 订阅、`stop()` 与 React Strict Mode 重建生命周期；若流程跨页面持久化，应将 Actor owner 置于服务层并设计序列化策略。

## API 与约束
目标 xstate@5.33.3：`setup`、`createMachine`、`createActor`、`assign`。状态合法性必须由机器守卫保证，不能只靠禁用按钮。Actor 的 `send` 不是 RPC 请求、不会自动进行权限审查；服务端仍要验证业务转换。异步 invoke 的取消/旧结果与同步 demo 不同，必须单独集成。

## 验证门槛
`node --test entries/D14-xstate/tests/sdk.test.mjs` 验证实际 SDK；TS/build/Browser 分别记录证据。至少断言无效事件不转换、retries 上限、RESET、卸载无订阅。当前这些环节尚未执行，不能标 PASS。

替代 D10 Zustand（简单状态）；组合 C01 RHF 和 D07 Query。官方 https://stately.ai/docs/ 。

复制状态机时必须同时复制 `review-policy.mjs` / `.d.mts`，因为程序发出的 REJECT 事件绕过按钮 disabled。后端仍需审稿授权，200 字符上限是本示例的领域规则而非 SDK 限制。
