import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeQuery,resolveScope,visibleDocuments} from '../examples/search-scope.mjs';
const rows=[{id:'a',group:'技术'},{id:'b',group:'商业'}];

test('basic mode ignores stale, invisible business group and advanced threshold',()=>{
  assert.deepEqual(resolveScope({level:'basic',group:'商业',threshold:0.55}),
    {group:'全部',threshold:0.35});
  assert.deepEqual(visibleDocuments(rows,'全部').map(row=>row.id),['a','b']);
});
test('business mode resets hidden advanced threshold but preserves its visible group',()=>{
  assert.deepEqual(resolveScope({level:'business',group:'技术',threshold:0.55}),
    {group:'技术',threshold:0.35});
  assert.deepEqual(visibleDocuments(rows,'技术').map(row=>row.id),['a']);
});
test('advanced mode honors supported thresholds and rejects unknown groups',()=>{
  assert.deepEqual(resolveScope({level:'advanced',group:'开源',threshold:0.15}),
    {group:'开源',threshold:0.15});
  assert.deepEqual(resolveScope({level:'advanced',group:'unknown',threshold:1}),
    {group:'全部',threshold:0.35});
  assert.throws(()=>resolveScope({level:'other',group:'全部',threshold:0.35}),TypeError);
});
test('unicode queries are normalized and bounded without control characters',()=>{
  assert.equal(normalizeQuery('  Re\u0000act\n  '),'React');
  assert.equal(Array.from(normalizeQuery('😀'.repeat(100))).length,80);
  assert.equal(normalizeQuery(undefined),'');
});
