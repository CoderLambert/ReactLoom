import assert from 'node:assert/strict'
import test from 'node:test'
import { initialOrderState, isFreshDrop, reduceOrder } from '../examples/pinned-order.ts'

test('reorder and undo preserve stable IDs', () => {
  const initial = initialOrderState()
  const changed = reduceOrder(initial, { type: 'move', from: 0, to: 2, visibleCount: 5 })
  assert.deepEqual(
    changed.items.map((x) => x.id),
    ['frontend', 'rss', 'ai', 'global', 'notes'],
  )
  const restored = reduceOrder(changed, { type: 'undo' })
  assert.deepEqual(restored.items, initial.items)
  assert.equal(restored.revision, 2)
})
test('pinned slot and cross-group moves cannot mutate channel order', () => {
  const s = initialOrderState()
  for (const [from, to] of [
    [0, 4],
    [3, 2],
    [4, 0],
  ]) {
    const next = reduceOrder(s, { type: 'move', from, to, visibleCount: 5 })
    assert.strictEqual(next.items, s.items)
    assert.equal(next.revision, 0)
  }
})
test('basic level only reorders visible slice', () => {
  const s = reduceOrder(initialOrderState(), { type: 'move', from: 2, to: 0, visibleCount: 3 })
  assert.deepEqual(
    s.items.map((x) => x.id),
    ['rss', 'ai', 'frontend', 'global', 'notes'],
  )
})
test('stale drop rejected after keyboard reorder, reset, undo, and level change', () => {
  const base = initialOrderState()
  const snap = { ids: base.items.map((x) => x.id), revision: base.revision, level: 'advanced' }
  assert.equal(isFreshDrop(snap, base, 'advanced', 0, 'ai', 5), true)
  assert.equal(isFreshDrop(snap, base, 'business', 0, 'ai', 5), false)
  assert.equal(isFreshDrop(snap, base, 'advanced', 0, 'rss', 5), false)
  let state = reduceOrder(base, { type: 'move', from: 0, to: 1, visibleCount: 5 })
  assert.equal(isFreshDrop(snap, state, 'advanced', 0, 'ai', 5), false)
  state = reduceOrder(state, { type: 'undo' })
  assert.equal(isFreshDrop(snap, state, 'advanced', 0, 'ai', 5), false)
  state = reduceOrder(state, { type: 'reset' })
  assert.equal(isFreshDrop(snap, state, 'advanced', 0, 'ai', 5), false)
})
test('old snapshots with invalid source/changed shape are rejected', () => {
  const state = initialOrderState()
  const snap = { ids: state.items.map((x) => x.id), revision: 0, level: 'business' }
  assert.equal(isFreshDrop(snap, state, 'business', -1, 'ai', 5), false)
  assert.equal(isFreshDrop(snap, state, 'business', 0.5, 'ai', 5), false)
  assert.equal(isFreshDrop(snap, state, 'business', 0, 'ai', 3), false)
  assert.equal(isFreshDrop(null, state, 'business', 0, 'ai', 5), false)
})

test('final reducer refuses a queued drop after a previously valid preflight becomes stale', () => {
  const base = initialOrderState()
  const snapshot = { ids: base.items.map((item) => item.id), revision: 0, level: 'advanced' }
  assert.equal(isFreshDrop(snapshot, base, 'advanced', 0, 'ai', 5), true)
  const changed = reduceOrder(base, { type: 'move', from: 0, to: 1, visibleCount: 5 })
  const ended = reduceOrder(changed, {
    type: 'drop',
    snapshot,
    level: 'advanced',
    from: 0,
    to: 2,
    draggableId: 'ai',
    visibleCount: 5,
    reason: 'DROP',
  })
  assert.strictEqual(ended.items, changed.items)
  assert.equal(ended.revision, changed.revision)
  assert.match(ended.message, /过期/)
})
test('cancel reason and absent destination never reach the final order write', () => {
  const base = initialOrderState()
  const snapshot = { ids: base.items.map((item) => item.id), revision: 0, level: 'advanced' }
  for (const candidate of [
    { reason: 'CANCEL', to: 2 },
    { reason: 'DROP', to: null },
  ] as const) {
    const ended = reduceOrder(base, {
      type: 'drop',
      snapshot,
      level: 'advanced',
      from: 0,
      draggableId: 'ai',
      visibleCount: 5,
      ...candidate,
    })
    assert.strictEqual(ended.items, base.items)
    assert.equal(ended.revision, 0)
  }
})
test('no-op reset invalidates sessions without manufacturing or replacing an undo point', () => {
  const base = initialOrderState()
  const unchanged = reduceOrder(base, { type: 'reset' })
  assert.strictEqual(unchanged.items, base.items)
  assert.equal(unchanged.previous, null)
  assert.equal(unchanged.revision, 1)
  const changed = reduceOrder(base, { type: 'move', from: 0, to: 1, visibleCount: 5 })
  const reset = reduceOrder(changed, { type: 'reset' })
  const repeated = reduceOrder(reset, { type: 'reset' })
  assert.strictEqual(repeated.previous, reset.previous)
  assert.strictEqual(repeated.items, reset.items)
  assert.equal(repeated.revision, reset.revision + 1)
})
test('dropping at the same position preserves revision and the existing undo point', () => {
  const changed = reduceOrder(initialOrderState(), {
    type: 'move',
    from: 0,
    to: 1,
    visibleCount: 5,
  })
  const unchanged = reduceOrder(changed, { type: 'move', from: 1, to: 1, visibleCount: 5 })
  assert.strictEqual(unchanged.items, changed.items)
  assert.strictEqual(unchanged.previous, changed.previous)
  assert.equal(unchanged.revision, changed.revision)
  assert.match(unchanged.message, /原位置/)
})
