import test from 'node:test';
import assert from 'node:assert/strict';
import {isCurrentDragSession} from '../examples/pinned-order.ts';
const started={activeId:'ai',revision:2,level:'business'} as const;
test('matching drag session permits a single unmodified drop',()=>{
  assert.equal(isCurrentDragSession(started,'ai',2,'business'),true);
});
test('keyboard reorder and reset invalidate late pointer drop',()=>{
  assert.equal(isCurrentDragSession(started,'ai',3,'business'),false);
  assert.equal(isCurrentDragSession(started,'ai',4,'business'),false);
});
test('level switch and different drag ID invalidate stale drop',()=>{
  assert.equal(isCurrentDragSession(started,'ai',2,'basic'),false);
  assert.equal(isCurrentDragSession(started,'oss',2,'business'),false);
});
test('cancelled drag cannot commit',()=>{
  assert.equal(isCurrentDragSession(null,'ai',2,'business'),false);
});
