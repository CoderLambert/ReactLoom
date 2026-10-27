import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldAnimate} from '../examples/animation-policy.ts';
for (const [label,state,expected] of [
  ['normal playback',{playing:true,visible:true,reducedMotion:false,overrideMotion:false},true],
  ['manual pause',{playing:false,visible:true,reducedMotion:false,overrideMotion:false},false],
  ['background tab',{playing:true,visible:false,reducedMotion:false,overrideMotion:false},false],
  ['reduced motion',{playing:true,visible:true,reducedMotion:true,overrideMotion:false},false],
  ['explicit override',{playing:true,visible:true,reducedMotion:true,overrideMotion:true},true],
  ['background always wins',{playing:true,visible:false,reducedMotion:true,overrideMotion:true},false],
  ['manual pause always wins',{playing:false,visible:true,reducedMotion:true,overrideMotion:true},false],
] as const) test(label,()=>assert.equal(shouldAnimate(state),expected));
