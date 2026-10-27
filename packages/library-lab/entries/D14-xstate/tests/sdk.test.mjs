import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,createActor,assign} from 'xstate';

const machine=setup({
 types:{context:/** @type {{retries:number;reason:string}} */({}),events:/** @type {{type:string;reason?:string}} */({})},
 guards:{underBudget:({context})=>context.retries<2},
 actions:{increase:assign({retries:({context})=>context.retries+1})},
}).createMachine({id:'review',initial:'draft',context:{retries:0,reason:''},
 states:{draft:{on:{SUBMIT:'reviewing'}},reviewing:{on:{APPROVE:'published',REJECT:'rejected'}},
 rejected:{on:{RETRY:{target:'reviewing',guard:'underBudget',actions:'increase'}}},published:{}}});
test('real XState actor ignores event absent from active state',()=>{
 const actor=createActor(machine);actor.start();actor.send({type:'APPROVE'});assert.equal(actor.getSnapshot().value,'draft');
 actor.send({type:'SUBMIT'});assert.equal(actor.getSnapshot().value,'reviewing');actor.stop();
});
test('real XState guarded retries are bounded and actor stops',()=>{
 const actor=createActor(machine);actor.start();actor.send({type:'SUBMIT'});
 for(let attempt=0;attempt<2;attempt++){actor.send({type:'REJECT'});actor.send({type:'RETRY'});}
 assert.equal(actor.getSnapshot().value,'reviewing');assert.equal(actor.getSnapshot().context.retries,2);
 actor.send({type:'REJECT'});actor.send({type:'RETRY'});
 assert.equal(actor.getSnapshot().value,'rejected');assert.equal(actor.getSnapshot().context.retries,2);
 actor.stop();
});
