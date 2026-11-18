import assert from 'node:assert/strict'
import test from 'node:test'
import { formatDate, version } from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import { LOCALE, PLUGINS } from '../examples/calendar-contract.ts'

test('actual v7 React shared plugin and locale contracts match the installed SDK', () => {
  assert.equal(version, '7.1.3')
  assert.ok(PLUGINS.includes(dayGridPlugin))
  assert.ok(PLUGINS.includes(timeGridPlugin))
  assert.equal(PLUGINS.length, 5)
  assert.equal(LOCALE.code, 'zh-cn')
})
test('actual FullCalendar formatter distinguishes explicit fold instants in UTC', () => {
  const options = {
    timeZone: 'UTC',
    locale: 'en',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }
  const early = formatDate('2026-11-01T01:30:00-04:00', options)
  const late = formatDate('2026-11-01T01:30:00-05:00', options)
  assert.equal(early, '05:30')
  assert.equal(late, '06:30')
  assert.notEqual(early, late)
  // Actual public SDK formatting, not bare Date arithmetic or calendar DOM/dragging.
})
