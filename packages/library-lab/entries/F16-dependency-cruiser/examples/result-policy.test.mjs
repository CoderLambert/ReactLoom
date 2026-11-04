import test from 'node:test';
import assert from 'node:assert/strict';
import {checkCruiseReport,checkCruiseExit} from './result-policy.mjs';
const report=(...names)=>JSON.stringify({
  modules:[{source:'src/main.ts',dependencies:[],valid:names.length===0}],
  summary:{error:names.length,violations:names.map(name=>({
    from:'src/domain/main.ts',to:'src/ui/widget.ts',
    rule:{name,severity:'error'}
  }))}
});
test('all three structural scenarios distinguish named errors',()=>{
  assert.equal(checkCruiseReport('basic',report()).errors,0);
  assert.equal(checkCruiseReport('business',report('domain-must-not-import-ui')).errors,1);
  assert.equal(checkCruiseReport('advanced',report('no-circular-dependencies')).errors,1);
});
test('unrelated rule, missing modules and count mismatch are rejected',()=>{
  assert.throws(()=>checkCruiseReport('business',report('no-circular-dependencies')));
  assert.throws(()=>checkCruiseReport('basic',report('domain-must-not-import-ui')));
  assert.throws(()=>checkCruiseReport('basic','{}'));
  assert.throws(()=>checkCruiseReport('business',JSON.stringify({modules:[{}],summary:{error:0,violations:[]}})));
});
test('separate strict reporter exit code rejects tool errors and false successes',()=>{
  assert.equal(checkCruiseExit('basic',{status:0}),0);
  assert.equal(checkCruiseExit('business',{status:1}),1);
  assert.throws(()=>checkCruiseExit('business',{status:0}));
  assert.throws(()=>checkCruiseExit('basic',{status:2}));
  assert.throws(()=>checkCruiseExit('advanced',{status:null,signal:'SIGTERM'}));
});
