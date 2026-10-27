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

import {tableQueryIdentity,createPageRequestGate} from '../examples/page-policy.mjs';
const requestParams={pageIndex:1,pageSize:5,sorting:[{id:'title',desc:false}],query:'新闻',fail:false,limit:18};
test('request key includes every server-owned query dimension',()=>{
  const baseline=tableQueryIdentity(requestParams);
  for(const [key,value] of [
    ['pageIndex',2],['pageSize',10],['query','新闻!'],['fail',true],['limit',2],
    ['sorting',[{id:'title',desc:true}]],['sorting',[{id:'category',desc:false}]],
  ]) assert.notEqual(tableQueryIdentity({...requestParams,[key]:value}),baseline,key);
  assert.equal(tableQueryIdentity({...requestParams,sorting:[{desc:false,id:'title'}]}),baseline);
});
test('request key refuses ambiguous or unsupported parameters',()=>{
  for(const bad of [{pageIndex:-1},{pageIndex:Infinity},{pageSize:0},{pageSize:1.3},
    {limit:-5},{limit:NaN},{query:null},{fail:'false'},{sorting:[{id:'select',desc:false}]},
    {sorting:[{id:'title',desc:'false'}]},
    {sorting:[{id:'title',desc:false},{id:'category',desc:false}]}]) {
    assert.throws(()=>tableQueryIdentity({...requestParams,...bad}),TypeError);
  }
});
test('new request aborts the old owner and stale cleanup cannot cancel the new owner',()=>{
  const gate=createPageRequestGate();const old=gate.begin();
  assert.equal(old.owns(),true);
  const next=gate.begin();
  assert.equal(old.signal.aborted,true);
  assert.equal(old.owns(),false);
  old.close();old.cancel();
  assert.equal(next.owns(),true);
  next.close();assert.equal(next.owns(),false);
});
test('A→B→A rejects late original A even when the request identity repeats',()=>{
  const gate=createPageRequestGate();
  const firstA=gate.begin();gate.invalidate();
  const B=gate.begin();gate.invalidate();
  const secondA=gate.begin();
  assert.equal(firstA.owns(),false);assert.equal(firstA.signal.aborted,true);
  assert.equal(B.owns(),false);assert.equal(secondA.owns(),true);
  gate.invalidate();assert.equal(secondA.owns(),false);assert.equal(secondA.signal.aborted,true);
});
