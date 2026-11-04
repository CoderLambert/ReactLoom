import type { Demo } from './types'
export const GANTT_PROTOCOL: 'reactloom-gantt-v1'
export const GANTT_SESSION: RegExp
export const GANTT_APP_ORIGINS: readonly string[]
export function ganttRunnerOrigin(appOrigin: string): string | null
export function isRegisteredGanttDemo(entryId: string, demo: Demo): boolean
export function isGanttPacket(data: unknown, session: string, direction: 'start' | 'event'): boolean
export interface GanttFrameEvent {
  type: 'loading' | 'running' | 'closed' | 'error'
  message?: string
}
export interface GanttFrameSession {
  session: string
  frame: HTMLIFrameElement
  dispose(): void
}
export function createGanttFrameSession(options: {
  window?: Window
  container: HTMLElement
  level: Demo['level']
  onEvent(event: GanttFrameEvent): void
  startupTimeoutMs?: number
}): GanttFrameSession
