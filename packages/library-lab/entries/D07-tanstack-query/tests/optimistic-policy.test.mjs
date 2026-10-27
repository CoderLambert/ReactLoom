import test from 'node:test';
import assert from 'node:assert/strict';
import {optimisticRow,rollbackRow,commitRow} from '../examples/optimistic-policy.mjs';

const initial = () => ({page:0,total:2,items:[{id:'a1',enabled:false,rev:3,title:'A'},{id:'a2',enabled:true,rev:7,title:'B'}]});
test('optimistic patch changes one stable ID without mutating the cache snapshot',()=>{
  const old=initial(); const next=optimisticRow(old,{id:'a1',enabled:true,expectedRev:3,token:1});
  assert.notEqual(next,old);
  assert.equal(old.items[0].enabled,false);
  assert.equal(next.items[0].optimisticToken,1);
  assert.strictEqual(next.items[1],old.items[1]);
});
test('rollback restores only the owned row, preserving other successful edits',()=>{
  const old=initial();
  let page=optimisticRow(old,{id:'a1',enabled:true,expectedRev:3,token:11});
  page={...page,items:[page.items[0],{...page.items[1],enabled:false,rev:8}]};
  const restored=rollbackRow(page,{id:'a1',token:11,previous:old.items[0]});
  assert.deepEqual(restored.items[0],old.items[0]);
  assert.deepEqual(restored.items[1],{id:'a2',enabled:false,rev:8,title:'B'});
});
test('late error cannot revert a newer operation draft',()=>{
  const old=initial(); const first=optimisticRow(old,{id:'a1',enabled:true,expectedRev:3,token:1});
  const newer={...first,items:first.items.map(r=>r.id==='a1'?{...r,optimisticToken:2,enabled:false}:r)};
  assert.strictEqual(rollbackRow(newer,{id:'a1',token:1,previous:old.items[0]}),newer);
  assert.strictEqual(commitRow(newer,{id:'a1',token:1,saved:{...old.items[0],rev:4}}),newer);
});
test('commit uses authoritative server rev, drops temporary token',()=>{
  const old=initial();const draft=optimisticRow(old,{id:'a1',enabled:true,expectedRev:3,token:21});
  const saved={...old.items[0],enabled:true,rev:4};
  assert.deepEqual(commitRow(draft,{id:'a1',token:21,saved}).items[0],saved);
});
test('stale revision and already owned drafts are not overwritten',()=>{
  const old=initial();
  assert.strictEqual(optimisticRow(old,{id:'a1',enabled:true,expectedRev:2,token:9}),old);
  const first=optimisticRow(old,{id:'a1',enabled:true,expectedRev:3,token:1});
  assert.strictEqual(optimisticRow(first,{id:'a1',enabled:false,expectedRev:3,token:2}),first);
});
test('missing pages/rows remain unchanged and no cross-page materialization',()=>{
  const old=initial(); const change={id:'b1',enabled:true,expectedRev:3,token:4};
  assert.strictEqual(optimisticRow(old,change),old);
  assert.equal(optimisticRow(undefined,change),undefined);
  assert.strictEqual(rollbackRow(old,{id:'a1',token:4,previous:undefined}),old);
  assert.strictEqual(commitRow(old,{id:'a1',token:4,saved:old.items[0]}),old);
});
