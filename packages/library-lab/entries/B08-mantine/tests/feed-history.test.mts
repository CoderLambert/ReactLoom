import test from 'node:test';
import assert from 'node:assert/strict';
import {initialFeedHistory, toggleFeed, undoFeed, updateQuota, validQuota} from '../examples/feed-history.ts';

test('rapid sequential changes keep one-step undo snapshot accurate', () => {
  const toggled = toggleFeed(initialFeedHistory, 'frontend', false);
  const changed = updateQuota(toggled, 'frontend', 99);
  assert.equal(changed.rows[0].quota, 99);
  assert.equal(undoFeed(changed).rows[0].enabled, false);
  assert.equal(undoFeed(changed).rows[0].quota, 15);
  assert.equal(undoFeed(toggled).rows[0].enabled, true);
});
test('NumberInput intermediate and boundary values preserve state', () => {
  for (const invalid of ['', '-', 0, -1, 101, 1.5, Number.MAX_SAFE_INTEGER + 1, NaN, Infinity]) {
    assert.equal(validQuota(invalid), false);
    assert.equal(updateQuota(initialFeedHistory, 'frontend', invalid), initialFeedHistory);
  }
  assert.equal(validQuota(1), true);
  assert.equal(validQuota(100), true);
});
test('noop and unknown records do not replace the undo point', () => {
  const toggled = toggleFeed(initialFeedHistory, 'security', true);
  assert.equal(toggleFeed(toggled, 'security', true), toggled);
  assert.equal(updateQuota(toggled, 'frontend', 15), toggled);
  assert.equal(updateQuota(toggled, 'missing', 20), toggled);
  assert.equal(undoFeed(toggled).rows[2].enabled, false);
  assert.equal(undoFeed(initialFeedHistory), initialFeedHistory);
});
