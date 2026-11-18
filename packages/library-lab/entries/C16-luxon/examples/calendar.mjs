import { DateTime, Interval } from 'luxon'

export function parseCalendarDay(value, zone) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('必须输入 YYYY-MM-DD')
  const date = DateTime.fromISO(`${value}T12:00:00`, { zone, setZone: true, locale: 'zh-CN' })
  if (!date.isValid || date.toISODate() !== value) {
    throw new Error(`非法日期：${date.invalidExplanation ?? value}`)
  }
  return date
}

export function calendarDayView(value, zone, displayZone) {
  const source = parseCalendarDay(value, zone)
  const display = source.setZone(displayZone)
  if (!display.isValid) throw new Error(display.invalidExplanation ?? '显示时区无效')
  return {
    valid: source.isValid,
    calendarDay: source.toISODate(),
    source: {
      zone: source.zoneName,
      iso: source.toISO(),
      instant: source.toUTC().toISO(),
      epochMillis: source.toMillis(),
      offset: source.toFormat('ZZ'),
    },
    display: {
      zone: display.zoneName,
      iso: display.toISO(),
      instant: display.toUTC().toISO(),
      epochMillis: display.toMillis(),
      formatted: display.toLocaleString(DateTime.DATE_FULL),
    },
    sameInstant: source.toMillis() === display.toMillis(),
  }
}

export function dailyWindow(value, zone) {
  const start = parseCalendarDay(value, zone)
  const next = start.plus({ days: 1 })
  const fixedHours = start.plus({ hours: 24 })
  const interval = Interval.fromDateTimes(start, next)
  if (!next.isValid || !interval.isValid)
    throw new Error(interval.invalidExplanation ?? '无法构造区间')
  return {
    start: start.toISO(),
    end: next.toISO(),
    elapsedHours: interval.length('hours'),
    calendarDays: next.diff(start, 'days').days,
    zone: start.zoneName,
    after24Hours: fixedHours.toISO(),
    containsStart: interval.contains(start),
    containsEnd: interval.contains(next),
    lastIncluded: next.minus({ milliseconds: 1 }).toISO(),
  }
}

export function ambiguousFallback() {
  const date = DateTime.fromISO('2026-11-01T01:30:00', { zone: 'America/New_York' })
  if (!date.isValid) throw new Error(date.invalidExplanation ?? '无法解析')
  return date.getPossibleOffsets().map((item) => ({
    local: item.toFormat('yyyy-MM-dd HH:mm ZZZ'),
    instant: item.toUTC().toISO(),
  }))
}
