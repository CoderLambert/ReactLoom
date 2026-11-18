import type { DateTime } from 'luxon'
export interface CalendarView {
  valid: boolean
  calendarDay: string
  source: { zone: string; iso: string; instant: string; epochMillis: number; offset: string }
  display: { zone: string; iso: string; instant: string; epochMillis: number; formatted: string }
  sameInstant: boolean
}
export interface DailyWindow {
  start: string
  end: string
  elapsedHours: number
  calendarDays: number
  zone: string
  after24Hours: string
  containsStart: boolean
  containsEnd: boolean
  lastIncluded: string
}
export declare function parseCalendarDay(value: string, zone: string): DateTime<true>
export declare function calendarDayView(
  value: string,
  zone: string,
  displayZone: string,
): CalendarView
export declare function dailyWindow(value: string, zone: string): DailyWindow
export declare function ambiguousFallback(): { local: string; instant: string }[]
