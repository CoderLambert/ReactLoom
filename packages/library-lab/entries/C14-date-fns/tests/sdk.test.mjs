import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { tz } from '@date-fns/tz'
import { addDays, format } from 'date-fns'
import {
  calculateDateResult,
  DEFAULT_INPUT,
  parseCivilDate,
  parseInstant,
  planCivilDays,
  ZONES,
} from '../examples/date-contract.ts'

test('actual shared TZDate calendar parser enforces its modern range and rejects overflow', () => {
  for (const zone of ZONES) {
    for (const value of ['1901-01-01', '2024-02-29', '9999-12-31']) {
      const date = parseCivilDate(value, zone)
      assert.equal(format(date, 'yyyy-MM-dd', { in: tz(zone) }), value)
      assert.deepEqual(
        [date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()],
        [12, 0, 0, 0],
      )
    }
    assert.equal(
      format(parseCivilDate('2024-02-29', zone), 'yyyy-MM-dd', { in: tz(zone) }),
      '2024-02-29',
    )
    for (const value of [
      '0000-01-01',
      '0096-02-29',
      '1900-12-31',
      '2026-02-30',
      '1900-02-29',
      '2026-13-01',
      '2026-2-01',
    ]) {
      assert.throws(() => parseCivilDate(value, zone), Error, zone + ':' + value)
    }
  }
})

test('actual shared scheduling distinguishes calendar days, elapsed hours and bounded results', () => {
  assert.equal(planCivilDays('2026-03-07', 'America/New_York', 1).elapsedHours, 23)
  assert.equal(planCivilDays('2026-10-31', 'America/New_York', 1).elapsedHours, 25)
  for (const zone of ['Asia/Shanghai', 'UTC']) {
    const result = planCivilDays('2026-03-07', zone, 1)
    assert.equal(result.calendarDays, 1)
    assert.equal(result.elapsedHours, 24)
  }
  for (const count of [0, 15, 1.5, NaN])
    assert.throws(() => planCivilDays('2026-03-07', 'UTC', count), RangeError)
  assert.throws(() => planCivilDays('9999-12-31', 'UTC', 1), RangeError)
  const start = parseCivilDate('2026-03-07', 'America/New_York')
  const before = +start
  const end = addDays(start, 1, { in: tz('America/New_York') })
  assert.equal(+start, before)
  assert.notEqual(end, start)
})

test('actual advanced contract consumes only its explicit instant and resolves distinct fallback offsets', () => {
  const result = calculateDateResult('advanced', {
    ...DEFAULT_INPUT,
    civil: 'irrelevant-invalid-draft',
    count: 0,
  })
  assert.equal(result.spring.elapsedHours, 23)
  assert.equal(result.fall.elapsedHours, 25)
  assert.deepEqual(result.ambiguousLocalTime, [
    '2026-11-01T05:30:00.000Z',
    '2026-11-01T06:30:00.000Z',
  ])
  assert.equal(result.instantUTC, '2026-11-01T05:30:00.000Z')
  assert.throws(() => parseInstant('2026-11-01T01:30:00'), Error)
  assert.throws(() => parseInstant('2026-11-01T01:30:00-00:00'), Error)
})

test('actual shared contract produces the same schedule under three host TZ settings', () => {
  const moduleUrl = new URL('../examples/date-contract.ts', import.meta.url).href
  const script =
    'import {planCivilDays,parseCivilDate} from ' +
    JSON.stringify(moduleUrl) +
    '; process.stdout.write(JSON.stringify({schedule:planCivilDays("2026-03-07","America/New_York",1),year:parseCivilDate("1901-01-01","UTC").getFullYear()}));'
  const outputs = []
  for (const hostZone of ['UTC', 'America/Los_Angeles', 'Asia/Shanghai']) {
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      env: { ...process.env, TZ: hostZone },
      encoding: 'utf8',
      timeout: 5000,
    })
    assert.equal(child.status, 0, child.stderr)
    outputs.push(JSON.parse(child.stdout))
  }
  assert.deepEqual(outputs[1], outputs[0])
  assert.deepEqual(outputs[2], outputs[0])
  assert.equal(outputs[0].year, 1901)
  assert.equal(outputs[0].schedule.elapsedHours, 23)
})

test('actual explicit-offset low/high-year instants remain independent of modern calendar limits', () => {
  for (const [input, expected] of [
    ['0001-01-01T00:00:00Z', '0001-01-01T00:00:00.000Z'],
    ['0096-02-29T00:00:00Z', '0096-02-29T00:00:00.000Z'],
    ['0096-02-29T00:00:00+08:00', '0096-02-28T16:00:00.000Z'],
    ['9999-12-31T23:59:59.999Z', '9999-12-31T23:59:59.999Z'],
  ])
    assert.equal(parseInstant(input).toISOString(), expected)
  const zoned = parseCivilDate('2026-03-07', 'America/New_York')
  assert.equal(format(zoned, 'yyyy-MM-dd HH:mm XXX'), '2026-03-07 12:00 -05:00')
  assert.equal(
    format(new Date(+zoned), 'yyyy-MM-dd HH:mm XXX', { in: tz('UTC') }),
    '2026-03-07 17:00 Z',
  )
})
