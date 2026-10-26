import test from 'node:test';
import assert from 'node:assert/strict';
import {filterEntries, validateEntry, safeRelativePath, safeLink, normalizeTab} from '../src/lib/catalog.mjs';
const sample={schemaVersion:1,entryId:'D03',slug:'p-limit',name:'p-limit',group:'D',summary:'并发任务控制',tags:['concurrency'],contentState:'reviewed',packages:[{name:'p-limit',version:'7.2.0'}],references:[],related:[],demos:[]};
test('entry identity is validated',()=>assert.deepEqual(validateEntry(sample),[]));
test('unknown category is rejected',()=>assert.ok(validateEntry({...sample,group:'Z'}).length));
test('group/id mismatch is rejected',()=>assert.ok(validateEntry({...sample,group:'A'}).length));
test('invalid slug is rejected',()=>assert.ok(validateEntry({...sample,slug:'../escape'}).length));
test('text search supports name and Chinese task',()=>{assert.equal(filterEntries([sample],'并发','all').length,1);assert.equal(filterEntries([sample],'p-limit','D').length,1);});
test('search is a term intersection',()=>assert.equal(filterEntries([sample],'并发 不存在','all').length,0));
test('group filter excludes other categories',()=>assert.equal(filterEntries([sample],'','A').length,0));
test('tag search is case insensitive',()=>assert.equal(filterEntries([sample],'CONCURRENCY','all').length,1));
test('paths reject traversal and backslashes',()=>{for(const p of ['../x','a/../../x','/etc/passwd','a\\x','a//x','a/./x']) assert.equal(safeRelativePath(p),false,p);assert.equal(safeRelativePath('examples/basic/demo.tsx'),true);});
test('links reject executable and remote asset protocols',()=>{for(const p of ['javascript:alert(1)','data:text/html,hi','//evil.test','file:///x']) assert.equal(safeLink(p),'');assert.equal(safeLink('https://example.org/docs'),'https://example.org/docs');});
test('only four tabs are accepted',()=>{assert.equal(normalizeTab('agent'),'agent');assert.equal(normalizeTab('../../x'),'demo');});
test('references must be safe https URLs',()=>assert.ok(validateEntry({...sample,references:[{title:'x',url:'javascript:1'}]}).length));
test('source files cannot escape an entry',()=>assert.ok(validateEntry({...sample,demos:[{demoId:'basic',title:'基础',level:'basic',executionKind:'react',entryPoint:'../escape.tsx',sourceFiles:['../x']}]}).length));

test('filter includes reproducible Node CLI examples without pretending they run in the browser',()=>{
 const node={...sample,demos:[{demoId:'basic',title:'Node CLI',level:'basic',executionKind:'node-ci',entryPoint:'examples/run.mjs',sourceFiles:['examples/run.mjs']}]};
 assert.equal(filterEntries([node], '', 'all', true).length,1);
 assert.equal(filterEntries([sample], '', 'all', true).length,0);
});
