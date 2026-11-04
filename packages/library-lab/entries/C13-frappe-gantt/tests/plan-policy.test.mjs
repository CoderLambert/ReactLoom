import test from 'node:test';
import assert from 'node:assert/strict';
import {validCivilDate,validatePlan} from '../examples/plan-policy.mjs';
const fixture = () => [
 {id:'research',start:'2026-10-27',end:'2026-10-29',progress:100,dependencies:''},
 {id:'build',start:'2026-10-30',end:'2026-11-02',progress:40,dependencies:'research'},
 {id:'qa',start:'2026-11-03',end:'2026-11-07',progress:0,dependencies:'build'},
];
test('valid leap day, reject overflow and invalid dates',()=>{
 assert.equal(validCivilDate('2028-02-29'),true);
 for(const value of ['2026-02-29','2026-11-31','2026-13-01','2026-2-01','2026-02-30'])
  assert.equal(validCivilDate(value),false,value);
});
test('valid directed acyclic dependency plan passes',()=>assert.equal(validatePlan(fixture()),null));
test('reject three-task dependency cycle, including disconnected cycles',()=>{
 const a=fixture();a[0].dependencies='qa';
 assert.match(validatePlan(a),/闭环/);
 const b=fixture();b[1].dependencies='qa';b[2].dependencies='build';
 assert.match(validatePlan(b),/闭环/);
});
test('reject missing, duplicate or self dependency',()=>{
 for(const dependencies of ['no-such-task','build','research,research']){
  const a=fixture();a[1].dependencies=dependencies;
  assert.notEqual(validatePlan(a),null,dependencies);
 }
});
test('reject duplicated task IDs and nonfinite progress',()=>{
 const a=fixture();a[2].id='research';assert.match(validatePlan(a),/重复/);
 for(const number of [NaN,Infinity,-1,101]){
  const b=fixture();b[1].progress=number;assert.match(validatePlan(b),/有限/,String(number));
 }
});
test('invalid range fails before being rendered by the SDK',()=>{
 const a=fixture();a[1].end='2026-10-29';assert.match(validatePlan(a),/日期区间/);
});
test('bound the whole plan to 730 UTC days, including gaps between short tasks',()=>{
 const plan=[
  {id:'early',start:'2024-01-01',end:'2024-01-02',progress:0,dependencies:''},
  {id:'late',start:'2025-12-30',end:'2025-12-31',progress:0,dependencies:'early'},
 ];
 assert.equal(validatePlan(plan),null,'730 UTC days must remain accepted');
 plan[1].end='2026-01-01';
 assert.match(validatePlan(plan),/730.*UTC/,'731 UTC days must be rejected');
});
test('valid distant years cannot expand the current project into an unbounded chart',()=>{
 for(const year of ['0100','9999']){
  const plan=fixture();plan[1].start=year+'-01-01';plan[1].end=year+'-01-02';
  const before=structuredClone(plan);
  assert.match(validatePlan(plan),/730.*UTC/,year);
  assert.deepEqual(plan,before,'rejected validation must not mutate task descriptors');
 }
});
test('span calculation uses validated UTC dates within supported SDK years',()=>{
 for(const [start,end] of [['0100-01-01','0102-01-01'],['9997-01-01','9999-01-01'],['2024-11-03','2026-11-03']]){
  assert.equal(validatePlan([{id:'bounded',start,end,progress:0,dependencies:''}]),null);
 }
});
test('reject SDK numeric-Date year aliasing across the 0099 to 0100 boundary',()=>{
 assert.equal(validCivilDate('0099-12-30'),true,'ISO validity does not establish SDK year compatibility');
 const plan=[
  {id:'old',start:'0099-12-30',end:'0099-12-31',progress:0,dependencies:''},
  {id:'next',start:'0100-01-01',end:'0100-01-02',progress:0,dependencies:'old'},
 ];
 assert.match(validatePlan(plan),/0100.*SDK/);
});

