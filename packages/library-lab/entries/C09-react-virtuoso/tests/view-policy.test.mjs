import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFeedQuery, nextWindowLimit, nextViewRevision} from '../examples/view-policy.mjs';

test('repeated submissions of identical queries receive a fresh virtual viewport revision', () => {
  assert.equal(nextViewRevision(4), 5);
  assert.equal(nextViewRevision(nextViewRevision(4)), 6);
});
test('pagination clamps the final batch and never requests beyond the filtered count', () => {
  assert.equal(nextWindowLimit(30, 65), 60);
  assert.equal(nextWindowLimit(60, 65), 65);
  assert.equal(nextWindowLimit(65, 65), 65);
});
test('pagination rejects stale or invalid counts rather than silently corrupting the cursor', () => {
  assert.throws(() => nextWindowLimit(-1, 20), RangeError);
  assert.throws(() => nextWindowLimit(3, Number.NaN), RangeError);
  assert.throws(() => nextWindowLimit(3, 30, 0), RangeError);
});
test('query normalization limits Unicode code points and strips control characters', () => {
  assert.equal(normalizeFeedQuery('  Re\u0000act\n  '), 'React');
  assert.equal(Array.from(normalizeFeedQuery('😀'.repeat(90))).length, 80);
  assert.equal(normalizeFeedQuery(null), '');
});
