import test from 'node:test';
import assert from 'node:assert/strict';
import {QueryClient} from '@tanstack/react-query';
import {optimisticRow, rollbackRow} from '../examples/optimistic-policy.mjs';
test('actual QueryClient: tenant identity prevents cache aliasing',()=>{
 const client=new QueryClient();
 client.setQueryData(['library-lab','team-a','feeds'],[{id:'a1'}]);
 client.setQueryData(['library-lab','team-b','feeds'],[{id:'b1'}]);
 assert.deepEqual(client.getQueryData(['library-lab','team-a','feeds']),[{id:'a1'}]);
 assert.deepEqual(client.getQueryData(['library-lab','team-b','feeds']),[{id:'b1'}]);
 client.clear();
});
test('actual QueryClient: cancelQueries aborts signal forwarded to queryFn',async()=>{
 const client=new QueryClient({defaultOptions:{queries:{retry:false}}});
 let signalWasAborted=false;
 const task=client.fetchQuery({
  queryKey:['library-lab','slow'],
  queryFn:({signal})=>new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>resolve('late'),300);
   const stop=()=>{clearTimeout(timer);signalWasAborted=true;reject(new DOMException('cancelled','AbortError'));};
   signal.addEventListener('abort',stop,{once:true});
  }),
 });
 const settled=task.then(()=> 'resolved',()=>'rejected');
 await client.cancelQueries({queryKey:['library-lab','slow']});
 assert.equal(signalWasAborted,true);
 assert.equal(await settled,'rejected');
 client.clear();
});

test('actual QueryClient uses a scoped cache patch and targeted 409 rollback',()=>{
 const client=new QueryClient();
 const keyA=['library-lab','query-demo','team-a','feeds','','0'];
 const keyB=['library-lab','query-demo','team-b','feeds','','0'];
 const origin={page:0,total:2,items:[{id:'a1',title:'A',enabled:false,rev:1},{id:'a2',title:'Other',enabled:true,rev:1}]};
 client.setQueryData(keyA,origin);
 client.setQueryData(keyB,{page:0,total:1,items:[{id:'b1',title:'B',enabled:false,rev:1}]});
 client.setQueriesData({queryKey:['library-lab','query-demo','team-a','feeds']},old=>
   optimisticRow(old,{id:'a1',enabled:true,expectedRev:1,token:9}));
 const changed=client.getQueryData(keyA);
 assert.equal(changed.items[0].enabled,true);
 assert.equal(changed.items[1].enabled,true);
 client.setQueryData(keyA,old=>rollbackRow(old,{id:'a1',token:9,previous:origin.items[0]}));
 assert.deepEqual(client.getQueryData(keyA),origin);
 assert.equal(client.getQueryData(keyB).items[0].id,'b1');
 client.clear();
});
