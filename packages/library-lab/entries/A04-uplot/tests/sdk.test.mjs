import assert from 'node:assert/strict'
import test from 'node:test'
import uPlot from 'uplot'
import { createSeries, START, WINDOW } from '../examples/series-data.ts'

test('actual uPlot.join aligns distinct timestamps and preserves explicit gaps', () => {
  const result = uPlot.join([
    [
      [1, 3],
      [10, null],
    ],
    [
      [2, 3],
      [20, 40],
    ],
  ])
  assert.deepEqual(result[0], [1, 2, 3])
  assert.equal(result[1][0], 10)
  assert.equal(result[1][1], undefined, 'SDK alignment artifacts are not measured zeros')
  assert.equal(result[1][2], null, 'explicit null remains a missing measurement')
  assert.equal(result[2][1], 20)
  assert.equal(result[2][2], 40)
})
test('the business Demo uses actual SDK alignment and normalizes gaps without losing measured zero', () => {
  const data = createSeries(28, 0, 'business')
  assert.equal(data.length, 3)
  assert.deepEqual(
    data.map((column) => column.length),
    [28, 28, 28],
  )
  assert.equal(data[0][0], START)
  assert.equal(data[0][1] - data[0][0], 60, 'time axis input is Unix seconds')
  assert.equal(data[2][0], 3)
  assert.equal(data[2][1], null, 'no three-minute measurement at minute one')
  assert.equal(data[2][3], 0, 'measured zero at minute three remains zero')
})
test('same Demo alignment stays bounded after many simulated samples', () => {
  const data = createSeries(100, 10_000, 'business')
  assert.deepEqual(
    data.map((column) => column.length),
    [WINDOW, WINDOW, WINDOW],
  )
  assert.equal(data[0][0], START + 10_000 * 60)
  assert.equal(data[0].at(-1), START + 10_099 * 60)
  assert.ok(data[0].every((value, index, values) => index === 0 || value > values[index - 1]))
})
