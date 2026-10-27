import test from 'node:test';
import assert from 'node:assert/strict';
import {INITIAL_ARTICLE,applyDemoAction} from '../examples/command-state.ts';
test('save toggles without mutating the original article',()=>{
  const next=applyDemoAction(INITIAL_ARTICLE,'save');
  assert.equal(next.saved,true);
  assert.equal(INITIAL_ARTICLE.saved,false);
  assert.equal(applyDemoAction(next,'save').saved,false);
});
test('mark read is idempotent and keeps saved state',()=>{
  const saved=applyDemoAction(INITIAL_ARTICLE,'save');
  const read=applyDemoAction(saved,'read');
  assert.equal(read.read,true);
  assert.equal(read.saved,true);
  assert.strictEqual(applyDemoAction(read,'read'),read);
});
test('citation is generated locally and does not require clipboard permissions',()=>{
  const next=applyDemoAction(INITIAL_ARTICLE,'copy');
  assert.match(next.citation??'',/NewsHub/);
});
test('refresh is a bounded local demonstration counter by command choice, not network IO',()=>{
  const a=applyDemoAction(INITIAL_ARTICLE,'refresh');
  const b=applyDemoAction(a,'refresh');
  assert.equal(b.refreshCount,2);
});
