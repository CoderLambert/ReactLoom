import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldRunStream} from '../examples/stream-policy.ts';
const base = {advanced:true,requested:true,visible:true,reducedMotion:false,overrideReducedMotion:false};
test('only an explicit advanced playback request starts the sampling timer',()=>{
  assert.equal(shouldRunStream(base),true);
  assert.equal(shouldRunStream({...base,advanced:false}),false);
  assert.equal(shouldRunStream({...base,requested:false}),false);
});
test('hidden tab always pauses and cannot be overridden',()=>{
  assert.equal(shouldRunStream({...base,visible:false}),false);
  assert.equal(shouldRunStream({...base,visible:false,reducedMotion:true,overrideReducedMotion:true}),false);
});
test('reduced motion pauses unless explicitly overridden',()=>{
  assert.equal(shouldRunStream({...base,reducedMotion:true}),false);
  assert.equal(shouldRunStream({...base,reducedMotion:true,overrideReducedMotion:true}),true);
});
test('override does not start an unrequested stream',()=>{
  assert.equal(shouldRunStream({...base,requested:false,overrideReducedMotion:true}),false);
});
