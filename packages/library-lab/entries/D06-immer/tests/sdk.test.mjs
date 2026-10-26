import test from 'node:test';
import assert from 'node:assert/strict';
import {produce, enablePatches, produceWithPatches, applyPatches} from 'immer';
enablePatches();
test('actual Immer updates nested branch without mutating input', () => {
  const initial={config:{name:'技术'},list:[{id:'x',read:false}]};
  const next=produce(initial,draft=>{draft.config.name='开源';});
  assert.equal(initial.config.name,'技术');
  assert.equal(next.config.name,'开源');
  assert.equal(next.list,initial.list);
  assert.notEqual(next.config,initial.config);
});
test('actual inverse patches undo a single isolated optimistic update', () => {
  const initial={revision:1, list:[{id:'x',read:false}]};
  const [next,changes,inverse]=produceWithPatches(initial,draft=>{
    draft.list[0].read=true;draft.revision++;
  });
  assert.ok(changes.length>0);assert.ok(inverse.length>0);
  assert.deepEqual(applyPatches(next,inverse),initial);
});

