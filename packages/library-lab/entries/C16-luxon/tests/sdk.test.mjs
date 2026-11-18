import assert from 'node:assert/strict'
import test from 'node:test'
import { DateTime, Interval, Settings } from 'luxon'
import { calendarDayView, dailyWindow, parseCalendarDay } from '../examples/calendar.mjs'
import { inspectWallTime, resolveWallTime } from '../examples/wall-time.mjs'

console.log(
  'Actual host:',
  JSON.stringify({
    node: process.version,
    icu: process.versions.icu,
    tz: process.versions.tz,
    intl: Intl.DateTimeFormat().resolvedOptions(),
  }),
)
test('real Luxon reports invalid civil input and page calendar contract rejects it', () => {
  assert.equal(DateTime.fromISO('2026-02-30T12:00:00', { zone: 'UTC' }).isValid, false)
  assert.throws(() => parseCalendarDay('2026-02-30', 'UTC'), /非法日期/)
  assert.throws(() => parseCalendarDay('2026-3-7', 'UTC'), /YYYY-MM-DD/)
})
test('shared calendar-day window differs from elapsed 24 hours across DST and is half-open', () => {
  for (const [day, hours, fixedHour] of [
    ['2026-03-07', 23, 13],
    ['2026-10-31', 25, 11],
    ['2026-03-09', 24, 12],
  ]) {
    const result = dailyWindow(day, 'America/New_York')
    const start = DateTime.fromISO(result.start, { setZone: true })
    const end = DateTime.fromISO(result.end, { setZone: true })
    assert.equal(Interval.fromDateTimes(start, end).length('hours'), hours)
    assert.equal(result.elapsedHours, hours)
    assert.equal(result.calendarDays, 1)
    assert.equal(start.hour, 12)
    assert.equal(end.hour, 12)
    assert.equal(DateTime.fromISO(result.after24Hours, { setZone: true }).hour, fixedHour)
    assert.equal(result.containsStart, true)
    assert.equal(result.containsEnd, false)
  }
})
test('real Luxon exposes both possible offsets for repeated local time', () => {
  const value = DateTime.fromISO('2026-11-01T01:30:00', { zone: 'America/New_York' })
  const offsets = value.getPossibleOffsets()
  assert.equal(offsets.length, 2)
  assert.deepEqual(
    offsets.map((date) => date.offset).sort((a, b) => a - b),
    [-300, -240],
  )
})
test('actual Luxon rejects nonexistent spring-forward wall clock and implicit fallback', () => {
  assert.throws(() => resolveWallTime('2026-03-08T02:30', 'America/New_York'), /不存在/)
  assert.throws(() => resolveWallTime('2026-11-01T01:30', 'America/New_York'), /必须明确选择/)
  assert.throws(() => inspectWallTime('2026-03-08T02:30', 'America/New_York'), /不存在/)
})
test('actual Luxon resolves both fallback offsets to two exact instants', () => {
  const early = resolveWallTime('2026-11-01T01:30', 'America/New_York', '-04:00')
  const late = resolveWallTime('2026-11-01T01:30', 'America/New_York', '-05:00')
  assert.equal(early.instant, '2026-11-01T05:30:00.000Z')
  assert.equal(late.instant, '2026-11-01T06:30:00.000Z')
  assert.throws(() => resolveWallTime('2026-11-01T01:30', 'America/New_York', '-06:00'), /不匹配/)
})
test('page candidate inspection exposes choices without silently resolving the overlap', () => {
  const result = inspectWallTime('2026-11-01T01:30', 'America/New_York')
  assert.deepEqual(result.candidates.map((item) => item.offset).sort(), ['-04:00', '-05:00'])
  assert.deepEqual(result.candidates.map((item) => item.instant).sort(), [
    '2026-11-01T05:30:00.000Z',
    '2026-11-01T06:30:00.000Z',
  ])
  assert.equal(resolveWallTime('2026-03-09T12:00', 'America/New_York').offset, '-04:00')
})
test('page display-zone conversion changes clock/date but preserves the exact instant and global settings', () => {
  const previousZone = Settings.defaultZone
  const previousNow = Settings.now
  const result = calendarDayView('2026-03-07', 'America/New_York', 'Asia/Shanghai')
  assert.equal(result.calendarDay, '2026-03-07')
  assert.equal(result.source.iso, '2026-03-07T12:00:00.000-05:00')
  assert.equal(result.display.iso, '2026-03-08T01:00:00.000+08:00')
  assert.equal(result.source.instant, result.display.instant)
  assert.equal(result.source.epochMillis, result.display.epochMillis)
  assert.equal(result.sameInstant, true)
  assert.strictEqual(Settings.defaultZone, previousZone)
  assert.strictEqual(Settings.now, previousNow)
})
test('shared calendar contract also rejects unsupported zones and skipped civil dates by roundtrip', () => {
  assert.throws(() => parseCalendarDay('2026-03-07', 'Not/A_Zone'), /非法日期/)
  assert.throws(() => parseCalendarDay('2011-12-30', 'Pacific/Apia'), /非法日期/)
})
