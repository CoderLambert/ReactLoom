import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldAdvanceReadingStream,advanceReadingCounts} from '../examples/stream-policy.ts';
const active = {level:'advanced',requested:true,visible:true,reducedMotion:false,allowMotion:false} as const;
test('active advanced visible stream may tick',()=>assert.equal(shouldAdvanceReadingStream(active),true));
test('basic and business never start the stream',()=>{
  for(const level of ['basic','business'] as const) assert.equal(shouldAdvanceReadingStream({...active,level}),false);
});
test('user stop and hidden tab pause, but do not lose requested intent',()=>{
  assert.equal(shouldAdvanceReadingStream({...active,requested:false}),false);
  assert.equal(shouldAdvanceReadingStream({...active,visible:false}),false);
});
test('reduce-motion pauses unless explicitly opted back in',()=>{
  assert.equal(shouldAdvanceReadingStream({...active,reducedMotion:true}),false);
  assert.equal(shouldAdvanceReadingStream({...active,reducedMotion:true,allowMotion:true}),true);
  assert.equal(shouldAdvanceReadingStream({...active,reducedMotion:true,allowMotion:true,visible:false}),false);
});
test('tick uses modulo without mutating original values',()=>{
  const base=[10,20,30];
  assert.deepEqual(advanceReadingCounts(base,0),[13,20,30]);
  assert.deepEqual(advanceReadingCounts(base,4),[10,23,30]);
  assert.deepEqual(base,[10,20,30]);
});
test('empty and invalid ticks do not modify data',()=>{
  assert.deepEqual(advanceReadingCounts([],0),[]);
  assert.deepEqual(advanceReadingCounts([2],-1),[2]);
  assert.deepEqual(advanceReadingCounts([2],Infinity),[2]);
  assert.deepEqual(advanceReadingCounts([2],0.2),[2]);
});
