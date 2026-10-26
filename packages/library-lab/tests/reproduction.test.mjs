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

test('Playwright workshops use their checked-in standalone config, not the app test runner',()=>{
 const e={directory:'F13-playwright',packages:[{name:'@playwright/test',version:'1.64.0'}]};
 const demo={executionKind:'node-ci',level:'business',entryPoint:'examples/business.spec.ts',sourceFiles:['examples/business.spec.ts','examples/playwright.config.ts']};
 assert.equal(reproductionCommand(e,demo),'pnpm exec playwright test --config=entries/F13-playwright/examples/playwright.config.ts entries/F13-playwright/examples/business.spec.ts');
 assert.equal(reproductionCommand(e,{...demo,sourceFiles:['examples/business.spec.ts']}),null,'missing config cannot silently fall back to app tests');
});
