import assert from 'node:assert/strict';
import test from 'node:test';
import {MAX_REVISION, nextRevision, normalizeWindow, sampleRows} from '../examples/chart-policy.ts';

test('window is bounded and invalid values use default', () => {
  assert.deepEqual([normalizeWindow(1), normalizeWindow(20), normalizeWindow(6.7), normalizeWindow(Number.NaN)], [3, 14, 7, 7]);
});
test('revision is bounded, finite and monotonic before cap', () => {
  assert.deepEqual([nextRevision(-2), nextRevision(4), nextRevision(MAX_REVISION), nextRevision(Infinity)], [1, 5, MAX_REVISION, 0]);
});
test('14-day series uses unique stable labels', () => {
  const rows = sampleRows(14, 2);
  assert.equal(rows.length, 14);
  assert.equal(new Set(rows.map(row => row.day)).size, 14);
});
test('counts and rates remain finite nonnegative and coherent', () => {
  for (const row of sampleRows(100, Number.POSITIVE_INFINITY)) {
    assert.equal(Number.isFinite(row.reads + row.saved + row.rate), true);
    assert.equal(row.saved <= row.reads, true);
    assert.equal(row.rate, Math.round(100 * row.saved / row.reads));
  }
});
