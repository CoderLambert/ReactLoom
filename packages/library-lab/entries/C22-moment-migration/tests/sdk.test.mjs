import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { calendarReport, instantReport, scheduleComparison } from '../examples/migration.mjs'

test('shared real Day.js/date-fns path strictly validates calendar days and leap years', () => {
  for (const value of ['2026-02-30', '2025-02-29', '2026-2-01', '0001-01-01']) {
    assert.equal(calendarReport(value).valid, false, value)
  }
  assert.equal(calendarReport('2024-02-29').valid, true)
})

test('shared real SDK path maps tokens and uses immutable add return values', () => {
  const report = calendarReport('2026-11-01')
  assert.equal(report.valid, true)
  assert.equal(report.dayjsFormat, '2026/11/01')
  assert.equal(report.dateFnsFormat, '2026/11/01')
  assert.equal(report.dayjsNext, '2026-11-02')
  assert.equal(report.dateFnsNext, '2026-11-02')
  assert.equal(report.originalAfterAdd, '2026-11-01')
})

test('shared date-fns ISO path rejects missing offsets, overflow dates and 24:00 recipe inputs', () => {
  for (const input of [
    '2026-11-01T01:30:00',
    '2026-02-30T05:30:00Z',
    '2026-11-01T24:00:00Z',
    '2026-11-01T05:30Z',
  ]) {
    assert.equal(instantReport(input, 'UTC').valid, false, input)
  }
  assert.equal(
    instantReport('2026-11-01T05:30:00.123Z', 'UTC').isoInstant,
    '2026-11-01T05:30:00.123Z',
  )
})

test('real offset parsing preserves the two fall-back instants while Intl changes only display', () => {
  const early = instantReport('2026-11-01T01:30:00-04:00', 'America/New_York')
  const late = instantReport('2026-11-01T01:30:00-05:00', 'America/New_York')
  const shanghai = instantReport('2026-11-01T01:30:00-04:00', 'Asia/Shanghai')
  assert.equal(early.isoInstant, '2026-11-01T05:30:00.000Z')
  assert.equal(late.isoInstant, '2026-11-01T06:30:00.000Z')
  assert.equal(shanghai.isoInstant, early.isoInstant)
  assert.match(early.displayed, /01:30:00/)
  assert.match(late.displayed, /01:30:00/)
  assert.match(shanghai.displayed, /13:30:00/)
})

test('real TZDate/addDays/addHours distinguishes 23/25/24-hour NY civil days', () => {
  const spring = scheduleComparison('spring')
  const fall = scheduleComparison('fall')
  const ordinary = scheduleComparison('ordinary')
  assert.equal(spring.calendarElapsedHours, 23)
  assert.equal(fall.calendarElapsedHours, 25)
  assert.equal(ordinary.calendarElapsedHours, 24)
  assert.equal(spring.calendarNext, '2026-03-08 12:00 -04:00')
  assert.equal(spring.elapsedNext, '2026-03-08 13:00 -04:00')
  assert.equal(fall.calendarNext, '2026-11-01 12:00 -05:00')
  assert.equal(fall.elapsedNext, '2026-11-01 11:00 -05:00')
  for (const report of [spring, fall, ordinary]) {
    assert.equal(report.elapsedHours, 24)
    assert.equal(report.originalAfterBoth, report.start)
  }
})

test('SDK helpers keep their declared semantics in a process whose OS timezone skips a civil date', () => {
  const moduleUrl = new URL('../examples/migration.mjs', import.meta.url).href
  const script = `import {calendarReport,scheduleComparison} from ${JSON.stringify(moduleUrl)}; console.log(JSON.stringify({day:calendarReport('2011-12-30'),dst:scheduleComparison('spring')}));`
  const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    env: { ...process.env, TZ: 'Pacific/Apia' },
    encoding: 'utf8',
  })
  assert.equal(child.status, 0, child.stderr)
  const result = JSON.parse(child.stdout)
  assert.equal(result.day.valid, true)
  assert.equal(result.day.dayjsNext, '2011-12-31')
  assert.equal(result.day.dateFnsNext, '2011-12-31')
  assert.equal(result.dst.calendarElapsedHours, 23)
})
