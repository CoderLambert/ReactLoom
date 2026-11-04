import test from 'node:test';
import assert from 'node:assert/strict';
import {sameFeedSnapshot} from '../examples/rollback-policy.mjs';
const original = [
  {id:'rss-a', group:'技术', updatedAt:100, read:false},
  {id:'rss-b', group:'商业', updatedAt:200, read:true}
];
test('same records in different IndexedDB iteration order are equal', () => {
  assert.equal(sameFeedSnapshot(original,[...original].reverse()),true);
});
test('same row count but changed read flag is not a rollback', () => {
  assert.equal(sameFeedSnapshot(original,[{...original[0],read:true}, original[1]]),false);
});
test('same row count but changed value or identity is not a rollback', () => {
  assert.equal(sameFeedSnapshot(original,[{...original[0],updatedAt:999},original[1]]),false);
  assert.equal(sameFeedSnapshot(original,[{...original[0],id:'rss-c'},original[1]]),false);
});
test('missing or malformed arrays cannot establish unchanged state', () => {
  assert.equal(sameFeedSnapshot(original,[]),false);
  assert.equal(sameFeedSnapshot(original,null),false);
});
