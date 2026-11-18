import assert from 'node:assert/strict'
import test from 'node:test'
import { scaleLinear } from 'd3'
import { createGeometry, createMetricPaths, HEIGHT, MARGIN } from '../examples/chart-geometry.ts'
import { READING_FIXTURE } from '../examples/chart-policy.ts'

// Real D3 numerical/shape APIs only. No document, pseudo SVG or SDK mock.
// Axis/join/DOM identity and cleanup belong to the real browser recipe.
test('real linear/band scales map the shared fixture into reversed SVG coordinates', () => {
  const calibration = scaleLinear().domain([0, 100]).range([240, 20])
  assert.equal(calibration(0), 240)
  assert.equal(calibration(50), 130)
  assert.equal(calibration(100), 20)
  const before = structuredClone(READING_FIXTURE)
  const geometry = createGeometry(READING_FIXTURE, 620)
  assert.deepEqual(
    geometry.x.domain(),
    READING_FIXTURE.map((row) => row.day),
  )
  assert.deepEqual(geometry.x.range(), [MARGIN.left, 620 - MARGIN.right])
  assert.ok(geometry.x.bandwidth() > 0)
  assert.ok(geometry.x('周二') > geometry.x('周一'))
  assert.equal(geometry.y(0), HEIGHT - MARGIN.bottom)
  assert.ok(geometry.y(112) < geometry.y(48))
  assert.ok(Math.abs(geometry.y.invert(geometry.y(73)) - 73) < 1e-10)
  assert.deepEqual(READING_FIXTURE, before, 'display nice() never changes domain records')
})

test('real line/monotone paths encode distinct metrics and defined() gaps without fake zeroes', () => {
  const geometry = createGeometry(READING_FIXTURE, 620)
  const paths = createMetricPaths(READING_FIXTURE, geometry)
  assert.deepEqual(
    paths.map((item) => item.key),
    ['views', 'saves'],
  )
  for (const item of paths) {
    assert.match(item.path, /^M/)
    assert.match(item.path, /C/)
    assert.doesNotMatch(item.path, /NaN|Infinity/)
  }
  assert.notEqual(paths[0].path, paths[1].path)
  const withGap = READING_FIXTURE.map((row) => ({ ...row }))
  withGap[2].saves = Number.NaN
  const gapped = createMetricPaths(withGap, createGeometry(withGap, 620))[1].path
  assert.equal((gapped.match(/M/g) ?? []).length, 2)
  assert.doesNotMatch(gapped, /NaN|Infinity/)
  assert.deepEqual(
    createMetricPaths([], createGeometry([], 620)).map((item) => item.path),
    [null, null],
  )
  console.log(
    'Actual D3 geometry:',
    JSON.stringify({
      xDomain: geometry.x.domain(),
      yDomain: geometry.y.domain(),
      bandwidth: geometry.x.bandwidth(),
      pathLengths: paths.map((item) => item.path.length),
    }),
  )
})
