export type DisplayZone = 'America/New_York' | 'Asia/Shanghai' | 'UTC'
export type FixtureId = 'spring' | 'fall' | 'ordinary'
export const DISPLAY_ZONES: readonly DisplayZone[]
export const DST_FIXTURES: readonly { id: FixtureId; label: string; month: number; day: number }[]
export function isDisplayZone(value: string): value is DisplayZone
export function calendarReport(input: string):
  | { valid: false; input: string; reason: string }
  | {
      valid: true
      input: string
      dayjsFormat: string
      dateFnsFormat: string
      dayjsNext: string
      dateFnsNext: string
      originalAfterAdd: string
    }
export function instantReport(
  input: string,
  zone: DisplayZone,
):
  | { valid: false; input: string; zone: DisplayZone; reason: string }
  | { valid: true; input: string; isoInstant: string; zone: DisplayZone; displayed: string }
export function scheduleComparison(fixtureId: FixtureId): {
  fixture: FixtureId
  zone: string
  start: string
  calendarNext: string
  calendarElapsedHours: number
  elapsedNext: string
  elapsedHours: number
  originalAfterBoth: string
}
