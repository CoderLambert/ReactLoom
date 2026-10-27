import test from 'node:test';
import assert from 'node:assert/strict';
import {toCatalogIndex,validateCatalogIndex,validateCatalogDetail,filterCatalogIndex} from '../src/lib/catalog-index.mjs';
const detail={schemaVersion:1,entryId:'D03',slug:'p-limit',name:'p-limit',group:'D',summary:'限制批处理并发',tags:['并发'],contentState:'recreated',packages:[{name:'p-limit',version:'7.3.3'}],references:[],related:[],demos:[{demoId:'basic',title:'可运行示例',level:'basic',executionKind:'react',entryPoint:'examples/demo.tsx',sourceFiles:['examples/demo.tsx']}],sourceFingerprint:'e'.repeat(64),verification:{sdk:{status:'NOT_RUN'},build:{status:'BLOCKED'},browser:{status:'NOT_RUN'}}};
const index=toCatalogIndex([detail]);
test('index contains only landing-page data, no source code or claim of successful SDK execution',()=>{
 const [card]=validateCatalogIndex(index);
 assert.equal(card.hasDemo,true);
 assert.equal(card.demoCount,1);
 assert.deepEqual(card.packageNames,['p-limit']);
 for(const field of ['demos','verification','related','packages','references']) assert.equal(Object.hasOwn(card,field),false);
 assert.equal(JSON.stringify(index).includes('examples/demo.tsx'),false);
});
test('index rejects duplicate or conflicting identities and invalid fingerprint',()=>{
 assert.throws(()=>validateCatalogIndex([index[0],index[0]]),/重复/);
 assert.throws(()=>validateCatalogIndex([{...index[0],slug:'../bad'}]),/无效/);
 assert.throws(()=>validateCatalogIndex([{...index[0],sourceFingerprint:''}]),/无效/);
 assert.throws(()=>validateCatalogIndex([{...index[0],demoCount:0,hasDemo:true}]),/无效/);
});
test('detail must match the exact indexed source and route',()=>{
 assert.equal(validateCatalogDetail(detail,index[0]),detail);
 assert.throws(()=>validateCatalogDetail({...detail,sourceFingerprint:'b'.repeat(64)},index[0]),/版本不匹配/);
 assert.throws(()=>validateCatalogDetail({...detail,slug:'different'},index[0]),/版本不匹配/);
 assert.throws(()=>validateCatalogDetail({...detail,verification:{sdk:{status:'PASS',sourceFingerprint:detail.sourceFingerprint}}},index[0]),/验证状态|PASS|sdk/u);
});
test('lightweight search preserves Chinese terms, groups, package names and CLI demo visibility',()=>{
 assert.equal(filterCatalogIndex(index,'批处理 并发','D',true).length,1);
 assert.equal(filterCatalogIndex(index,'P-LIMIT','all',true).length,1);
 assert.equal(filterCatalogIndex(index,'批处理','A',false).length,0);
 assert.equal(filterCatalogIndex([{...index[0],hasDemo:false}],'','all',true).length,0);
});
