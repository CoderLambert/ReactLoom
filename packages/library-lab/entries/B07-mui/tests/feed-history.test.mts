import test from 'node:test';
import assert from 'node:assert/strict';
import {addFeed, initialFeedHistory, toggleFeed, undoFeed} from '../examples/feed-history.ts';

test('rapid sequential toggles undo only the latest committed mutation', () => {
  const first = toggleFeed(initialFeedHistory, 's-1', false);
  const second = toggleFeed(first, 's-2', false);
  assert.equal(second.rows[0].enabled, false);
  assert.equal(second.rows[1].enabled, false);
  const rolled = undoFeed(second);
  assert.equal(rolled.rows[0].enabled, false);
  assert.equal(rolled.rows[1].enabled, true);
  assert.equal(rolled.before, null);
});
test('noop and nonexistent records do not replace undo snapshot', () => {
  const changed = toggleFeed(initialFeedHistory, 's-1', false);
  assert.equal(toggleFeed(changed, 's-1', false), changed);
  assert.equal(toggleFeed(changed, 'missing', true), changed);
  assert.equal(addFeed(changed, 'duplicate', 'https://example.org/design.xml'), changed);
  assert.equal(undoFeed(changed).rows[0].enabled, true);
});
test('monotonic local IDs survive undo and repeated addition', () => {
  const first = addFeed(initialFeedHistory, 'A', 'https://example.org/a.xml');
  assert.equal(first.rows.at(-1)?.id, 'local-1');
  const reverted = undoFeed(first);
  const second = addFeed(reverted, 'B', 'https://example.org/b.xml');
  assert.equal(second.rows.at(-1)?.id, 'local-2');
  assert.equal(second.rows.length, 4);
  assert.equal(undoFeed(second).rows.length, 3);
});
test('empty labels and duplicate endpoints do not mutate state', () => {
  assert.equal(addFeed(initialFeedHistory, '', 'https://example.org/x.xml'), initialFeedHistory);
  assert.equal(addFeed(initialFeedHistory, 'OK', ''), initialFeedHistory);
  assert.equal(undoFeed(initialFeedHistory), initialFeedHistory);
});
