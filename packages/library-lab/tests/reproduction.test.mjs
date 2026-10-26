import test from 'node:test';
import assert from 'node:assert/strict';
import {reproductionCommand} from '../src/lib/reproduction.mjs';
const entry={directory:'F12-vitest',packages:[{name:'vitest',version:'5.0.5'}]};
const base={executionKind:'node-ci',level:'basic',entryPoint:'examples/basic.test.ts',sourceFiles:['examples/basic.test.ts']};
test('Vitest recipes use Vitest not node',()=>assert.equal(reproductionCommand(entry,base),'pnpm exec vitest run entries/F12-vitest/examples/basic.test.ts'));
test('Node recipes distinguish executable and test files',()=>{
 const e={directory:'F11-msw',packages:[{name:'msw',version:'3.0.3'}]};
 assert.equal(reproductionCommand(e,{...base,entryPoint:'examples/run.mjs',sourceFiles:['examples/run.mjs'],level:'advanced'}),'node entries/F11-msw/examples/run.mjs advanced');
 assert.equal(reproductionCommand(e,{...base,entryPoint:'tests/node-scenarios.test.mjs',sourceFiles:['tests/node-scenarios.test.mjs']}),'node --test entries/F11-msw/tests/node-scenarios.test.mjs');
});
test('rejects unsafe paths and unsupported modes',()=>{
 for(const bad of ['../test.mjs','foo;rm.mjs','foo\\bar.mjs','/etc/test.mjs'])assert.equal(reproductionCommand(entry,{...base,entryPoint:bad,sourceFiles:[bad]}),null);
 assert.equal(reproductionCommand(entry,{...base,sourceFiles:[]}),null);
 assert.equal(reproductionCommand(entry,{...base,executionKind:'react'}),null);
 assert.equal(reproductionCommand({directory:'F12-vitest;echo BAD',packages:entry.packages},base),null);
 assert.equal(reproductionCommand({directory:'F12-vitest',packages:[]},base),null);
});
