import test from 'node:test';
import assert from 'node:assert/strict';
import MiniSearch from 'minisearch';
import {scopeSearchDocuments} from '../examples/scope-policy.mjs';
const docs=[{id:'1',title:'React Suspense',group:'tech',body:'Async state'},
  {id:'2',title:'Product positioning',group:'market',body:'Market research'},
  {id:'3',title:'React Query',group:'tech',body:'Cache invalidation'}];
function make(items){const engine=new MiniSearch({fields:['title','body'],storeFields:['group'],
  searchOptions:{boost:{title:3},prefix:true,fuzzy:0.2}});engine.addAll(items);return engine;}
test('actual MiniSearch searches indexed titles and prefixes',()=>{
  const index=make(docs);const hits=index.search('React');
  assert.ok(hits.length>=2);
  assert.ok(hits.some(hit=>hit.id==='1'));
  assert.ok(index.search('Susp',{prefix:true}).some(hit=>hit.id==='1'));
});
test('actual MiniSearch filters before top results and rebuilds changed content',()=>{
  const index=make(docs);
  assert.ok(index.search('React',{filter:hit=>hit.id==='1'}).every(hit=>hit.id==='1'));
  const updated=make(docs.map(doc=>doc.id==='1'?{...doc,title:'Vue animation',body:'Motion'}:doc));
  assert.ok(updated.search('Vue').some(hit=>hit.id==='1'));
  assert.equal(index.search('Vue').length,0);
  assert.ok(index.autoSuggest('React',{prefix:true}).length>0);
});


test('real MiniSearch autoSuggest is scoped before indexing, not just search filter', () => {
  const privateAndPublic = [
    {id:'a',title:'Secret launch roadmap',group:'产品',body:'Embargoed initiative'},
    {id:'b',title:'React rendering basics',group:'技术',body:'Hooks and components'},
  ];
  const tech = make(scopeSearchDocuments(privateAndPublic,'技术'));
  const all = make(scopeSearchDocuments(privateAndPublic,'全部'));
  assert.equal(tech.search('Secret',{fuzzy:false}).length,0);
  assert.equal(tech.autoSuggest('Secret',{fuzzy:false}).length,0);
  assert.ok(all.search('Secret',{fuzzy:false}).some(hit=>hit.id==='a'));
  assert.ok(all.autoSuggest('Secret',{fuzzy:false}).some(hit=>hit.suggestion.includes('Secret')));
});
