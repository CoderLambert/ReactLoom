# E12 assistant-ui — 工程手册

## 适用

需要会话原语、composer 和可取消的本地 runtime。不提供模型。流式 Markdown 渲染用别的库。服务端消息副本不要和 runtime 抢写。

## 版本

`@assistant-ui/react@0.15.21`，MIT。适配器是 `ChatModelAdapter`，runtime 是 `useLocalRuntime`。回复策略在 `examples/reply-policy.mjs`。

## 迁移

复制 `examples/example.tsx` 的 provider、primitives 和生成器。`examples/demo.tsx` 只是再导出。保持累计 yield，不改成 delta。`makeLocalReply` 只读最近 user 文本。产品替换适配器时保留 AbortSignal 检查，密钥不要进仓库。

## 不可删的清理

`key={level}` 重建 runtime。sleep 必须订阅 abort 并在清理时清定时器。signal 已中止就 return，不再 yield。停止按钮只在 `isRunning && capabilities.cancel` 时可用。换层或卸载不得继续写已卸下的会话。

## 反例

- yield 增量片段。
- 适配器里 fetch 模型或执行工具命令。
- 读取 tool 消息里的秘密。
- 忽略 AbortSignal。
- 不设 key 换层。
- `dangerouslySetInnerHTML` 渲染回复。
- Query 和 runtime 双写同一数组。
- 把模板回复当成模型评测 PASS。

## 测试断言

- 空消息有固定占位。文本被裁到 160 个码位，控制字符被替换。
- `cumulativeChunks` 的后一项包含前一项。
- 未知 level 抛错。
- 浏览器：停止后不再增长；没有外网聊天请求。
- 策略测试不是 assistant-ui SDK PASS。

## 真实限制

没有持久化、没有工具确认 UI、没有 Markdown 渲染、没有真实流式模型。延迟是 `setTimeout`，不是 token 速率。读屏未测。

## 证据

sdk、build、browser 保持 NOT_RUN，直到 `docs/library-lab/evidence/runs/` 有 E12 收据。Actions `41779873259` 是仓库级运行，不是本条目 PASS。

资料：https://www.assistant-ui.com/docs/runtimes/custom/local-runtime 。
