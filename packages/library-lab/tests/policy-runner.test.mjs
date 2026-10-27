import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {discoverPolicyTests,selectPolicyTests} from '../scripts/policy-runner.mjs';
import {discoverSdkTests,selectSdkTests} from '../scripts/sdk-runner.mjs';

async function fixture(t){
 const root=await mkdtemp(path.join(tmpdir(),'lab-policy-test-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 for(const dir of ['tests','entries/A04-uplot/tests','entries/C07-table/tests','entries/F11-msw/tests','entries/F11-msw/examples']){
  await mkdir(path.join(root,dir),{recursive:true});
 }
 for(const name of [
  'tests/sdk.test.mjs',
  'entries/A04-uplot/tests/stream-policy.test.mts',
  'entries/C07-table/tests/page-policy.test.mjs',
  'entries/F11-msw/tests/node-scenarios.test.mjs',
  'entries/F11-msw/tests/routes.test.mjs',
  'entries/F11-msw/examples/registration-policy.test.mjs'
 ])await writeFile(path.join(root,name),"import test from 'node:test';test('fixture',()=>{});");
 return root;
}
test('policy discovery includes TS type-stripping suites and excludes real SDK suites',async t=>{
 const root=await fixture(t);
 const files=await discoverPolicyTests(root);
 assert.deepEqual(files,[
  'entries/A04-uplot/tests/stream-policy.test.mts',
  'entries/C07-table/tests/page-policy.test.mjs',
  'entries/F11-msw/examples/registration-policy.test.mjs',
  'entries/F11-msw/tests/routes.test.mjs',
 ]);
 assert.deepEqual(selectPolicyTests(files,{group:'F'}),files.slice(2));
 assert.throws(()=>selectPolicyTests(files,{entries:['D03']}),/No policy suite/);
});
test('SDK selection cannot silently count a pure policy-only entry as SDK PASS',async t=>{
 const root=await fixture(t);
 const sdk=await discoverSdkTests(root);
 assert.deepEqual(sdk,['tests/sdk.test.mjs','entries/F11-msw/tests/node-scenarios.test.mjs']);
 assert.throws(()=>selectSdkTests([...sdk,'entries/C07-table/tests/page-policy.test.mjs'],{entries:['C07']}),/No SDK test suite/);
});
test('malformed entry names and injected selectors are rejected',()=>{
 assert.throws(()=>selectPolicyTests(['entries/../../secret/tests/run.test.mjs']),/No matching policy/);
 assert.throws(()=>selectPolicyTests(['entries/F11-msw/tests/routes.test.mjs'],{entries:['Z99']}),/Invalid/);
});
