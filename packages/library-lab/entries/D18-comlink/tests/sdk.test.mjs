import test from 'node:test';
import assert from 'node:assert/strict';
import {MessageChannel} from 'node:worker_threads';
import * as Comlink from 'comlink';
import nodeEndpoint from 'comlink/dist/esm/node-adapter.mjs';
test('real Comlink proxies calls over actual MessagePorts',async()=>{
 const {port1,port2}=new MessageChannel();
 const endpoint1=nodeEndpoint(port1);
 const endpoint2=nodeEndpoint(port2);
 Comlink.expose({sum(a,b){return a+b;}},endpoint1);
 const remote=Comlink.wrap(endpoint2);
 try{
  assert.equal(await remote.sum(4,9),13);
 }finally{
  await remote[Comlink.releaseProxy]();
  port1.close();port2.close();
 }
});
test('transfer helper registers real transferable for RPC',()=>{
 const array=new Uint8Array([1,2,3]);
 assert.equal(Comlink.transfer(array,[array.buffer]),array);
 assert.equal(typeof Comlink.releaseProxy,'symbol');
});
