import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canReorderAroundPinned} from '../examples/pinned-order.ts';
const locked = [
  {id:'first'}, {id:'second'}, {id:'pinned',locked:true}, {id:'fourth'}, {id:'fifth'},
];
const fixed = locked.map(({locked,...rest})=>({...rest, fixed:locked}));
for (const [name,items] of [['locked',locked],['fixed',fixed]]) {
  test(name + ': pinned source and destination cannot move',()=>{
    assert.equal(canReorderAroundPinned(items,2,1),false);
    assert.equal(canReorderAroundPinned(items,1,2),false);
  });
  test(name + ': cannot cross pinned slots in either direction',()=>{
    for(const [from,to] of [[0,4],[4,0],[1,3],[3,1]])
      assert.equal(canReorderAroundPinned(items,from,to),false);
  });
  test(name + ': can move inside each unlocked segment',()=>{
    assert.equal(canReorderAroundPinned(items,0,1),true);
    assert.equal(canReorderAroundPinned(items,4,3),true);
  });
  test(name + ': rejects invalid or no-op moves',()=>{
    for(const [from,to] of [[-1,0],[0,5],[2,2],[0,0],[NaN,1],[0,Infinity],[1,1.5]])
      assert.equal(canReorderAroundPinned(items,from,to),false);
  });
}
