import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveVisibleStation,canResizeMap} from '../examples/selection-policy.ts';
const all = [{id:'beijing'},{id:'tianjin'},{id:'shijiazhuang'}];
test('keeps the current station when it remains visible',()=>{
  assert.equal(resolveVisibleStation(all,'tianjin'),'tianjin');
});
test('filtering a selected offline station moves selection to visible station',()=>{
  assert.equal(resolveVisibleStation(all.slice(0,2),'shijiazhuang'),'beijing');
});
test('empty filters clear selection rather than advertise a hidden station',()=>{
  assert.equal(resolveVisibleStation([],'beijing'),'');
});
test('resizing requires positive, finite container and a live map',()=>{
  assert.equal(canResizeMap(300,180,true),true);
  for(const [w,h,active] of [[0,180,true],[300,0,true],[Infinity,180,true],[NaN,180,true],[300,180,false]] as const){
    assert.equal(canResizeMap(w,h,active),false);
  }
});
