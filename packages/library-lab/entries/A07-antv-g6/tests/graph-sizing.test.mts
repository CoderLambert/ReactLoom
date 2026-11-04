import test from 'node:test';
import assert from 'node:assert/strict';
import {measuredGraphWidth} from '../examples/graph-sizing.ts';
test('use host width rather than a 360px overflow floor',()=>{
 assert.equal(measuredGraphWidth(241.8),241);
 assert.equal(measuredGraphWidth(319.99),319);
});
test('do not allocate a graph in hidden or invalid geometry',()=>{
 for(const v of [0,-1,NaN,Infinity,-Infinity,0.5])assert.equal(measuredGraphWidth(v),null);
});
test('bound extraordinary canvas dimensions',()=>{
 assert.equal(measuredGraphWidth(999999),4096);
 assert.equal(measuredGraphWidth(4096),4096);
});
