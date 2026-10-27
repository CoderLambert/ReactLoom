import test from 'node:test';
import assert from 'node:assert/strict';
import {appendFeed,toggleFeed,undoFeed} from '../examples/feed-history.ts';
const initial={rows:[{id:'1',url:'https://example.test/a.xml',enabled:true}],previous:null};
test('add and undo commit an atomic snapshot',()=>{
 const next=appendFeed(initial,{id:'2',url:'https://example.test/b.xml',enabled:true});
 assert.deepEqual(next.rows.map(x=>x.id),['2','1']);
 assert.equal(next.previous,initial.rows);
 assert.deepEqual(undoFeed(next),{rows:initial.rows,previous:null});
});
test('duplicate URL or stable ID is a no-op',()=>{
 assert.equal(appendFeed(initial,{id:'2',url:initial.rows[0].url,enabled:true}),initial);
 assert.equal(appendFeed(initial,{id:'1',url:'https://example.test/else.xml',enabled:true}),initial);
});
test('rapid toggles derive from the latest state, not stale closure',()=>{
 const off=toggleFeed(initial,'1',false);
 const on=toggleFeed(off,'1',true);
 assert.equal(on.rows[0].enabled,true);
 assert.equal(on.previous,off.rows);
 assert.equal(undoFeed(on).rows[0].enabled,false);
});
test('no-op edits do not overwrite last undo snapshot',()=>{
 const off=toggleFeed(initial,'1',false);
 assert.equal(toggleFeed(off,'1',false),off);
 assert.equal(toggleFeed(off,'missing',true),off);
});
test('undo is one level and idempotent',()=>{
 const off=toggleFeed(initial,'1',false);
 const restored=undoFeed(off);
 assert.equal(undoFeed(restored),restored);
});
