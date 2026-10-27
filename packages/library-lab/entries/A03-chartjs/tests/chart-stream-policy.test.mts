import assert from 'node:assert/strict';
import test from 'node:test';
import {chartCounts, MAX_REVISION, nextRevision, normalizeRevision, shouldAutoSample} from '../examples/chart-stream-policy.ts';

test('normalizes invalid, fractional and oversized revisions', () => {
  assert.equal(normalizeRevision(Number.NaN), 0);
  assert.equal(normalizeRevision(-3), 0);
  assert.equal(normalizeRevision(1.9), 1);
  assert.equal(normalizeRevision(Infinity), 0);
  assert.equal(normalizeRevision(1e12), MAX_REVISION);
});
test('monotonically advances without unbounded fixture data', () => {
  assert.equal(nextRevision(0), 1);
  assert.equal(nextRevision(MAX_REVISION), MAX_REVISION);
  assert.equal(nextRevision(Infinity), 1);
});
test('produces seven consistent integer values for Canvas and table', () => {
  assert.deepEqual(chartCounts(0), [110, 127, 144, 161, 178, 195, 212]);
  assert.equal(chartCounts(2)[0], 116);
  assert.equal(chartCounts(2).length, 7);
  assert.ok(chartCounts(1e30).every(n => Number.isSafeInteger(n)));
});
test('auto sampling respects mode and visibility', () => {
  assert.equal(shouldAutoSample(true, 'advanced', true), true);
  assert.equal(shouldAutoSample(true, 'advanced', false), false);
  assert.equal(shouldAutoSample(true, 'business', true), false);
  assert.equal(shouldAutoSample(false, 'advanced', true), false);
});
