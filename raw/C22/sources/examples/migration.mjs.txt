import { TZDate, tz } from '@date-fns/tz'
import { addDays, addHours, format, isValid, parseISO } from 'date-fns'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(customParseFormat)
dayjs.extend(utc)

export const DISPLAY_ZONES = ['America/New_York', 'Asia/Shanghai', 'UTC']
export const DST_FIXTURES = [
  { id: 'spring', label: '春季跳时前一天：2026-03-07', month: 2, day: 7 },
  { id: 'fall', label: '秋季回拨前一天：2026-10-31', month: 9, day: 31 },
  { id: 'ordinary', label: '普通冬日：2026-01-10', month: 0, day: 10 },
]

const UTC_CONTEXT = { in: tz('UTC') }
const CIVIL_PATTERN = /^[1-9]\d{3}-\d{2}-\d{2}$/
const INSTANT_PATTERN =
  /^[1-9]\d{3}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/

export function isDisplayZone(value) {
  return DISPLAY_ZONES.includes(value)
}

/** UTC is only a stable validation carrier; the returned civil day remains a string. */
export function calendarReport(input) {
  const parsedDayjs = dayjs.utc(input, 'YYYY-MM-DD', true)
  const parsedDateFns = parseISO(`${input}T00:00:00Z`, UTC_CONTEXT)
  if (
    !CIVIL_PATTERN.test(input) ||
    !parsedDayjs.isValid() ||
    !isValid(parsedDateFns) ||
    format(parsedDateFns, 'yyyy-MM-dd', UTC_CONTEXT) !== input
  ) {
    return {
      valid: false,
      input,
      reason: '请输入 1000–9999 年的 YYYY-MM-DD 有效日历日期。',
    }
  }
  const nextDayjs = parsedDayjs.add(1, 'day')
  const nextDateFns = addDays(parsedDateFns, 1, UTC_CONTEXT)
  return {
    valid: true,
    input,
    dayjsFormat: parsedDayjs.format('YYYY/MM/DD'),
    dateFnsFormat: format(parsedDateFns, 'yyyy/MM/dd', UTC_CONTEXT),
    dayjsNext: nextDayjs.format('YYYY-MM-DD'),
    dateFnsNext: format(nextDateFns, 'yyyy-MM-dd', UTC_CONTEXT),
    originalAfterAdd: parsedDayjs.format('YYYY-MM-DD'),
  }
}

export function instantReport(input, zone) {
  if (!isDisplayZone(zone)) throw new RangeError('Unsupported display zone')
  const parsed = parseISO(input)
  if (!INSTANT_PATTERN.test(input) || !isValid(parsed)) {
    return {
      valid: false,
      input,
      zone,
      reason: '请输入含秒和 Z 或 ±HH:mm 偏移的有效 ISO 时间点；不接受无偏移的本地时间。',
    }
  }
  return {
    valid: true,
    input,
    isoInstant: parsed.toISOString(),
    zone,
    displayed: new Intl.DateTimeFormat('zh-CN', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).format(parsed),
  }
}

export function scheduleComparison(fixtureId) {
  const fixture = DST_FIXTURES.find(({ id }) => id === fixtureId)
  if (!fixture) throw new RangeError('Unknown DST fixture')
  const zone = 'America/New_York'
  const context = { in: tz(zone) }
  const start = new TZDate(2026, fixture.month, fixture.day, 12, 0, 0, zone)
  const calendarNext = addDays(start, 1, context)
  const elapsedNext = addHours(start, 24, context)
  const render = (date) => format(date, 'yyyy-MM-dd HH:mm XXX', context)
  return {
    fixture: fixture.id,
    zone,
    start: render(start),
    calendarNext: render(calendarNext),
    calendarElapsedHours: (calendarNext.getTime() - start.getTime()) / 3_600_000,
    elapsedNext: render(elapsedNext),
    elapsedHours: (elapsedNext.getTime() - start.getTime()) / 3_600_000,
    originalAfterBoth: render(start),
  }
}
