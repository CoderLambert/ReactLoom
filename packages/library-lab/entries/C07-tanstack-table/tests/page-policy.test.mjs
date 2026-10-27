import test from 'node:test';
import assert from 'node:assert/strict';
import {clampPageIndex} from '../examples/page-policy.mjs';

test('keeps valid page',()=>assert.equal(clampPageIndex(2,5,18),2));
test('clamps stale server pages when count shrinks',()=>{
 assert.equal(clampPageIndex(3,5,2),0);
 assert.equal(clampPageIndex(3,5,11),2);
});
test('empty count has no out-of-range page',()=>assert.equal(clampPageIndex(8,5,0),0));
test('invalid indexes and non-positive sizes fall back to page zero',()=>{
 for(const page of [NaN,Infinity,-Infinity])assert.equal(clampPageIndex(page,5,18),0);
 assert.equal(clampPageIndex(3,0,18),0);
 assert.equal(clampPageIndex(3,5,Infinity),0);
});
test('fractional indices are floored and negative totals bounded',()=>{
 assert.equal(clampPageIndex(2.9,5,18),2);
 assert.equal(clampPageIndex(-2,5,-1),0);
});
