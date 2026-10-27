import test from 'node:test';
import assert from 'node:assert/strict';
import {initialOrderState, reduceOrder, isFreshDrop} from '../examples/pinned-order.ts';
test('reorder and undo preserve stable IDs', () => {
  const initial = initialOrderState();
  const changed = reduceOrder(initial, {type: 'move', from: 0, to: 2, visibleCount: 5});
  assert.deepEqual(changed.items.map(x => x.id), ['frontend', 'rss', 'ai', 'global', 'notes']);
  const restored = reduceOrder(changed, {type: 'undo'});
  assert.deepEqual(restored.items, initial.items);
  assert.equal(restored.revision, 2);
});
test('pinned slot and cross-group moves cannot mutate channel order', () => {
  const s = initialOrderState();
  for (const [from, to] of [[0, 4], [3, 2], [4, 0]]) {
    const next = reduceOrder(s, {type: 'move', from, to, visibleCount: 5});
    assert.strictEqual(next.items, s.items);
    assert.equal(next.revision, 0);
  }
});
test('basic level only reorders visible slice', () => {
  const s = reduceOrder(initialOrderState(), {type: 'move', from: 2, to: 0, visibleCount: 3});
  assert.deepEqual(s.items.map(x => x.id), ['rss', 'ai', 'frontend', 'global', 'notes']);
});
test('stale drop rejected after keyboard reorder, reset, undo, and level change', () => {
  const base = initialOrderState();
  const snap = {ids: base.items.map(x => x.id), revision: base.revision, level: 'advanced'};
  assert.equal(isFreshDrop(snap, base, 'advanced', 0, 'ai', 5), true);
  assert.equal(isFreshDrop(snap, base, 'business', 0, 'ai', 5), false);
  assert.equal(isFreshDrop(snap, base, 'advanced', 0, 'rss', 5), false);
  let state = reduceOrder(base, {type: 'move', from: 0, to: 1, visibleCount: 5});
  assert.equal(isFreshDrop(snap, state, 'advanced', 0, 'ai', 5), false);
  state = reduceOrder(state, {type: 'undo'});
  assert.equal(isFreshDrop(snap, state, 'advanced', 0, 'ai', 5), false);
  state = reduceOrder(state, {type: 'reset'});
  assert.equal(isFreshDrop(snap, state, 'advanced', 0, 'ai', 5), false);
});
test('old snapshots with invalid source/changed shape are rejected', () => {
  const state = initialOrderState();
  const snap = {ids: state.items.map(x => x.id), revision: 0, level: 'business'};
  assert.equal(isFreshDrop(snap, state, 'business', -1, 'ai', 5), false);
  assert.equal(isFreshDrop(snap, state, 'business', 0.5, 'ai', 5), false);
  assert.equal(isFreshDrop(snap, state, 'business', 0, 'ai', 3), false);
  assert.equal(isFreshDrop(null, state, 'business', 0, 'ai', 5), false);
});
