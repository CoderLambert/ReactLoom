import test from 'node:test';
import assert from 'node:assert/strict';
import {cloneWorkflowPreset} from '../examples/workflow-preset.ts';
const original=[
  {id:'source',position:{x:1,y:2},data:{label:'source'}},
  {id:'normalize',position:{x:3,y:4},data:{label:'normalize'}},
  {id:'publish',position:{x:5,y:6},data:{label:'publish'}},
];
const edges=[{id:'a',source:'source',target:'normalize'},{id:'b',source:'normalize',target:'publish'}];
test('basic contains only two nodes and their internal edges',()=>{
 const graph=cloneWorkflowPreset(original,edges,'basic');
 assert.deepEqual(graph.nodes.map(n=>n.id),['source','normalize']);
 assert.deepEqual(graph.edges.map(e=>e.id),['a']);
});
test('business after basic restores the entire graph',()=>{
 const graph=cloneWorkflowPreset(original,edges,'business');
 assert.equal(graph.nodes.length,3);
 assert.equal(graph.edges.length,2);
});
test('a moved node never alters the reset baseline',()=>{
 const moved=cloneWorkflowPreset(original,edges,'advanced');
 moved.nodes[0].position.x=99;
 moved.nodes[0].data.label='modified';
 moved.edges[0].id='changed';
 const reset=cloneWorkflowPreset(original,edges,'advanced');
 assert.equal(reset.nodes[0].position.x,1);
 assert.equal(reset.nodes[0].data.label,'source');
 assert.equal(reset.edges[0].id,'a');
});
