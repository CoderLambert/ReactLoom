import test from 'node:test';
import assert from 'node:assert/strict';
import {validateConnection, pruneEdgesForRemovedNodes} from '../examples/graph-rules.ts';
const nodes = ['source', 'clean', 'index', 'publish'].map(id => ({id}));
const edges = [
  {source:'source',target:'clean'}, {source:'clean',target:'index'},
  {source:'index',target:'publish'},
];

test('rejects missing or unknown endpoints', () => {
  assert.equal(validateConnection(nodes, edges, null, 'clean').reason, 'missing-endpoint');
  assert.equal(validateConnection(nodes, edges, 'clean', '').reason, 'missing-endpoint');
  assert.equal(validateConnection(nodes, edges, 'ghost', 'source').reason, 'unknown-node');
  assert.equal(validateConnection(nodes, edges, 'source', 'ghost').reason, 'unknown-node');
});
test('rejects direct self loops and exact directed duplicates', () => {
  assert.equal(validateConnection(nodes, edges, 'clean', 'clean').reason, 'self-loop');
  assert.equal(validateConnection(nodes, edges, 'source', 'clean').reason, 'duplicate');
});
test('allows valid forward edges and parallel reverse-independent branches', () => {
  assert.deepEqual(validateConnection(nodes, edges, 'source', 'index'), {valid:true,reason:'ok'});
  assert.equal(validateConnection(nodes, edges, 'clean', 'publish').valid, true);
});
test('rejects direct and indirect cycles', () => {
  assert.equal(validateConnection(nodes, edges, 'clean', 'source').reason, 'cycle');
  assert.equal(validateConnection(nodes, edges, 'publish', 'source').reason, 'cycle');
  assert.equal(validateConnection(nodes, edges, 'publish', 'clean').reason, 'cycle');
});
test('deep chains do not overflow stack and existing cycles do not hang', () => {
  const chain = Array.from({length:4000},(_,i)=>({id:String(i)}));
  const links = chain.slice(1).map((n,i)=>({source:String(i),target:n.id}));
  assert.equal(validateConnection(chain, links, '3999','0').reason,'cycle');
  assert.equal(validateConnection(chain, [...links, {source:'3999',target:'0'}], '10','3500').reason,'cycle');
});
test('removal drops all incident edges, never unrelated ones', () => {
  assert.deepEqual(pruneEdgesForRemovedNodes(edges,new Set(['clean'])), [{source:'index',target:'publish'}]);
  assert.deepEqual(pruneEdgesForRemovedNodes(edges,new Set()),edges);
  assert.deepEqual(pruneEdgesForRemovedNodes(edges,new Set(['clean','publish'])),[]);
});
test('removal keeps edge metadata and source order', () => {
  const richer=[{id:'a',source:'a',target:'b',animated:true},{id:'b',source:'c',target:'d',animated:false}];
  assert.deepEqual(pruneEdgesForRemovedNodes(richer,new Set(['a'])),[richer[1]]);
});
