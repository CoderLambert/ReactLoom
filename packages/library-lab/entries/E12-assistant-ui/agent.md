# E12 assistant-ui — Agent 集成指导

**目标**：复用聊天运行时、消息原语和取消，不重复造一套会话状态机。适用于自有模型网关、局域网 AI、测试模式。演示使用真实助手 UI SDK + 本地确定性 `ChatModelAdapter`，未使用真实 AI，不应对外宣传为模型执行。
**基线**：`@assistant-ui/react@0.15.21`（安装前核实当前发行与 React19 peer）。参考官方 LocalRuntime 文档，避免旧 v0.12 的 API 示例。
**迁移入口**：`examples/example.tsx`；先复制 Adapter 的运行时接线与 Provider，再替换后端执行。UI 原语可按产品样式替换，不要把模拟回答复制进产品。
**必须保留**：AbortSignal 贯穿异步输出；流式多次 yield 为完整累计文本；Provider 环绕 primitives；未授权工具调用不能直接执行；服务端鉴权与数据保存策略另做。
**不要做**：混用旧 hooks / 新 primitives；通过客户端调用密钥；复制用户历史到测试fixture；擅自启用Cloud/付费功能；把断开的网络流伪装为回复完成。
**最小验收**：不挂载Provider时故意失败用例；用户发送、流式渲染、取消、卸载、重进、IME 和键盘无障碍。SDK/typecheck/build/browser 全部需要独立实际证据。
**关联**：E11 Streamdown流式文本、D07 Query请求缓存、F11 MSW网络场景矩阵。
**出处**：https://www.assistant-ui.com/docs/runtimes/custom/local-runtime


**取消语义警告**：不能用 `ComposerPrimitive.Cancel` 替代 `aui.thread.cancelRun()`。参考 `examples/example.tsx` 中 `StopResponse` 的 `useAui/useAuiState`，按 `thread.isRunning && thread.capabilities.cancel` 控制。Adapter 遇到 abortSignal 必须终止后续 yield；真实 DOM 需在点击停止后验证流不再追加。官方：https://www.assistant-ui.com/docs/guides/state-outside-the-thread 。


**离线fixture新入口**：配对复制 `examples/reply-policy.mjs`、`.d.mts` 和 `example.tsx`。用户输入必须来自 `run({messages})`，只消费最近user文本、限160字、排除tool/assistant内容；每段yield完整累计字符串。目标项目替换成真实模型网关时另做认证、服务端上下文预算、流中错误/取消，并禁止将本地回复当成可信模型事实或真实RSS。
