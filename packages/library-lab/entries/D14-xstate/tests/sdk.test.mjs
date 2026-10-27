import test from 'node:test';
import assert from 'node:assert/strict';
import {setup,createActor,assign} from 'xstate';
import {isValidRejection} from '../examples/review-policy.mjs';

const machine=setup({
 types:{context:/** @type {{retries:number;reason:string}} */({}),events:/** @type {{type:string;reason?:string}} */({})},
 guards:{underBudget:({context})=>context.retries<2,reasonAllowed:({event})=>isValidRejection(event)},
 actions:{increase:assign({retries:({context})=>context.retries+1})},
}).createMachine({id:'review',initial:'draft',context:{retries:0,reason:''},
 states:{draft:{on:{SUBMIT:'reviewing'}},reviewing:{on:{APPROVE:'published',REJECT:{target:'rejected',guard:'reasonAllowed'}}},
 rejected:{on:{RETRY:{target:'reviewing',guard:'underBudget',actions:'increase'}}},published:{}}});
test('real XState actor ignores event absent from active state',()=>{
 const actor=createActor(machine);actor.start();actor.send({type:'APPROVE'});assert.equal(actor.getSnapshot().value,'draft');
 actor.send({type:'SUBMIT'});assert.equal(actor.getSnapshot().value,'reviewing');actor.stop();
});
test('real XState guarded retries are bounded and actor stops',()=>{
 const actor=createActor(machine);actor.start();actor.send({type:'SUBMIT'});
 for(let attempt=0;attempt<2;attempt++){actor.send({type:'REJECT',reason:'not ready'});actor.send({type:'RETRY'});}
 assert.equal(actor.getSnapshot().value,'reviewing');assert.equal(actor.getSnapshot().context.retries,2);
 actor.send({type:'REJECT',reason:'not ready'});actor.send({type:'RETRY'});
 assert.equal(actor.getSnapshot().value,'rejected');assert.equal(actor.getSnapshot().context.retries,2);
 actor.stop();
});

test('real XState guard rejects blank and oversize programmatic REJECT',()=>{
 const actor=createActor(machine);actor.start();actor.send({type:'SUBMIT'});
 actor.send({type:'REJECT',reason:'  '});assert.equal(actor.getSnapshot().value,'reviewing');
 actor.send({type:'REJECT',reason:'x'.repeat(201)});assert.equal(actor.getSnapshot().value,'reviewing');
 actor.send({type:'REJECT',reason:'源站不完整'});assert.equal(actor.getSnapshot().value,'rejected');
 actor.stop();
});
