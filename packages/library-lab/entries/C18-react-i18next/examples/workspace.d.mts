import type { i18n } from 'i18next'
import type { Language } from './language-switch.mjs'
export declare const resources: {
  zh: {
    common: { title: string; greeting: string; legal: string }
    feed: { unread_other: string; label: string }
  }
  en: {
    common: { title: string; greeting: string; legal: string }
    feed: { unread_one: string; unread_other: string; label: string }
  }
}
export declare function isLanguage(value: unknown): value is Language
export interface WorkspaceSnapshot {
  ready: boolean
  manual: boolean
  requested: Language
  committed: Language
  actual: string
  activeTarget: Language | null
  awaitingRelease: boolean
  error: string
  events: number
  status: 'initializing' | 'ready' | 'switching' | 'error'
}
export interface Workspace {
  instance: i18n
  snapshot(): WorkspaceSnapshot
  start(): Promise<void>
  request(language: Language): void
  setManual(enabled: boolean): void
  release(): void
  reject(): void
  dispose(): void
}
export declare function createWorkspace(
  initial: Language,
  notify?: (snapshot: WorkspaceSnapshot) => void,
): Workspace
