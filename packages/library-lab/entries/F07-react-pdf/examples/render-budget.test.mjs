import assert from 'node:assert/strict'
import test from 'node:test'
import { getPageGeometry } from './render-budget.mjs'

test('both giant and tall viewports fit before canvas, with explicit DPR 1', () => {
  for (const viewport of [
    { width: 1e12, height: 1e12 },
    { width: 1, height: 1e12 },
    { width: 612, height: 792 },
  ]) {
    const result = getPageGeometry(viewport, 1.5)
    assert.ok(result.width <= 1080 && result.height <= 1440)
    assert.ok(result.width * result.height <= 1555200)
  }
})
test('nonfinite, zero geometry and unsupported zoom reject', () => {
  for (const width of [0, -1, Infinity, NaN])
    assert.throws(() => getPageGeometry({ width, height: 100 }, 1))
  assert.throws(() => getPageGeometry({ width: 100, height: 100 }, 99))
})
