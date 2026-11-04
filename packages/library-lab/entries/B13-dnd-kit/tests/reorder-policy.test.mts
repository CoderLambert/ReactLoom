import test from 'node:test';
import assert from 'node:assert/strict';
import {reorderVisible} from '../examples/pinned-order.ts';
const items=[{id:'a'},{id:'b'},{id:'c'},{id:'pin',locked:true},{id:'d'},{id:'e'}];
test('basic reorder preserves off-screen tail',()=>{
 const result=reorderVisible(items,'a','c',3);
 assert.deepEqual(result?.map(x=>x.id),['b','c','a','pin','d','e']);
 assert.deepEqual(items.map(x=>x.id),['a','b','c','pin','d','e']);
});
test('locked slot cannot be displaced in either direction',()=>{
 assert.equal(reorderVisible(items,'a','e'),null);
 assert.equal(reorderVisible(items,'e','a'),null);
 assert.equal(reorderVisible(items,'pin','a'),null);
});
test('valid unlocked move remains possible on either side',()=>{
 assert.deepEqual(reorderVisible(items,'e','d')?.map(x=>x.id),['a','b','c','pin','e','d']);
});
test('stale identities, duplicate IDs, bad prefixes and same positions fail closed',()=>{
 for(const args of [['absent','a',6],['a','absent',6],['a','a',6],['a','b',0],['a','b',7],['a','b',1.2]] as const)
   assert.equal(reorderVisible(items,...args),null);
 assert.equal(reorderVisible([{id:'a'},{id:'a'}],'a','a'),null);
});
