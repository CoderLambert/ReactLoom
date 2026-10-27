import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveSearchView, sanitizeQuery, MAX_QUERY_LENGTH} from '../examples/url-policy.mjs';
const feeds=[{id:'1',name:'React 新闻',group:'tech'},{id:'2',name:'商业日报',group:'business'},{id:'3',name:'React 分享',group:'tech'}];
test('basic ignores hidden group left from a previous advanced level',()=>{
 const view=deriveSearchView({level:'basic',query:'',group:'business',page:2},feeds);
 assert.equal(view.safeGroup,'all');assert.equal(view.matches.length,3);
});
test('clamps huge/invalid deep-link pages without losing stable result order',()=>{
 for(const page of [-1,0,NaN,Number.MAX_SAFE_INTEGER+1]){
  assert.equal(deriveSearchView({level:'advanced',query:'React',group:'tech',page},feeds).safePage,1);
 }
 const view=deriveSearchView({level:'advanced',query:'React',group:'tech',page:99},feeds);
 assert.equal(view.safePage,1);assert.deepEqual(view.pageItems.map(x=>x.id),['1','3']);
});
test('sanitizes control characters and caps Unicode code points',()=>{
 assert.equal(sanitizeQuery('  React\n\u0000新闻 '),'React新闻');
 assert.equal(Array.from(sanitizeQuery('😀'.repeat(100))).length,MAX_QUERY_LENGTH);
});
test('business selection uses both normalized group and query',()=>{
 const view=deriveSearchView({level:'business',query:'日报',group:'business',page:1},feeds);
 assert.deepEqual(view.matches.map(x=>x.id),['2']);
});
