import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedCanvasSize} from './render-budget.mjs';

test('normal viewport rounds backing store and caps excessive DPR', () => {
  assert.deepEqual(boundedCanvasSize({width: 599.5, height: 400.2}, 1.5), {
    pixelWidth: 900, pixelHeight: 601, cssWidth: 600, cssHeight: 401, ratio: 1.5,
  });
  assert.equal(boundedCanvasSize({width: 100, height: 200}, 10).ratio, 2);
});

test('rejects NaN, infinity, zeros and non-positive DPR before canvas allocation', () => {
  for (const viewport of [{width: NaN, height: 1}, {width: 0, height: 1}, {width: 1, height: Infinity}, null]) {
    assert.throws(() => boundedCanvasSize(viewport, 1), /finite positive/);
  }
  assert.throws(() => boundedCanvasSize({width: 5, height: 5}, 0), /finite positive/);
});

test('rejects malicious PDF page dimensions and DPR-induced overbudget surfaces', () => {
  assert.throws(() => boundedCanvasSize({width: 100_000, height: 20}, 1), /CSS pixel edge/);
  assert.throws(() => boundedCanvasSize({width: 3000, height: 3000}, 1), /8MP/);
  assert.throws(() => boundedCanvasSize({width: 2000, height: 2000}, 2), /8MP/);
});

test('allows a bounded maximum-size viewport', () => {
  const size = boundedCanvasSize({width: 2000, height: 2000}, 1);
  assert.equal(size.pixelWidth * size.pixelHeight, 4_000_000);
});
