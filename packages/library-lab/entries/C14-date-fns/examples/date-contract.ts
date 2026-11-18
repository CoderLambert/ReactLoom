import { TZDate, tz } from '@date-fns/tz'
import {
  addDays,
  differenceInCalendarDays,
  differenceInHours,
  format,
  isValid,
  parseISO,
} from 'date-fns'
import { assertExplicitInstant } from './instant-policy.mjs'

export const ZONES = ['America/New_York', 'Asia/Shanghai', 'UTC'] as const
export type Zone = (typeof ZONES)[number]
export type Level = 'basic' | 'business' | 'advanced'
export type CalculationInput = { civil: string; zone: Zone; count: number; instant: string }
export const DEFAULT_INPUT: CalculationInput = {
  civil: '2026-03-07',
  zone: 'America/New_York',
  count: 1,
  instant: '2026-11-01T01:30:00-04:00',
}

export function isZone(value: string): value is Zone {
  return ZONES.some((zone) => zone === value)
}

export function parseCivilDate(raw: string, zone: Zone): TZDate {
  if (!isZone(zone)) throw new Error('请选择支持的 IANA 时区')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error('只接受 YYYY-MM-DD')
  const [year, month, day] = raw.split('-').map(Number)
  if (year < 1901 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error('本例日历日期范围为 1901–9999 年，月份和日期必须有效')
  }
  // This modern scheduling recipe deliberately excludes historical second-level offsets.
  // Use public TZDate setters, then validate every requested wall-clock field.
  const date = TZDate.tz(zone, 0)
  date.setFullYear(year, month - 1, day)
  date.setHours(12, 0, 0, 0)
  if (
    !isValid(date) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== 12 ||
    date.getMinutes() !== 0 ||
    date.getSeconds() !== 0 ||
    date.getMilliseconds() !== 0
  ) {
    throw new Error('非法日历日期：禁止自动进位（如2月30日）')
  }
  return date
}

export function parseInstant(value: string): Date {
  const date = parseISO(assertExplicitInstant(value))
  if (!isValid(date)) throw new Error('事件时间不是合法 ISO 8601')
  return date
}

export function planCivilDays(civil: string, zone: Zone, count: number) {
  if (!Number.isSafeInteger(count) || count < 1 || count > 14) throw new RangeError('天数范围1–14')
  const start = parseCivilDate(civil, zone)
  const end = addDays(start, count, { in: tz(zone) })
  if (!isValid(end) || end.getFullYear() < 1901 || end.getFullYear() > 9999) {
    throw new RangeError('计算结果超出本例 1901–9999 年日历范围')
  }
  return {
    zone,
    start: format(start, 'yyyy-MM-dd HH:mm XXX', { in: tz(zone) }),
    end: format(end, 'yyyy-MM-dd HH:mm XXX', { in: tz(zone) }),
    calendarDays: differenceInCalendarDays(end, start, { in: tz(zone) }),
    elapsedHours: differenceInHours(end, start),
  }
}

export function calculateDateResult(level: Level, input: CalculationInput) {
  if (level === 'basic') {
    const date = parseCivilDate(input.civil, input.zone)
    return {
      kind: 'civil',
      input: { civil: input.civil, zone: input.zone },
      calendarDate: format(date, 'yyyy-MM-dd', { in: tz(input.zone) }),
      localNoon: format(date, 'HH:mm XXX', { in: tz(input.zone) }),
      instantUTC: new Date(+date).toISOString(),
    }
  }
  if (level === 'business') {
    return {
      kind: 'calendar-schedule',
      input: { civil: input.civil, zone: input.zone, count: input.count },
      schedule: planCivilDays(input.civil, input.zone, input.count),
      note: '这里只计算日历排程，不注册浏览器 Cron 或发布任务',
    }
  }
  if (level === 'advanced') {
    return {
      kind: 'dst-and-instant',
      input: { instant: input.instant },
      spring: planCivilDays('2026-03-07', 'America/New_York', 1),
      fall: planCivilDays('2026-10-31', 'America/New_York', 1),
      instantUTC: parseInstant(input.instant).toISOString(),
      ambiguousLocalTime: ['2026-11-01T01:30:00-04:00', '2026-11-01T01:30:00-05:00'].map((value) =>
        parseInstant(value).toISOString(),
      ),
    }
  }
  throw new Error('未知日期计算目标')
}
