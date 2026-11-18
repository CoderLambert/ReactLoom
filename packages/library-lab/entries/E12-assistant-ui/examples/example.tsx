import {
  AssistantRuntimeProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
  useAui,
  useAuiState,
  useLocalRuntime,
} from '@assistant-ui/react'
import { useEffect, useMemo } from 'react'
import { createLocalAdapter } from './local-adapter.mjs'

type Level = 'basic' | 'business' | 'advanced'
function StopResponse() {
  const aui = useAui()
  const canStop = useAuiState((s) => s.thread.isRunning && s.thread.capabilities.cancel)
  return (
    <button type="button" disabled={!canStop} onClick={() => aui.thread.cancelRun()}>
      停止响应
    </button>
  )
}
function LocalPlayground({ level }: { level: Level }) {
  const session = useMemo(() => createLocalAdapter(level), [level])
  const runtime = useLocalRuntime(session.adapter)
  useEffect(() => () => session.abortAll(), [session])
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ThreadPrimitive.Root style={{ border: '1px solid #dce2dc', borderRadius: 10, padding: 14 }}>
        <ThreadPrimitive.Viewport
          style={{
            minHeight: 240,
            maxHeight: 310,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 9,
          }}
        >
          <ThreadPrimitive.Messages>
            {({ message }) => (
              <MessagePrimitive.Root
                data-testid={message.role === 'user' ? 'assistant-user' : 'assistant-reply'}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  background: message.role === 'user' ? '#edf3e8' : '#f4f4f1',
                }}
              >
                <strong>{message.role === 'user' ? '用户' : '本地适配器'}</strong>
                <div data-testid={message.role === 'user' ? 'user-text' : 'assistant-text'}>
                  <MessagePrimitive.Parts />
                </div>
                <MessagePrimitive.Error>
                  <p role="alert">本地模拟失败；重新提问可恢复。</p>
                </MessagePrimitive.Error>
              </MessagePrimitive.Root>
            )}
          </ThreadPrimitive.Messages>
        </ThreadPrimitive.Viewport>
        <ComposerPrimitive.Root style={{ display: 'flex', gap: 9, marginTop: 12 }}>
          <ComposerPrimitive.Input
            aria-label="向本地适配器提问"
            placeholder="输入内容后点发送，/error模拟失败…"
            submitMode="none"
            minRows={3}
            style={{ flex: 1 }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <ComposerPrimitive.Send>发送</ComposerPrimitive.Send>
            {level === 'advanced' && <StopResponse />}
          </div>
        </ComposerPrimitive.Root>
      </ThreadPrimitive.Root>
    </AssistantRuntimeProvider>
  )
}
export default function AssistantUiExample({ level }: { level: Level }) {
  return (
    <section aria-label="assistant-ui真实运行时实验">
      <h2>
        {level === 'basic'
          ? '聊天状态与组件原语'
          : level === 'business'
            ? '本地新闻研究提示'
            : '流式输出与取消'}
      </h2>
      <p>
        真正使用 useLocalRuntime、AssistantRuntimeProvider 与 UI primitives；ChatModelAdapter
        是明确声明的本地 fixture，完全不访问AI模型或云端API。
      </p>
      <p>显式点击发送；输入/error模拟失败后再提问恢复。未接模型、检索或消息数据库。</p>
      <LocalPlayground key={level} level={level} />
    </section>
  )
}
