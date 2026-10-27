import test from 'node:test';
import assert from 'node:assert/strict';
import {applyStatusEdit,reconcileFeedSnapshot} from '../examples/edit-policy.mjs';
const baseline=[{id:'a',name:'RSS A',status:'active',revision:1},{id:'b',name:'RSS B',status:'paused',revision:3}];

test('valid edit changes only matching stable ID and increments revision',()=>{
 const result=applyStatusEdit(baseline,'b','error',3);
 assert.equal(result.outcome,'applied');
 assert.deepEqual(result.rows,[baseline[0],{...baseline[1],status:'error',revision:4}]);
 assert.equal(baseline[1].status,'paused');
});
test('stale edit and unknown status fail closed without mutation',()=>{
 for(const [status,rev,expected] of [['error',2,'conflict'],['oops',3,'invalid'],['active',NaN,'invalid']]){
  const actual=applyStatusEdit(baseline,'b',status,rev);
  assert.equal(actual.outcome,expected);
  assert.equal(actual.rows,baseline);
 }
 assert.equal(applyStatusEdit(baseline,'x','error',1).outcome,'not-found');
 assert.equal(applyStatusEdit(baseline,'b','paused',3).outcome,'unchanged');
});
test('stale server snapshot preserves newer local status but not server ownership of other fields',()=>{
 const local=applyStatusEdit(baseline,'a','paused',1).rows;
 const incoming=[{...baseline[0],name:'Renamed by server',revision:1},{id:'new',name:'New',status:'active',revision:1}];
 assert.deepEqual(reconcileFeedSnapshot(local,incoming),[
  {id:'a',name:'Renamed by server',status:'paused',revision:2},incoming[1]
 ]);
});
test('newer server revision wins and removed IDs are not resurrected',()=>{
 const incoming=[{...baseline[0],status:'error',revision:7}];
 assert.deepEqual(reconcileFeedSnapshot(baseline,incoming),incoming);
});

