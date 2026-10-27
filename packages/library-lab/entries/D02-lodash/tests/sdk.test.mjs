import test from 'node:test';
import assert from 'node:assert/strict';
import {uniqBy, groupBy, orderBy, chunk, debounce} from 'lodash-es';

test('real lodash-es dedup retains first keyed row',()=>{
 const source=[{id:'a',value:1},{id:'b',value:5},{id:'a',value:9}];
 assert.deepEqual(uniqBy(source,'id'),source.slice(0,2));
 assert.deepEqual(chunk(source,2).map(x=>x.length),[2,1]);
});
test('real lodash-es groups and sorts with deterministic tie break',()=>{
 const rows=[{id:'z',group:'b',score:5},{id:'a',group:'b',score:5},{id:'k',group:'a',score:7}];
 assert.deepEqual(Object.keys(groupBy(rows,'group')),['b','a']);
 assert.deepEqual(orderBy(rows,['score','id'],['desc','asc']).map(r=>r.id),['k','a','z']);
});
test('real lodash-es debounce supports flush and cancel',()=>{
 const events=[];
 const fn=debounce(value=>events.push(value),100);
 fn('old');fn('new');
 assert.deepEqual(events,[]);
 fn.flush();
 assert.deepEqual(events,['new']);
 fn('cancelled');fn.cancel();
 assert.deepEqual(events,['new']);
});
