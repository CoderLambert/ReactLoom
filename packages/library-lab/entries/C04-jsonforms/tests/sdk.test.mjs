import test from 'node:test';
import assert from 'node:assert/strict';
import {JsonForms} from '@jsonforms/react';
import {vanillaRenderers,vanillaCells} from '@jsonforms/vanilla-renderers';
import Ajv from 'ajv';
test('real JSON Forms renderer and cell modules load',()=>{
 assert.equal(typeof JsonForms,'function');
 assert.ok(vanillaRenderers.length>1);assert.ok(vanillaCells.length>0);
});
test('real Ajv validates conditional rss URL and required name',()=>{
 const ajv=new Ajv({allErrors:true});
 const validate=ajv.compile({type:'object',properties:{name:{type:'string',minLength:2},kind:{enum:['rss','manual']},url:{type:'string'}},required:['name','kind'],if:{properties:{kind:{const:'rss'}},required:['kind']},then:{required:['url']}});
 assert.equal(validate({name:'a',kind:'rss'}),false);
 assert.equal(validate({name:'demo',kind:'manual'}),true);
 assert.equal(validate({name:'demo',kind:'rss',url:'https://example.org/rss'}),true);
});

import {subscriptionSchema,toSubscriptionPayload} from '../examples/submission-policy.mjs';
test('real Ajv validates the same conditional JSON Forms UI schema',()=>{
 const validate=new Ajv({allErrors:true}).compile(subscriptionSchema);
 assert.equal(validate({name:'Manual',feedType:'manual',url:'',enabled:true}),true);
 assert.equal(validate({name:'RSS',feedType:'rss',url:'http://invalid.test/rss',enabled:true}),false);
 assert.equal(validate({name:'RSS',feedType:'rss',url:'https://example.org/rss',enabled:true}),true);
 assert.equal('url' in toSubscriptionPayload({name:'Manual',feedType:'manual',url:'https://example.org/rss',enabled:true}),false);
});
