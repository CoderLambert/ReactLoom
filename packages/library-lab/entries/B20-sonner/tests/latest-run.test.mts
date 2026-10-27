import test from 'node:test';
import assert from 'node:assert/strict';
import {LatestRunGuard} from '../examples/latest-run.ts';
test('latest-run wins over earlier completion',()=>{
 const guard=new LatestRunGuard();
 const first=guard.start(), second=guard.start();
 assert.equal(guard.isCurrent(first),false);
 assert.equal(guard.isCurrent(second),true);
});
test('cancel invalidates outstanding result',()=>{
 const guard=new LatestRunGuard();const token=guard.start();
 guard.invalidate();
 assert.equal(guard.isCurrent(token),false);
 assert.equal(guard.isCurrent(guard.start()),true);
});
test('two independent demos do not share run versions',()=>{
 const a=new LatestRunGuard(),b=new LatestRunGuard();
 const one=a.start(),two=b.start();a.invalidate();
 assert.equal(a.isCurrent(one),false);assert.equal(b.isCurrent(two),true);
});
