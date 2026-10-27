import test from 'node:test';
import assert from 'node:assert/strict';
import Fuse from 'fuse.js';
import {resolveScope,visibleDocuments} from '../examples/search-scope.mjs';
const rows=[{id:'1',title:'React performance',group:'技术'},{id:'2',title:'Market briefing',group:'商业'},
{id:'3',title:'GraphQL tutorial',group:'技术'}];
test('actual Fuse.js indexes and returns identified ranked documents',()=>{
 const fuse=new Fuse(rows,{includeScore:true,keys:['title'],threshold:0.35});
 const matches=fuse.search('React');
 assert.equal(matches[0].item.id,'1');
 assert.ok(matches[0].score>=0&&matches[0].score<=1);
});
test('actual SDK honors result limit and has no implicit group permission filter',()=>{
 const fuse=new Fuse(rows,{keys:['title'],threshold:0.8});
 assert.ok(fuse.search('r',{limit:1}).length<=1);
 const allHits=fuse.search('a');
 assert.ok(allHits.some(hit=>hit.item.group==='商业'));
 const scopedDocs=rows.filter(row=>row.group==='技术');
 const scopedFuse=new Fuse(scopedDocs,{keys:['title'],threshold:0.8});
 const scopedHits=scopedFuse.search('a');
 assert.ok(scopedHits.length>0);
 assert.ok(scopedHits.every(hit=>hit.item.group==='技术'));
 assert.ok(scopedHits.length<allHits.length);
});
test('setCollection explicitly replaces index rather than mutating caller array',()=>{
 const fuse=new Fuse(rows,{keys:['title']});
 fuse.setCollection([{id:'4',title:'React Query',group:'技术'}]);
 assert.deepEqual(fuse.search('React').map(row=>row.item.id),['4']);
 assert.equal(rows.length,3);
});

test('real Fuse index reflects active mode instead of stale hidden options',()=>{
 const scope=resolveScope({level:'basic',group:'商业',threshold:0.55});
 const fuse=new Fuse(visibleDocuments(rows,scope.group),{keys:['title'],threshold:scope.threshold});
 assert.equal(fuse.search('React')[0]?.item.id,'1');
 const narrowed=resolveScope({level:'business',group:'商业',threshold:0.55});
 const scopedFuse=new Fuse(visibleDocuments(rows,narrowed.group),{keys:['title'],threshold:narrowed.threshold});
 assert.equal(scopedFuse.search('React').some(hit=>hit.item.id==='1'),false);
});
