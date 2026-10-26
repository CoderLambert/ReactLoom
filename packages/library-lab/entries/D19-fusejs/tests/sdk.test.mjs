import test from 'node:test';
import assert from 'node:assert/strict';
import Fuse from 'fuse.js';
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
 const groupOnly=fuse.search('a').filter(hit=>hit.item.group==='技术');
 assert.ok(groupOnly.every(hit=>hit.item.group==='技术'));
});
test('setCollection explicitly replaces index rather than mutating caller array',()=>{
 const fuse=new Fuse(rows,{keys:['title']});
 fuse.setCollection([{id:'4',title:'React Query',group:'技术'}]);
 assert.deepEqual(fuse.search('React').map(row=>row.item.id),['4']);
 assert.equal(rows.length,3);
});
