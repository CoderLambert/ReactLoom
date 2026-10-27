import test from 'node:test';
import assert from 'node:assert/strict';
import {atom, createStore} from 'jotai';
import {toggleStoryRead} from '../examples/story-policy.mjs';
test('actual Jotai derived atom follows source updates',()=>{
  const source=atom(1), doubled=atom(get=>get(source)*2);
  const store=createStore(); let calls=0;const unsub=store.sub(doubled,()=>{calls++;});
  assert.equal(store.get(doubled),2);
  store.set(source,4);
  assert.equal(store.get(doubled),8);
  assert.ok(calls>=1);
  unsub();
});
test('actual Jotai stores isolate identical atom configs',()=>{
  const atomConfig=atom('A');
  const a=createStore(),b=createStore();
  a.set(atomConfig,'changed');
  assert.equal(a.get(atomConfig),'changed');
  assert.equal(b.get(atomConfig),'A');
});

test('real Jotai write atom isolates story toggles across logout and sibling stores',()=>{
 const rows=atom([{id:'rss-1',read:false},{id:'rss-2',read:true}]);
 const toggle=atom(null,(get,set,id)=>set(rows,toggleStoryRead(get(rows),id)));
 const tenantA=createStore(),tenantB=createStore();
 tenantA.set(toggle,'rss-1');
 assert.equal(tenantA.get(rows)[0].read,true);
 assert.equal(tenantB.get(rows)[0].read,false);
 const newLogin=createStore();
 assert.equal(newLogin.get(rows)[0].read,false);
 tenantA.set(toggle,'missing');
 assert.equal(tenantA.get(rows).length,2);
});
