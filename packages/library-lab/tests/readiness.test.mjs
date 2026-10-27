import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {sourceFingerprint,verifiedState} from '../scripts/verification-contract.mjs';
import {readinessReport,parseReadinessArgs,formatReadiness} from '../scripts/readiness.mjs';
const hash=value=>createHash('sha256').update(value).digest('hex');
const data={schemaVersion:1,entryId:'D03',slug:'p-limit',group:'D',name:'p-limit',summary:'并发',tags:[],contentState:'recreated',packages:[{name:'p-limit',version:'7.3.3'}],references:[],related:[],demos:['basic','business','advanced'].map(level=>({demoId:level,level,title:level,executionKind:'node-ci',entryPoint:'examples/demo.mjs',sourceFiles:['examples/demo.mjs']}))};
async function fixture(t){
 const repo=await mkdtemp(path.join(tmpdir(),'lab-ready-'));t.after(()=>rm(repo,{recursive:true,force:true}));
 const root=path.join(repo,'packages/library-lab/entries'),folder=path.join(root,'D03-p-limit');
 await mkdir(path.join(folder,'examples'),{recursive:true});
 for(const [file,content] of Object.entries({'library.json':JSON.stringify(data),'guide.md':'# Guide','agent.md':'# Agent','AGENTS.md':'# Rules','examples/demo.mjs':'export default 2','verification.json':JSON.stringify({sdk:{status:'NOT_RUN'}})}))await writeFile(path.join(folder,file),content);
 return {repo,root,folder};
}
// These are synthetic receipt fixtures, never an execution of p-limit itself.
async function recordFixture(f,status,fingerprint){
 const command='node scripts/sdk-runner.mjs --entry=D03';
 const evidence='docs/library-lab/evidence/runs/fixture.json',logPath='docs/library-lab/evidence/runs/fixture.log';
 const log=Buffer.from('Synthetic receipt validation fixture: '+status+'\n');
 const receipt={schemaVersion:1,kind:'sdk',entryId:'D03',sourceFingerprint:fingerprint,command,status,exitCode:status==='PASS'?0:1,head:'a'.repeat(40),node:'22.18.0',startedAt:'2026-10-28T00:00:00Z',finishedAt:'2026-10-28T00:00:01Z',log:{path:logPath,sha256:hash(log),bytes:log.length}};
 const bytes=JSON.stringify(receipt);
 await mkdir(path.dirname(path.join(f.repo,evidence)),{recursive:true});
 await writeFile(path.join(f.repo,evidence),bytes);await writeFile(path.join(f.repo,logPath),log);
 await writeFile(path.join(f.folder,'verification.json'),JSON.stringify({sdk:{status,sourceFingerprint:fingerprint,command,evidence,evidenceSha256:hash(bytes)}}));
}
test('two-argument fingerprint retains the original manifest formula',()=>{const files=[{path:'a',sha256:'123'}];assert.equal(sourceFingerprint(data.packages,files),hash(JSON.stringify({packages:data.packages,sources:files})));});
test('stale PASS never counted',()=>{const old=verifiedState({sdk:{status:'PASS',command:'node --test',evidence:'log',sourceFingerprint:'other'}},'current');assert.equal(old.sdk.status,'NOT_RUN');assert.match(old.sdk.note,/STALE/);});
test('matching fingerprint with an unverified evidence string cannot preserve PASS',()=>{assert.equal(verifiedState({sdk:{status:'PASS',command:'node --test',evidence:'log',sourceFingerprint:'current'}},'current').sdk.status,'NOT_RUN');});
test('3 levels are declarations, not SDK execution',async t=>{const{root}=await fixture(t);const r=await readinessReport(root);assert.equal(r.counts.sourceComplete,1);assert.equal(r.counts.scenarioDeclarations,3);assert.equal(r.verification.sdk.PASS,0);assert.equal(r.verification.sdk.NOT_RUN,1);assert.match(formatReadiness(r),/not execution evidence/);});
test('source edits invalidate a verified receipt',async t=>{
 const f=await fixture(t);let r=await readinessReport(f.root);
 await recordFixture(f,'PASS',r.entries[0].fingerprint);r=await readinessReport(f.root);assert.equal(r.verification.sdk.PASS,1);
 await writeFile(path.join(f.folder,'examples/demo.mjs'),'export default 3');r=await readinessReport(f.root);assert.equal(r.verification.sdk.PASS,0);assert.equal(r.verification.sdk.NOT_RUN,1);
});
test('missing required documentation causes incomplete status',async t=>{const{root,folder}=await fixture(t);await rm(path.join(folder,'agent.md'));const r=await readinessReport(root);assert.equal(r.counts.sourceComplete,0);assert.equal(r.counts.sourceIncomplete,1);assert.match(r.entries[0].issues.join(' '),/agent/);});
test('unsafe argument selectors rejected',()=>{assert.deepEqual(parseReadinessArgs(['--group=D','--json']),{group:'D',json:true});assert.throws(()=>parseReadinessArgs(['--group=../../etc']),/Usage/);assert.throws(()=>parseReadinessArgs(['--entry=../private']),/Usage/);});
test('stale recorded FAIL is not a failure of changed source',async t=>{
 const f=await fixture(t);let r=await readinessReport(f.root);
 await recordFixture(f,'FAIL',r.entries[0].fingerprint);r=await readinessReport(f.root);assert.equal(r.verification.sdk.FAIL,1);
 await writeFile(path.join(f.folder,'examples/demo.mjs'),'export default 9');r=await readinessReport(f.root);
 assert.equal(r.verification.sdk.FAIL,0);assert.equal(r.verification.sdk.NOT_RUN,1);assert.match(r.entries[0].verification.sdk.note,/STALE.*FAIL/);
});
test('PASS and FAIL both reject malformed, missing or unverified execution evidence',()=>{
 for(const status of ['PASS','FAIL'])for(const record of [
  {sourceFingerprint:'current',command:'node --test',evidence:{url:'mock.json'}},
  {sourceFingerprint:'current',command:'   ',evidence:'run.tap'},
  {sourceFingerprint:'current',command:'node --test',evidence:''},
  {sourceFingerprint:'old',command:'node --test',evidence:'run.tap'},
  {sourceFingerprint:'current',command:'node --test',evidence:'run.tap'},
 ]){const state=verifiedState({sdk:{status,...record}},'current');assert.equal(state.sdk.status,'NOT_RUN');assert.match(state.sdk.note,/STALE/);}
 assert.equal(verifiedState({sdk:{status:'BLOCKED',note:'Registry unavailable'}},'current').sdk.status,'BLOCKED');
});
