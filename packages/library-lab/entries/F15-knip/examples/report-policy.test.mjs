import test from 'node:test';
import assert from 'node:assert/strict';
import { checkKnipReport } from './report-policy.mjs';
const report = (issues) => JSON.stringify({ issues });
const orphan = { file:'src/unused.ts', files:[{name:'src/unused.ts'}] };
const dep = { file:'package.json', dependencies:[{name:'clsx'}] };
test('basic requires a structural unused-file finding', () => {
  assert.deepEqual(checkKnipReport('basic',1,report([orphan,dep])), {count:2,orphan:true});
});
test('business suppression is checked without ignoring unrelated findings', () => {
  assert.deepEqual(checkKnipReport('business',1,report([dep])), {count:1,orphan:false});
  assert.throws(() => checkKnipReport('business',1,report([orphan])));
});
test('Knip tool errors, malformed JSON and mismatched exit reject', () => {
  for (const [exit,out] of [[2,report([orphan])],[0,report([orphan])],[1,'{}'],[1,'garbage']])
    assert.throws(() => checkKnipReport('basic',exit,out));
});
test('advanced may legitimately have no production issues', () => {
  assert.deepEqual(checkKnipReport('advanced',0,report([])),{count:0,orphan:false});
});
