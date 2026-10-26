import test from 'node:test';
import assert from 'node:assert/strict';
import {chunk,groupBy,orderBy,uniqBy} from 'es-toolkit/array';
test('actual es-toolkit: newest article retained for same canonical key',()=>{
 const rows=[{url:'a',date:1},{url:'b',date:2},{url:'a',date:3}];
 const sorted=orderBy(rows,[x=>x.date],['desc']);
 assert.deepEqual(uniqBy(sorted,x=>x.url).map(x=>[x.url,x.date]),[['a',3],['b',2]]);
});
test('actual es-toolkit: groups and bounded chunks',()=>{
 const rows=[{source:'official'},{source:'community'},{source:'official'}];
 const grouped=groupBy(rows,x=>x.source);
 assert.equal(grouped.official.length,2);
 assert.deepEqual(chunk([1,2,3,4,5],2),[[1,2],[3,4],[5]]);
});
