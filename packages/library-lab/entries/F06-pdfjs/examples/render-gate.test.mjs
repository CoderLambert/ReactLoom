import test from 'node:test'
import assert from 'node:assert/strict'
import {createRenderGate} from './render-gate.mjs'

test('only one render touches the shared canvas at a time', async () => {
  const withCanvas = createRenderGate()
  let releaseFirst
  const wait = new Promise(resolve => {releaseFirst = resolve})
  const order = []
  const first = withCanvas(async () => {
    order.push('first start')
    await wait
    order.push('first end')
  })
  const second = withCanvas(async () => {order.push('second start')})
  await Promise.resolve()
  assert.deepEqual(order, ['first start'])
  releaseFirst()
  await Promise.all([first, second])
  assert.deepEqual(order, ['first start', 'first end', 'second start'])
})

test('a cancelled render rejecting does not poison subsequent operations', async () => {
  const withCanvas = createRenderGate()
  const seen = []
  const cancelled = withCanvas(async () => {
    seen.push('cancelled')
    throw Object.assign(new Error('cancel'), {name: 'RenderingCancelledException'})
  })
  const next = withCanvas(async () => {seen.push('next'); return 'completed'})
  await assert.rejects(cancelled, /cancel/)
  assert.equal(await next, 'completed')
  assert.deepEqual(seen, ['cancelled', 'next'])
})

test('stale queued render can skip work without blocking latest', async () => {
  const withCanvas = createRenderGate()
  let resolveRunning
  const running = new Promise(resolve => {resolveRunning = resolve})
  const first = withCanvas(() => running)
  let active = true
  const stale = withCanvas(() => active ? 'draw old' : 'skipped')
  const latest = withCanvas(() => 'draw latest')
  active = false
  resolveRunning()
  assert.deepEqual(await Promise.all([first, stale, latest]), [undefined, 'skipped', 'draw latest'])
})
