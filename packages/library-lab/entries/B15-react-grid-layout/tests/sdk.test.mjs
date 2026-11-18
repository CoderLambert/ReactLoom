import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { useContainerWidth } from 'react-grid-layout'
import { calcGridItemPosition, calcXY, collides, verticalCompactor } from 'react-grid-layout/core'

test('real grid calculations map cell coordinates to pixels and back with margin and padding', () => {
  const params = {
    containerWidth: 1210,
    cols: 12,
    rowHeight: 78,
    margin: [10, 10],
    containerPadding: [10, 10],
    maxRows: Infinity,
  }
  const position = calcGridItemPosition(params, 4, 0, 4, 2)
  assert.deepEqual(position, { left: 410, top: 10, width: 390, height: 166 })
  assert.deepEqual(calcXY(params, position.top, position.left, 4, 2), { x: 4, y: 0 })
})
test('real vertical compactor resolves collisions around a static item without mutating input', () => {
  const input = [
    { i: 'locked', x: 0, y: 0, w: 4, h: 2, static: true },
    { i: 'edit', x: 2, y: 0, w: 4, h: 2 },
    { i: 'tail', x: 8, y: 4, w: 4, h: 2 },
  ]
  const before = structuredClone(input)
  const result = verticalCompactor.compact(input, 12)
  assert.deepEqual(input, before)
  assert.equal(result[0].x, 0)
  assert.equal(result[0].y, 0)
  assert.equal(result[1].y, 2)
  assert.equal(result[2].y, 0)
  for (let i = 0; i < result.length; i++)
    for (let j = i + 1; j < result.length; j++) assert.equal(collides(result[i], result[j]), false)
})
function Probe({ measureBeforeMount }) {
  const { mounted, width } = useContainerWidth({ measureBeforeMount })
  return h('output', { 'data-mounted': String(mounted), 'data-width': width })
}
test('real hook defers initial render only when measureBeforeMount is explicitly enabled', () => {
  assert.equal(typeof document, 'undefined')
  assert.match(
    renderToStaticMarkup(h(Probe, { measureBeforeMount: true })),
    /data-mounted="false" data-width="1280"/,
  )
  assert.match(
    renderToStaticMarkup(h(Probe, { measureBeforeMount: false })),
    /data-mounted="true" data-width="1280"/,
  )
})
// Actual SDK numerical/SSR behavior, never a DOM drag/resize/ResizeObserver runtime PASS.
