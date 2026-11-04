import assert from 'node:assert/strict';
import test from 'node:test';
import {deleteFeed, visibleFeeds} from '../examples/feed-policy.ts';
const data = [
  {id: 'a', title: 'A', unread: 3, saved: 0, heat: 2, updated: 10},
  {id: 'b', title: 'B', unread: 0, saved: 2, heat: 8, updated: 20},
  {id: 'c', title: 'C', unread: 4, saved: 1, heat: 5, updated: 30},
];
test('latest and popular sort are applied to actual feed rows', () => {
  assert.deepEqual(visibleFeeds(data, 'all', 'new', []).map(f => f.id), ['c', 'b', 'a']);
  assert.deepEqual(visibleFeeds(data, 'all', 'popular', []).map(f => f.id), ['b', 'c', 'a']);
});
test('pinned rows precede sort without mutating caller collection', () => {
  assert.deepEqual(visibleFeeds(data, 'all', 'popular', ['a']).map(f => f.id), ['a', 'b', 'c']);
  assert.deepEqual(data.map(f => f.id), ['a', 'b', 'c']);
});
test('submenus filter the actual visible feed list', () => {
  assert.deepEqual(visibleFeeds(data, 'unread', 'new', []).map(f => f.id), ['c', 'a']);
  assert.deepEqual(visibleFeeds(data, 'saved', 'new', []).map(f => f.id), ['c', 'b']);
});
test('delete respects authorization and preserves the source array', () => {
  assert.deepEqual(deleteFeed(data, 'b', true).map(f => f.id), ['a', 'b', 'c']);
  assert.deepEqual(deleteFeed(data, 'b', false).map(f => f.id), ['a', 'c']);
  assert.deepEqual(deleteFeed(data, 'bad', false).map(f => f.id), ['a', 'b', 'c']);
  assert.equal(data.length, 3);
});
