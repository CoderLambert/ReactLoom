import test from 'node:test';
import assert from 'node:assert/strict';
import {measuredStageWidth, stageScale, clampNodePosition, canAddNode, newNodePosition, MAX_NODES} from '../examples/stage-policy.ts';

test('narrow measured widths are not artificially inflated', () => {
  assert.equal(measuredStageWidth(187.8), 187);
  assert.equal(stageScale(187), 187 / 620);
  assert.equal(measuredStageWidth(0), 1);
  assert.equal(measuredStageWidth(Number.NaN), 1);
});
test('a large host preserves world scale and bounds width', () => {
  assert.equal(stageScale(900), 1);
  assert.equal(measuredStageWidth(1e8), 4096);
});
test('drag positions remain in stage logical coordinates', () => {
  assert.deepEqual(clampNodePosition({x: 900, y: 300}), {x: 488, y: 208});
  assert.deepEqual(clampNodePosition({x: -5.1, y: Number.NaN}), {x: 0, y: 0});
  assert.deepEqual(clampNodePosition({x: 124.6, y: 20.8}), {x: 125, y: 21});
});
test('only bounded integer node counts permit adding nodes', () => {
  assert.equal(canAddNode(MAX_NODES - 1), true);
  assert.equal(canAddNode(MAX_NODES), false);
  assert.equal(canAddNode(-1), false);
  assert.equal(canAddNode(2.2), false);
});
test('new node layout never exceeds scene bounds', () => {
  for (let i = 0; i < MAX_NODES; i++) {
    const {x,y} = newNodePosition(i);
    assert.ok(x >= 0 && x <= 488 && y >= 0 && y <= 208);
  }
});
