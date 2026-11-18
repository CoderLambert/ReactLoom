import assert from 'node:assert/strict'
import test from 'node:test'
import Gantt from 'frappe-gantt'
import {
  MAX_PLAN_DATE,
  MIN_PLAN_DATE,
  toChartTasks,
  validatePlan,
} from '../examples/plan-policy.mjs'

// Actual installed Gantt prototype methods run against their own prototype instance.
// No DOM constructor, replacement methods, fake browser or mocked SDK is used.
function model(tasks, view = 'Week') {
  const instance = Object.create(Gantt.prototype)
  instance.options = { infinite_padding: false }
  instance.config = {
    unit: view === 'Month' ? 'month' : 'day',
    step: view === 'Week' ? 7 : 1,
    view_mode: {
      padding: view === 'Day' ? '7d' : view === 'Week' ? '1m' : '2m',
      date_format: 'YYYY-MM-DD',
    },
  }
  instance.setup_tasks(tasks)
  instance.setup_gantt_dates(false)
  instance.setup_date_values()
  return instance
}
const task = (start, end) => ({
  id: 'task-1',
  name: '<draft> & review',
  start,
  end,
  progress: 25,
  dependencies: '',
})

test('real Gantt exports constructor but no public destroy/dispose', () => {
  assert.equal(typeof Gantt, 'function')
  assert.equal(Gantt.prototype.destroy, undefined)
  assert.equal(Gantt.prototype.dispose, undefined)
})

test('actual SDK mutates only the escaped descriptors copied at the application boundary', () => {
  const source = [task('2026-10-27', '2026-10-29')]
  const before = structuredClone(source)
  const instance = model(toChartTasks(source))
  assert.deepEqual(source, before)
  assert.equal(source[0].name, '<draft> & review')
  assert.equal(instance.tasks[0].name, '&lt;draft&gt; &amp; review')
  assert.ok(instance.tasks[0]._start instanceof Date)
  assert.deepEqual(instance.tasks[0].dependencies, [])
})

test('real SDK padding exposes the low-year arithmetic boundary excluded by our policy', () => {
  const low = [task('0100-01-01', '0100-01-02')]
  const instance = model(toChartTasks(low))
  assert.equal(instance.dates[0].getFullYear(), 99)
  assert.ok(instance.dates[1].getFullYear() >= 1900, 'subsequent numeric Date aliases year 99')
  assert.match(validatePlan(low), /0101.*SDK/)
})

test('real Day/Week/Month date recipes stay ordered and bounded at both admitted date edges', () => {
  for (const date of [MIN_PLAN_DATE, MAX_PLAN_DATE]) {
    const source = [task(date, date)]
    assert.equal(validatePlan(source), null)
    for (const view of ['Day', 'Week', 'Month']) {
      const instance = model(toChartTasks(source), view)
      console.log(
        JSON.stringify({
          admittedDate: date,
          view,
          columns: instance.dates.length,
          first: instance.dates[0].toISOString(),
          last: instance.dates.at(-1).toISOString(),
          years: [instance.dates[0].getFullYear(), instance.dates.at(-1).getFullYear()],
        }),
      )
      assert.ok(instance.dates.length > 2 && instance.dates.length < 150)
      for (let i = 1; i < instance.dates.length; i++) {
        assert.ok(instance.dates[i].getTime() > instance.dates[i - 1].getTime())
        assert.ok(instance.dates[i].getFullYear() >= 100 && instance.dates[i].getFullYear() < 10000)
      }
    }
  }
})
