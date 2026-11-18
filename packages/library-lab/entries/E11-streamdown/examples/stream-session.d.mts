export interface StreamSession {
  status: 'ready' | 'playing' | 'paused' | 'completed' | 'ended'
  received: number
  markdown: string
}
export interface SessionAction {
  type: 'start' | 'pause' | 'next' | 'tick' | 'end' | 'reset'
}
export const initialSession: StreamSession
export function transitionSession(
  state: StreamSession,
  action: SessionAction,
  chunks: readonly string[],
): StreamSession
