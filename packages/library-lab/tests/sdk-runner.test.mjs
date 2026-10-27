import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {discoverSdkTests,parseSdkArguments,selectSdkTests,isSdkSuiteName} from '../scripts/sdk-runner.mjs';
test('finds entry Node SDK tests and excludes TypeScript Vitest recipes',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'lab-sdk-runner-'));t.after(()=>rm(root,{force:true,recursive:true}));
 for(const d of ['tests','entries/F11-msw/tests','entries/C14-date-fns/tests','entries/F12-vitest/tests'])await mkdir(path.join(root,d),{recursive:true});
 for(const f of ['tests/sdk.test.mjs','entries/F11-msw/tests/node-scenarios.test.mjs','entries/C14-date-fns/tests/sdk.test.mjs','entries/F12-vitest/tests/advanced.test.ts','entries/C14-date-fns/tests/format-policy.test.mjs'])await writeFile(path.join(root,f),'// fixture');
 assert.deepEqual(await discoverSdkTests(root),['tests/sdk.test.mjs','entries/C14-date-fns/tests/sdk.test.mjs','entries/F11-msw/tests/node-scenarios.test.mjs']);
});

const fixtureFiles=[
 'tests/sdk.test.mjs',
 'entries/A01-echarts/tests/sdk.test.mjs',
 'entries/B17-floating-ui/tests/sdk.test.mjs',
 'entries/B17-floating-ui/tests/render.test.mjs',
 'entries/D03-p-limit/tests/sdk.test.mjs',
];
test('default preserves global and all entry suites',()=>{
 assert.deepEqual(selectSdkTests(fixtureFiles),[fixtureFiles[0],fixtureFiles[1],fixtureFiles[2],fixtureFiles[4]]);
});
test('precisely scopes to one or multiple entries, never running the global suite',()=>{
 assert.deepEqual(selectSdkTests(fixtureFiles,{entries:['D03']}),['entries/D03-p-limit/tests/sdk.test.mjs']);
 assert.deepEqual(selectSdkTests(fixtureFiles,{entries:['B17','A01']}),fixtureFiles.slice(1,3));
});
test('selects group suites without unrelated entries',()=>{
 assert.deepEqual(selectSdkTests(fixtureFiles,{group:'B'}),fixtureFiles.slice(2,3));
});
test('missing named SDK suite is a hard error (no silent PASS)',()=>{
 assert.throws(()=>selectSdkTests(fixtureFiles,{entries:['F12']}),/No SDK test suite for: F12/);
 assert.throws(()=>selectSdkTests(fixtureFiles,{entries:['D03','F11']}),/No SDK test suite for: F11/);
 assert.throws(()=>selectSdkTests(fixtureFiles,{group:'C'}),/No matching SDK test suites/);
});
test('only exact entry IDs and mutually exclusive selectors are accepted',()=>{
 assert.deepEqual(parseSdkArguments(['--entry=B17','--entries=A01,D03','--list']),{entries:['A01','B17','D03'],group:null,list:true});
 assert.deepEqual(parseSdkArguments(['--group=A']),{entries:null,group:'A',list:false});
 for(const args of [['--entry=../x'],['--group=../../x'],['--entries=A01,'],['--group=C','--entry=C01'],['--unknown']]){
  assert.throws(()=>parseSdkArguments(args),/Invalid|Unknown|mutually exclusive/);
 }
});

test('a policy-only entry cannot satisfy an explicit real SDK selector',()=>{
 const mixed=['tests/sdk.test.mjs','entries/C07-tanstack-table/tests/page-policy.test.mjs','entries/D03-p-limit/tests/sdk.test.mjs'];
 assert.deepEqual(selectSdkTests(mixed),[mixed[0],mixed[2]]);
 assert.throws(()=>selectSdkTests(mixed,{entries:['C07']}),/No SDK test suite/);
});
test('only SDK and Node scenario test filenames qualify',()=>{
 assert.equal(isSdkSuiteName('sdk.test.mjs'),true);
 assert.equal(isSdkSuiteName('node-scenarios.test.mjs'),true);
 assert.equal(isSdkSuiteName('routes.test.mjs'),false);
 assert.equal(isSdkSuiteName('migration-policy.test.mjs'),false);
});
