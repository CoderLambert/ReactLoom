import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldAnimate,shouldRunFrameLoop} from '../examples/animation-policy.ts';
const normal={playing:true,visible:true,reducedMotion:false,overrideMotion:false};
for (const [label,state,expected] of [
  ['normal playback',normal,true],
  ['manual pause',{...normal,playing:false},false],
  ['background tab',{...normal,visible:false},false],
  ['reduced motion',{...normal,reducedMotion:true},false],
  ['explicit override',{...normal,reducedMotion:true,overrideMotion:true},true],
  ['background always wins',{...normal,visible:false,reducedMotion:true,overrideMotion:true},false],
  ['manual pause always wins',{...normal,playing:false,reducedMotion:true,overrideMotion:true},false],
] as const) test(label,()=>assert.equal(shouldAnimate(state),expected));
for(const [label,speed,expected] of [
  ['positive speed',0.7,true], ['zero speed',0,false],['negative',-1,false],
  ['not finite',Infinity,false],['NaN',NaN,false],
] as const) test(label,()=>assert.equal(shouldRunFrameLoop(normal,speed),expected));
test('background and reduced-motion stop GPU regardless of speed',()=>{
 assert.equal(shouldRunFrameLoop({...normal,visible:false},2),false);
 assert.equal(shouldRunFrameLoop({...normal,reducedMotion:true},2),false);
 assert.equal(shouldRunFrameLoop({...normal,reducedMotion:true,overrideMotion:true},2),true);
});
