import test from 'node:test';
import assert from 'node:assert/strict';
import {atom, createStore} from 'jotai';
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

