import assert from 'node:assert/strict';
import test from 'node:test';
import {initialNarrowCells, keyboardMove, keyboardResize, projectCells, sameGeometry} from '../examples/layout-policy.ts';

const wide = [{i:'headline',x:0,y:0,w:4,h:2,minW:2,maxW:8},{i:'feed',x:4,y:0,w:4,h:2,minW:2,maxW:8},{i:'queue',x:8,y:0,w:4,h:2,minW:2,maxW:8}];
test('uses independent stacked narrow geometry without modifying wide', () => {
  const small = initialNarrowCells(wide);
  assert.deepEqual(small.map(x=>[x.i,x.x,x.y,x.w]), [['headline',0,0,6],['feed',0,2,6],['queue',0,4,6]]);
  assert.equal(wide[1].x, 4);
});
test('projects oversized saved geometry into columns safely', () => {
  const projected = projectCells(wide,6);
  assert.ok(projected.every(cell=>cell.x>=0 && cell.x+cell.w<=6));
  assert.equal(projected[2].x, 2);
});
test('ignores runtime static flags when comparing persisted geometry', () => {
  assert.equal(sameGeometry(wide, wide.map(x=>({...x,static:true}))), true);
  assert.equal(sameGeometry(wide,wide.slice(1)),false);
  assert.equal(sameGeometry(wide,wide.map(x=>({...x,x:x.x+1}))),false);
});
test('wide keyboard cannot exceed bounds or move locked item', () => {
  assert.equal(keyboardMove(wide,'headline',-1,12),wide);
  assert.equal(keyboardMove(wide,'queue',1,12),wide);
  assert.equal(keyboardMove(wide,'headline',1,12,['headline']),wide);
  assert.equal(keyboardMove(wide,'feed',1,12)[1].x,5);
});
test('narrow keyboard rearranges only adjacent unlocked tiles', () => {
  const narrow = initialNarrowCells(wide);
  assert.equal(keyboardMove(narrow,'feed',-1,6,['headline']),narrow);
  const moved = keyboardMove(narrow,'feed',1,6,['headline']);
  assert.deepEqual(moved.map(x=>x.y),[0,4,2]);
  assert.deepEqual(narrow.map(x=>x.y),[0,2,4]);
});
test('resizing observes maxW, minW and lock', () => {
  assert.equal(keyboardResize(wide,'headline',-1,12,['headline']),wide);
  assert.equal(keyboardResize(wide,'feed',-1,12)[1].w,3);
  const narrow = initialNarrowCells(wide);
  assert.equal(keyboardResize(narrow,'feed',1,6),narrow);
  assert.equal(keyboardResize(narrow,'feed',-1,6)[1].w,5);
});
