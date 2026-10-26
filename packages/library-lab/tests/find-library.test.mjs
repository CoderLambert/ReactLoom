import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {searchEntries,loadEntries,parseArgs,agentPaths,relatedEntries,runCli} from '../scripts/find-library.mjs';
const a={schemaVersion:1,entryId:'D03',slug:'p-limit',group:'D',name:'p-limit',summary:'Promise 并发控制',contentState:'recreated',tags:['队列','并发'],packages:[{name:'p-limit',version:'7.3.3'}],demos:[],related:[],references:[]};
const b={...a,entryId:'A01',slug:'echarts',group:'A',name:'Apache ECharts',summary:'绘制图表',tags:['图表'],packages:[{name:'echarts',version:null}]};
test('search prioritizes exact names, uses AND keywords and stable ID order',()=>{
 assert.deepEqual(searchEntries([b,a],{query:'p-limit'}).map(e=>e.entryId),['D03']);
 assert.deepEqual(searchEntries([b,a],{query:'并发 队列'}).map(e=>e.entryId),['D03']);
 assert.deepEqual(searchEntries([b,a],{query:'图表',group:'D'}),[]);
 assert.deepEqual(searchEntries([b,a],{query:'不可能'}),[]);
});
test('parse arguments rejects unsafe scope and unbounded output',()=>{
 assert.equal(parseArgs(['--group','d','--limit','3']).group,'D');
 assert.throws(()=>parseArgs(['--limit','1000']),/Limit/);
 assert.throws(()=>parseArgs(['--agent']),/requires/);
 assert.throws(()=>parseArgs(['--related']),/requires/);
 assert.throws(()=>parseArgs(['--id','../../root']),/Entry ID/);
});
test('agent paths point into one entry and cannot be mistaken for completed evidence',()=>{
 const p=agentPaths({...a,directory:'D03-p-limit'});
 assert.equal(p.agent,'packages/library-lab/entries/D03-p-limit/agent.md');
 assert.match(p.verification,/verification\.json$/u);
});
test('offline CLI navigates a fixture without generated assets or npm install',async t=>{
 const root=await mkdtemp(path.join(tmpdir(),'lab-find-'));t.after(()=>rm(root,{recursive:true,force:true}));
 await mkdir(path.join(root,'D03-p-limit'));
 await writeFile(path.join(root,'D03-p-limit/library.json'),JSON.stringify(a));
 await writeFile(path.join(root,'D03-p-limit/agent.md'),'# 实施约束');
 const messages=[];const code=await runCli(['--id','D03','--agent'],{entriesRoot:root,write:v=>messages.push(v)});
 assert.equal(code,0);assert.match(messages.join('\n'),/实施约束/u);
 const json=[];await runCli(['--query','并发','--json'],{entriesRoot:root,write:v=>json.push(v)});
 assert.equal(JSON.parse(json[0]).results[0].id,'D03');
 assert.equal((await loadEntries(root)).length,1);
});

test('offline agent retrieval explains related-library decisions with stable paths',()=>{
 const src={...a,related:[{entryId:'A01',relation:'complements',reason:'配合可视化队列吞吐'}]};
 const linked=relatedEntries(src,[src,{...b,directory:'A01-echarts'}]);
 assert.equal(linked.length,1);
 assert.equal(linked[0].relation,'complements');
 assert.match(linked[0].paths.agent,/A01-echarts\/agent.md$/u);
});
