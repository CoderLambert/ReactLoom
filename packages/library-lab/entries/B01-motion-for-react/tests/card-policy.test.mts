import assert from 'node:assert/strict';
import test from 'node:test';
import {appendUniqueCard, archiveCard, MAX_MOTION_CARDS, moveFirstToEnd} from '../examples/card-policy.ts';

const rows = [{id: 1}, {id: 2}, {id: 3}];
test('appends unique business keys without mutating input', () => {
  assert.deepEqual(appendUniqueCard(rows, {id: 4}).map(x => x.id), [1, 2, 3, 4]);
  assert.equal(rows.length, 3);
  assert.deepEqual(appendUniqueCard(rows, {id: 2}), rows);
});
test('bounds cards independently from animation timing', () => {
  const full = Array.from({length: MAX_MOTION_CARDS}, (_, id) => ({id}));
  assert.equal(appendUniqueCard(full, {id: 99}).length, MAX_MOTION_CARDS);
});
test('archives only requested key and never reindexes others', () => {
  assert.deepEqual(archiveCard(rows, 2), [{id: 1}, {id: 3}]);
  assert.deepEqual(archiveCard(rows, 999), rows);
});
test('reorders without losing identity; empty list is supported', () => {
  assert.deepEqual(moveFirstToEnd(rows).map(c => c.id), [2, 3, 1]);
  assert.deepEqual(moveFirstToEnd([]), []);
});
