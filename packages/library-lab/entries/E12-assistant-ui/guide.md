# E12 assistant-ui — React Chat Runtime 和组件原语

## 选择理由
已经有自己的 HTTP 模型服务、需要聊天状态/工具调用/编辑/重新生成与取消的产品，可以使用 assistant-ui 的 LocalRuntime，并自己实现 ChatModelAdapter。它是 UI/运行时，不自带免费模型服务；Cloud、数据保存与语音功能需要独立配置，不纳入此演示。

## 依赖和最小代码
```bash
pnpm add @assistant-ui/react@0.15.21
```
`examples/example.tsx` 实际 `useLocalRuntime(adapter)`，通过 `AssistantRuntimeProvider` 包住 `ThreadPrimitive` / `MessagePrimitive` / `ComposerPrimitive`。版本处于0.x快速迭代，**PLATFORM 必须先安装并确认对应的 API 与 peers**；历史 `MessagePrimitive.Content`、旧 hooks、`submitOnEnter` 不能照搬。

## 三层任务
入门：用 Composer 输入，真实 runtime 将用户消息与本地 adapter 回复显示在 Thread。
业务：本地新闻研究回复分段流式 yield **累计文本**；fixture 是可确定复现的，不声称调用了 AI 或 RSS。
进阶：延迟分段、取消按钮和 AbortSignal，验证运行中离开 Tab 后旧消息不再被复用。不需要远端密钥。

## 真实模型接入指南
在目标项目将演示 adapter 替换为业务网关请求，`run({messages,abortSignal})` 应将 context、有效用户身份和模型配置传给服务端；流式模式用 `async *run` 且每次 yield 完整当前结果而不是单个 delta。传递 abortSignal 给 fetch/reader；不能在 React 函数组件渲染期间发起付费请求。多线程持久化要另配线程适配器，不能假设 LocalRuntime 自动跨刷新保存。

## 重要反例与修复
1. 向旧版聊天 UI API 传入当前组件属性：先锁包版本与官方 docs，再迁移。
2. 缺少 AssistantRuntimeProvider：子原语无上下文，输入无法正常发送。
3. 将 Mock adapter 返回当真实AI执行：必须在页面和测试中标记 fixture，不调用Provider。
4. 直接保存完整含密钥工具输出到 localStorage：应服务端权限隔离、保留策略，避免持久化秘密。
5. 一个新消息每次 delta 替换旧结果：累加后 yield 最新完整文本，不让 UI 闪烁。
6. 取消仅隐藏按钮不终止运行：应将实际 abortSignal 传给网络调用，卸载时释放运行时订阅。

## 组合推荐与练习
E11 Streamdown 可以作为逐条消息的 Markdown 渲染器；D07 TanStack Query 适合工具请求缓存，但 chat runtime 应有唯一所有者。练习：接入本地开发服务器的模拟 HTTP 200/422/503，断言回复、错误提示、取消，不需要收费模型。使用真实 Chromium 校验 Tab/Enter/IME/滚动与焦点。

## 验证状态
源码是真正的 `@assistant-ui/react` API 调用，但此批不具备依赖安装/构建/浏览器成功证据。验证前不可标 PASS。参考 https://www.assistant-ui.com/docs/runtimes/custom/local-runtime ，MIT。


## 取消运行与取消编辑不是同一件事（2026-10-27复核）

真正中止流式助手回复须调用 `useAui().thread.cancelRun()`，可用 `useAuiState(s => s.thread.isRunning && s.thread.capabilities.cancel)` 控制按钮禁用状态。`ComposerPrimitive.Cancel` 负责取消**编辑/消息撰写**，不能拿来实现“停止模型回复”。进阶示例现通过 `StopResponse` 调用 thread action，Adapter 必须响应 abortSignal。参见官方 [State Outside the Thread](https://www.assistant-ui.com/docs/guides/state-outside-the-thread) 和 [Composer](https://www.assistant-ui.com/docs/primitives/composer)。该源码修正尚需真实 SDK/浏览器运行检查。

## 第22批：消息输入真正驱动确定性回复

此前三层示例只返回固定话术，`ChatModelAdapter.run({messages})` 并未读取用户内容。本批新增 `examples/reply-policy.mjs`：仅读取**最新一条user消息**的text片段，忽略assistant/tool内容与非文本part，去除控制字符并限160个Unicode字符。响应明确标记本地fixture，business 不假装真实抓取RSS。流式 `async *run` 通过 `cumulativeChunks` 逐次yield完整累积文本（不是delta），继续检查 `abortSignal`。Node策略测试 `node --test entries/E12-assistant-ui/examples/reply-policy.test.mjs` 不加载assistant-ui，SDK/真实DOM取消仍未验证。
