# assistant-ui 0.15.21｜本地 Runtime、累计流式输出和取消

`library.json` 钉住 `@assistant-ui/react@0.15.21`，MIT。它提供聊天原语和 runtime，不提供模型，也不代替你们的消息数据库。本示例的回复来自 `examples/reply-policy.mjs`，不访问网络，不调用付费 API。

## Lab 当前示例

真实组件是 [`examples/example.tsx`](examples/example.tsx)。[`examples/demo.tsx`](examples/demo.tsx) 只再导出。策略函数与测试共用 `reply-policy.mjs`。

用户点开 Demo 后才创建 `useLocalRuntime`。`LocalPlayground` 的 `key={level}` 让三层各有一份会话。没有 `localhost:5173`，也没有隐藏的模型脚本。

挂载的原语：

- `ChatModelAdapter.run` 是异步生成器。
- `useLocalRuntime(adapter)` 与 `AssistantRuntimeProvider`。
- `ThreadPrimitive.Root` / `Viewport` / `Messages`。
- `MessagePrimitive.Root` / `Parts`。
- `ComposerPrimitive.Root` / `Input` / `Send`。
- advanced 才有「停止响应」：`useAui().thread.cancelRun()`，并且只在 `thread.isRunning && capabilities.cancel` 时可点。

回复内容：

- `makeLocalReply` 只读最近一条 user 文本，去掉控制字符，最多 160 个码位。没有 user 文本时用固定占位句。
- basic 一次 `yield` 整段。business 用 `cumulativeChunks(..., 24)`，advanced 用宽度 18。
- **yield 的是累计全文，不是增量 delta。** 下一段包含上一段的前缀。
- 每段之前 `sleep`：business 220ms，advanced 450ms。`AbortSignal` 已中止则直接 return。sleep 被取消时也 return，不把错误抛成一条假回复。

没有挂载：真实模型、工具调用确认卡片、E11 的流式 Markdown 渲染、TanStack Query、把消息写入服务器。助手气泡标题是「本地适配器」，避免看起来像远程模型。

## 1. 它解决什么

| 任务 | 判断 |
| --- | --- |
| 要一套可访问的会话布局、composer、取消 | 适合，runtime 自己接 |
| 要渲染模型的 Markdown | 另接渲染器，并净化。本示例的 Parts 只显示适配器返回的纯文本 |
| 要检索新闻或调用工具 | 不在此 Demo。适配器禁止凭空执行命令 |
| 消息要以服务端为准 | Query 或你们的存储拥有持久副本，runtime 拥有这一轮的进行中状态 |

不要把 UI 库说成已经接上了某个供应商。

## 2. 所有权

```text
Composer 输入
    │ 用户点发送
    ▼
LocalRuntime 消息列表（这一轮的所有者）
    │
    ▼
ChatModelAdapter.run({ messages, abortSignal })
    │ makeLocalReply → 累计片段
    ▼
MessagePrimitive.Parts 文本
```

持久化若存在，应在一轮结束时由产品代码写入，而不是让 runtime 和 Query 同时改同一数组。本示例不持久化。刷新后会话消失。

