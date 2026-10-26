import test from 'node:test';
import assert from 'node:assert/strict';
import {entryCompletenessIssues} from '../scripts/entry-gate.mjs';
const complete={contentState:'recreated',demos:['basic','business','advanced'].map(level=>({demoId:level,level,entryPoint:'examples/demo.tsx',sourceFiles:['examples/demo.tsx']}))};
const docs={guide:true,agent:true,agents:true,verification:true};
test('pending catalogue entries must not expose fake runnable demos',()=>{
 assert.deepEqual(entryCompletenessIssues({contentState:'missing',demos:[]}),[]);
 assert.match(entryCompletenessIssues({...complete,contentState:'missing'})[0],/must not declare/);
});
test('three real levels plus four required files mark an entry structurally complete',()=>{
 assert.deepEqual(entryCompletenessIssues(complete,docs),[]);
});
test('reviewed entries fail when guide, scoped Agent rules or evidence are absent',()=>{
 const failures=entryCompletenessIssues(complete,{guide:true});
 assert.ok(failures.some(e=>e.includes('agent file')));
 assert.ok(failures.some(e=>e.includes('verification file')));
});
test('rejects duplicate, missing or orphaned entryPoints and avoids a false complete status',()=>{
 const missing=entryCompletenessIssues({...complete,demos:complete.demos.slice(0,2)},docs);
 assert.ok(missing.some(e=>e.includes('three demos')));
 const orphaned=entryCompletenessIssues({...complete,demos:complete.demos.map(d=>({...d,sourceFiles:[]}))},docs);
 assert.equal(orphaned.filter(e=>e.includes('sourceFiles')).length,3);
 const dup=entryCompletenessIssues({...complete,demos:complete.demos.map(d=>({...d,level:'basic'}))},docs);
 assert.ok(dup.some(e=>e.includes('one business demo')));
});
