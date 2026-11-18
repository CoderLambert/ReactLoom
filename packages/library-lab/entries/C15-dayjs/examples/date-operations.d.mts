export type Zone = 'America/New_York' | 'Asia/Shanghai' | 'UTC'
export const ZONES: readonly Zone[]
export interface BasicDateReport {
  input: string
  zhCN: string
  weekday: string
  immutable: { before: string; after: string; next: string; sameReference: boolean }
}
export interface CivilWindow {
  zone: Zone
  start: string
  end: string
  startInstant: string
  endInstant: string
  elapsedHours: number
  elapsedMs: number
}
export function strictDate(value: string): string
export function basicReport(civil: string): BasicDateReport
export function civilWindow(civil: string, zone: Zone): CivilWindow
export function twoFallbackInstants(): { instant: string; local: string }[]
