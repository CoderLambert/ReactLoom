import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {discoverSdkTests} from '../scripts/sdk-runner.mjs';
test('finds entry Node SDK tests and excludes TypeScript Vitest recipes',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'lab-sdk-runner-'));t.after(()=>rm(root,{force:true,recursive:true}));
 for(const d of ['tests','entries/F11-msw/tests','entries/C14-date-fns/tests','entries/F12-vitest/tests'])await mkdir(path.join(root,d),{recursive:true});
 for(const f of ['tests/sdk.test.mjs','entries/F11-msw/tests/node-scenarios.test.mjs','entries/C14-date-fns/tests/sdk.test.mjs','entries/F12-vitest/tests/advanced.test.ts'])await writeFile(path.join(root,f),'// fixture');
 assert.deepEqual(await discoverSdkTests(root),['tests/sdk.test.mjs','entries/C14-date-fns/tests/sdk.test.mjs','entries/F11-msw/tests/node-scenarios.test.mjs']);
});
