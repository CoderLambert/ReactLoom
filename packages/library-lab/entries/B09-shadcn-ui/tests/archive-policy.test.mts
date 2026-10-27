import test from 'node:test';
import assert from 'node:assert/strict';
import {pendingArchiveIds,archiveByIds,isCurrentArchiveRun} from '../examples/archive-policy.ts';

const source=[{id:'a',archived:false},{id:'b',archived:true},{id:'c',archived:false}];
test('only unarchived known ids become immutable operation snapshot', () => {
  const selected=['a','a','b','unknown'];
  assert.deepEqual(pendingArchiveIds(source,selected),['a']);
  selected.push('c');
  assert.deepEqual(pendingArchiveIds(source,['a','b']),['a']);
});
test('archive updates selected rows only and preserves order', () => {
  assert.deepEqual(archiveByIds(source,['a','missing']),[
    {id:'a',archived:true},{id:'b',archived:true},{id:'c',archived:false}
  ]);
  assert.equal(source[0].archived,false);
});
test('repeated archived operations are idempotent', () => {
  const once=archiveByIds(source,['a']);
  assert.deepEqual(archiveByIds(once,['a']),once);
});
test('reset, unmount and level change invalidate scheduled callbacks', () => {
  assert.equal(isCurrentArchiveRun(7,7),true);
  assert.equal(isCurrentArchiveRun(7,8),false);
  assert.equal(isCurrentArchiveRun(NaN,NaN),false);
});
