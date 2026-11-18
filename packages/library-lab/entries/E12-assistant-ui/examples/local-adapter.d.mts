import type { ChatModelAdapter } from '@assistant-ui/react'
import type { ReplyLevel } from './reply-policy.mjs'
export function abortableSleep(ms: number, signal: AbortSignal): Promise<void>
export function createLocalAdapter(level: ReplyLevel): {
  adapter: ChatModelAdapter
  abortAll(): void
}
