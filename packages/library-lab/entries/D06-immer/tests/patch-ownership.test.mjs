import test from 'node:test';
import assert from 'node:assert/strict';
import {takeUndo} from '../examples/patch-ownership.mjs';
test('claim inverse before queued state updater and keep captured batch stable',()=>{
 const patches=[{op:'replace',path:['revision'],value:1}];
 const ref={current:patches};
 const captured=takeUndo(ref);
 const deferred=()=>captured;
 assert.equal(ref.current,null);
 assert.equal(deferred(),patches);
 assert.equal(takeUndo(ref),null);
});
test('a repeated rollback cannot steal a different optimistic change',()=>{
 const ref={current:[{op:'remove',path:['items',0]}]};
 const first=takeUndo(ref);
 assert.equal(takeUndo(ref),null);
 ref.current=[{op:'replace',path:['revision'],value:2}];
 assert.notDeepEqual(first,takeUndo(ref));
});
