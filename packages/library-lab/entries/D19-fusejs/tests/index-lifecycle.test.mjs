import test from 'node:test';
import assert from 'node:assert/strict';
import {upsertDocument,removeDocument} from '../examples/index-lifecycle.mjs';
const rows = () => [{id:'a',title:'React',group:'技术'},{id:'b',title:'Product',group:'商业'}];
test('insert returns a new snapshot with stable IDs, not a mutation', () => {
  const old=rows(), incoming={id:'new',title:'RSS',group:'开源'};
  const next=upsertDocument(old,incoming);
  assert.deepEqual(next.map(row=>row.id),['a','b','new']);
  assert.equal(old.length,2);
  assert.notEqual(next[2],incoming);
});
test('replacement keeps list order and leaves previous index data unchanged', () => {
  const old=rows();
  const next=upsertDocument(old,{id:'a',title:'TypeScript',group:'技术'});
  assert.deepEqual(next.map(row=>row.id),['a','b']);
  assert.equal(old[0].title,'React');
  assert.equal(next[0].title,'TypeScript');
  assert.equal(next[1],old[1]);
});
test('deleting an imported row removes it, unknown deletes preserve identity', () => {
  const old=rows();
  const next=removeDocument(old,'a');
  assert.deepEqual(next.map(row=>row.id),['b']);
  assert.equal(old.length,2);
  assert.equal(removeDocument(old,'unknown'),old);
});
test('duplicates and malformed IDs fail before index rebuild', () => {
  assert.throws(()=>upsertDocument([{id:'a'},{id:'a'}],{id:'x'}),TypeError);
  assert.throws(()=>removeDocument([{id:''}],'a'),TypeError);
  assert.throws(()=>upsertDocument(rows(),{id:''}),TypeError);
  assert.throws(()=>removeDocument(rows(),null),TypeError);
});
