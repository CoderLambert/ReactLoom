import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedSnap,allocateSlideId} from '../examples/slide-policy.ts';
test('clamp outdated snap after removal or viewport resize',()=>{
 assert.equal(boundedSnap(6,3),2);
 assert.equal(boundedSnap(-1,3),0);
 assert.equal(boundedSnap(1,1),0);
});
test('no snap positions or invalid input is safe',()=>{
 for(const input of [NaN,Infinity,1.2])assert.equal(boundedSnap(input,3),0);
 assert.equal(boundedSnap(10,0),0);
});
test('IDs increase across delete, append, restore without collisions',()=>{
 const first=allocateSlideId(4,[1,2,3,4]);
 assert.equal(first,5);
 assert.equal(allocateSlideId(first,[1,2,3,4]),6);
 assert.equal(allocateSlideId(6,[1,2,3,10]),11);
});
test('invalid unsafe IDs are rejected rather than silently duplicated',()=>{
 assert.throws(()=>allocateSlideId(Number.MAX_SAFE_INTEGER,[]),RangeError);
 assert.throws(()=>allocateSlideId(-5,[]),RangeError);
});
