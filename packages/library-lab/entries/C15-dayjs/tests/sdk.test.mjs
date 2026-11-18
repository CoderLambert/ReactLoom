import assert from 'node:assert/strict'
import test from 'node:test'
import dayjs from 'dayjs'
import {
  basicReport,
  civilWindow,
  strictDate,
  twoFallbackInstants,
} from '../examples/date-operations.mjs'
import { resolveExplicitZonedInstant } from '../examples/offset-instant.mjs'

test('actual shared strict Day.js parsing rejects overflow and keeps valid leap days', () => {
  assert.equal(dayjs.utc('2026-02-30', 'YYYY-MM-DD', true).isValid(), false)
  assert.throws(() => strictDate('2026-02-30'))
  assert.throws(() => strictDate('2026-2-28'))
  assert.equal(strictDate('2028-02-29'), '2028-02-29')
})
test('actual add is immutable and instance Chinese locale leaves the global default unchanged', () => {
  const globalBefore = dayjs.locale()
  const result = basicReport('2026-03-07')
  assert.deepEqual(result.immutable, {
    before: '2026-03-07',
    after: '2026-03-07',
    next: '2026-03-08',
    sameReference: false,
  })
  assert.equal(result.zhCN, '2026年3月7日')
  assert.equal(result.weekday, '星期六')
  assert.equal(dayjs.locale(), globalBefore)
})
test('shared real timezone windows observe NY23/25h and Shanghai/UTC24h', () => {
  for (const [civil, zone, hours] of [
    ['2026-03-07', 'America/New_York', 23],
    ['2026-10-31', 'America/New_York', 25],
    ['2026-03-07', 'Asia/Shanghai', 24],
    ['2026-03-07', 'UTC', 24],
  ]) {
    const result = civilWindow(civil, zone)
    assert.equal(result.elapsedHours, hours)
    assert.equal(result.elapsedMs, hours * 3600000)
    assert.equal(dayjs(result.endInstant).diff(dayjs(result.startInstant), 'hour', true), hours)
  }
})
test('actual UTC-to-zone conversion retains distinct offsets at the same wall clock', () => {
  const result = twoFallbackInstants()
  assert.equal(result[0].local, '2026-11-01 01:30 -04:00')
  assert.equal(result[1].local, '2026-11-01 01:30 -05:00')
  assert.equal(dayjs(result[1].instant).diff(dayjs(result[0].instant), 'hour', true), 1)
})
test('actual shared roundtrip accepts both disambiguated fall-back instants', () => {
  assert.equal(
    resolveExplicitZonedInstant('2026-11-01T01:30:00-04:00', 'America/New_York').instant,
    '2026-11-01T05:30:00.000Z',
  )
  assert.equal(
    resolveExplicitZonedInstant('2026-11-01T01:30:00-05:00', 'America/New_York').instant,
    '2026-11-01T06:30:00.000Z',
  )
  assert.equal(
    resolveExplicitZonedInstant('2026-11-01T05:30:12Z', 'UTC').wall,
    '2026-11-01T05:30:12',
  )
})
test('application shape guards and real timezone roundtrip reject invalid inputs', () => {
  for (const input of [
    '2026-03-08T02:30:00-05:00',
    '2026-11-01T01:30:00-06:00',
    '2026-11-01T01:30:00',
    '2026-02-30T10:00:00-05:00',
    '2026-11-01T01:30:99-04:00',
    '2026-11-01T24:00:00-04:00',
    '2026-11-01T01:30:00-00:00',
    '2026-11-01T01:30:00+14:01',
  ])
    assert.throws(() => resolveExplicitZonedInstant(input, 'America/New_York'), input)
})
