import dayGridPlugin from '@fullcalendar/react/daygrid'
import interactionPlugin from '@fullcalendar/react/interaction'
import listPlugin from '@fullcalendar/react/list'
import zhCn from '@fullcalendar/react/locales/zh-cn'
import classicTheme from '@fullcalendar/react/themes/classic'
import timeGridPlugin from '@fullcalendar/react/timegrid'

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end?: string
  allDay?: boolean
}
export const PLUGINS = [classicTheme, dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]
export const LOCALE = zhCn
export const ZONE = 'America/New_York'
export const INITIAL: CalendarEvent[] = [
  { id: 'rss-plan', title: '发布订阅目录', start: '2026-11-01', allDay: true },
  { id: 'review', title: '工程复盘', start: '2026-11-02T14:00:00Z', end: '2026-11-02T15:00:00Z' },
  { id: 'two-days', title: '两天校对', start: '2026-11-03', end: '2026-11-05', allDay: true },
]
export const FOLD: CalendarEvent[] = [
  { id: 'fold-early', title: 'DST 01:30（UTC−04）', start: '2026-11-01T01:30:00-04:00' },
  { id: 'fold-late', title: 'DST 01:30（UTC−05）', start: '2026-11-01T01:30:00-05:00' },
]
export function seedEvents(advanced: boolean): CalendarEvent[] {
  return (advanced ? [...INITIAL, ...FOLD] : INITIAL).map((event) => ({ ...event }))
}
