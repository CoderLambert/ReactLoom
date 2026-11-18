import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import 'dayjs/locale/zh-cn.js'
import './offset-instant.mjs'

// UTC/timezone are registered by the shared offset module; plugins are process-wide.
dayjs.extend(customParseFormat)
export const ZONES = Object.freeze(['America/New_York', 'Asia/Shanghai', 'UTC'])
export function strictDate(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !dayjs.utc(value, 'YYYY-MM-DD', true).isValid()
  ) {
    throw new Error('日历日期必须为真实存在的 YYYY-MM-DD；拒绝自动进位')
  }
  return value
}
export function basicReport(civil) {
  const value = dayjs.utc(strictDate(civil), 'YYYY-MM-DD', true)
  const before = value.format('YYYY-MM-DD')
  const next = value.add(1, 'day')
  return {
    input: civil,
    zhCN: value.locale('zh-cn').format('YYYY年M月D日'),
    weekday: value.locale('zh-cn').format('dddd'),
    immutable: {
      before,
      after: value.format('YYYY-MM-DD'),
      next: next.format('YYYY-MM-DD'),
      sameReference: next === value,
    },
  }
}
export function civilWindow(civil, zone) {
  if (!ZONES.includes(zone)) throw new Error('时区须从演示允许的 IANA 时区中选择')
  const startDate = strictDate(civil)
  // Compute the next calendar label independently of the device's local timezone.
  const nextCivil = strictDate(
    dayjs.utc(startDate, 'YYYY-MM-DD', true).add(1, 'day').format('YYYY-MM-DD'),
  )
  const start = dayjs.tz(startDate + ' 12:00', 'YYYY-MM-DD HH:mm', zone)
  const end = dayjs.tz(nextCivil + ' 12:00', 'YYYY-MM-DD HH:mm', zone)
  return {
    zone,
    start: start.format('YYYY-MM-DD HH:mm Z'),
    end: end.format('YYYY-MM-DD HH:mm Z'),
    startInstant: start.toISOString(),
    endInstant: end.toISOString(),
    elapsedHours: end.diff(start, 'hour', true),
    elapsedMs: end.valueOf() - start.valueOf(),
  }
}
export function twoFallbackInstants() {
  return ['2026-11-01T05:30:00Z', '2026-11-01T06:30:00Z'].map((instant) => ({
    instant,
    local: dayjs.utc(instant).tz('America/New_York').format('YYYY-MM-DD HH:mm Z'),
  }))
}
