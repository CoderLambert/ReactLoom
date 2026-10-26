import test from 'node:test';
import assert from 'node:assert/strict';
import {QueryClient} from '@tanstack/react-query';
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
