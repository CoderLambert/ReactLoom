import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
async function planner(){let module;try{module=await import('../scripts/ci-scope.mjs');}catch{}assert.equal(typeof module?.classifyChanges,'function');return module;}
test('documentation and evidence edits do not trigger SDK/browser installs',async()=>{
 const {classifyChanges}=await planner();
 const result=classifyChanges(['docs/library-lab/progress/PLATFORM.md','packages/library-lab/entries/A01-echarts/guide.md','packages/library-lab/entries/D03-p-limit/verification.json']);
 assert.equal(result.runtime,false);assert.equal(result.all,false);assert.deepEqual(result.entries,[]);
});
test('entry source edits select precise IDs, including deleted paths',async()=>{
 const {classifyChanges}=await planner();
 assert.deepEqual(classifyChanges(['packages/library-lab/entries/A01-echarts/examples/demo.tsx','packages/library-lab/entries/D03-p-limit/tests/sdk.test.mjs']).entries,['A01','D03']);
 for(const suffix of ['assets/data.json','unknown-loader.mjs'])assert.deepEqual(classifyChanges(['packages/library-lab/entries/A01-echarts/'+suffix]).entries,['A01']);
 for(const input of [null,[42]])assert.throws(()=>classifyChanges(input),TypeError);
});
test('host, dependencies and workflow edits select full gates',async()=>{
 const {classifyChanges}=await planner();
 for(const name of ['pnpm-lock.yaml','.npmrc','packages/tsconfig/base.json','packages/library-lab/src/components/demo-host.tsx','.github/workflows/library-lab.yml']){
  assert.equal(classifyChanges([name]).all,true,name);
 }
});
test('missing or invalid Git base falls back to full, not an empty selection',async t=>{
 const {planFromGit}=await planner();const repo=await mkdtemp(path.join(tmpdir(),'lab-scope-'));t.after(()=>rm(repo,{recursive:true,force:true}));
 const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8',stdio:['ignore','pipe','pipe']});
 git(['init','-q']);await writeFile(path.join(repo,'README.md'),'one');git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@localhost','commit','-qm','fixture']);
 assert.equal(planFromGit('',repo).all,true);assert.equal(planFromGit('not-a-sha',repo).all,true);
 const base=git(['rev-parse','HEAD']).trim();await writeFile(path.join(repo,'README.md'),'two');git(['add','.']);git(['-c','user.name=Fixture','-c','user.email=fixture@localhost','commit','-qm','docs']);
 assert.equal(planFromGit(base,repo).runtime,false);
});