官方说明：[LocalRuntime](https://www.assistant-ui.com/docs/runtimes/custom/local-runtime)、[primitives](https://www.assistant-ui.com/docs/primitives)、[仓库](https://github.com/assistant-ui/assistant-ui)。

## 3. 三层

在 Library Lab 打开 E12 再运行。

### 基本

发送一句话。回复以「本地演示已收到」开头，并包含你输入的摘要。一次出现，不逐段。这不是推理。

### 业务

回复以「本地研究任务」开头，并说明没有检索实时新闻。文字按累计片段更新。不要把这段固定文案当成 RSS 已核对。

### 进阶

发送后在片段之间点「停止响应」。预期是生成器看到 `abortSignal.aborted` 后停止 yield。已经显示的累计文本可以留下。停止按钮在没有运行时禁用。取消后要再发送才有新的一轮。不要写成「模型已停止计费」——这里没有模型。

## 4. 反例（带代码）

### 反例 1：yield 增量却让 UI 再拼一次

```ts
yield { content: [{ type: 'text', text: delta }] }
```

本 runtime 的约定是每一段都是当前完整文本。若再把 delta 追加，句子会重复。`cumulativeChunks` 生成的是前缀。

### 反例 2：适配器里 fetch 模型

```ts
await fetch('https://api.example/chat', { body: JSON.stringify(messages) })
```

Lab 明确不离开浏览器。产品要接模型时单独做密钥、超时和日志脱敏，不要把密钥放进 `reply-policy.mjs`。

### 反例 3：忽略 AbortSignal

```ts
for (const part of segments) {
  await sleep(1000)
  yield { content: [{ type: 'text', text: part }] }
}
```

停止按钮会失效，卸载后仍可能 yield。Lab 在 sleep 之前和之后都看 signal，sleep 本身也会 reject。

### 反例 4：从工具消息里读秘密

```ts
messages.filter(m => m.role === 'tool')
```

`recentUserText` 只找最近的 `role === 'user'` 且 `type === 'text'`。不要读取 tool 载荷。

### 反例 5：换层却留着旧 runtime

不设 `key` 时，上一层的消息和未完成的 sleep 会留在同一 runtime。Lab 用 `key={level}`。

### 反例 6：把本地回复渲染成 Markdown HTML

```tsx
<div dangerouslySetInnerHTML={{ __html: text }} />
```

适配器文本是纯文本。若以后接模型 Markdown，用 E06 或 E11，并在 HTML sink 之前用 E10。不要在 Parts 里 innerHTML。

### 反例 7：两个状态源

Query 缓存一份消息，runtime 再存一份，两边都可写。进行中的流只属于 runtime。落库成功后再让 Query 成为已提交副本。失败时不要清空用户刚输入的 composer。

### 反例 8：用固定回复冒充评测通过

`makeLocalReply` 的模板句不能当模型质量分数。样例里出现的「NOT_RUN」字样若来自用户输入，只是被引用的文本。

## 5. 无障碍与失败

输入有 `aria-label`。发送是按钮。停止在不可用时 `disabled`。没有把颜色当成唯一状态。读屏是否读出逐段更新，没有收据。

适配器抛错时（未知 level）不应被 catch 成一条正常回复。UI 错误呈现以库的 runtime 行为为准，本指南不把它写成已经看过。

## 6. 组合（未挂载）

**E11。** 助手消息若是流式 Markdown，渲染交给 Streamdown 一类组件。本示例不渲染 Markdown。

**D07 TanStack Query。** 文章数据在 Query。聊天 runtime 只引用用户已经粘贴的文本。不要在适配器里 `queryClient.fetchQuery` 顺便发请求。

**E09 / E05。** 代码问答的只读块用 Shiki 文本节点。可编辑草稿用 Monaco。不要把代码字符串 eval。

## 7. 同类

| 方案 | 何时 |
| --- | --- |
| assistant-ui LocalRuntime | 要原语和可替换适配器 |
| 自己拼 textarea | 只有一问一答、不需要取消和消息列表 |
| 供应商官方组件 | 已经锁定该家协议，并接受其运行时 |

## 8. 升级核对

- 锁定 0.15.21。primitives 的复合组件名在小版本里也会变，以 [primitives](https://www.assistant-ui.com/docs/primitives) 为准再改导入。
- `ChatModelAdapter` 的 yield 形状保持累计文本。升级时用一条测试证明第二段包含第一段。
- 不要把 0.15 的 `useLocalRuntime` 换成未在本仓库钉住的云端 runtime。

## 9. 故障

| 现象 | 先看 |
| --- | --- |
| 回复重复 | 是否把累计片段又拼接了一次 |
| 停止无效 | sleep 是否理会 AbortSignal |
| 换层还看到旧消息 | `key` 是否还在 |
| 回复里没有用户的话 | 输入是否被当成非 text part |
| 出现网络请求 | 适配器是否被改成 fetch |

## 10. 验收

1. basic：回复包含输入摘要，且声明不是推理。
2. business：文本分几段变长，后一段包含前一段。
3. advanced：停止后不再增加文字。
4. 全程没有模型请求。
5. 卸载或换层后没有 setState 警告。

sdk、build、browser 保持 **NOT_RUN**。没有 `docs/library-lab/evidence/runs/` 的 E12 收据就不能写 PASS。Actions `41779873259` 是仓库级运行，不是本条目通过。

## 11. 资料

- https://www.assistant-ui.com/docs/runtimes/custom/local-runtime
- https://www.assistant-ui.com/docs/primitives
- https://github.com/assistant-ui/assistant-ui
