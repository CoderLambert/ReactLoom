import test from 'node:test';
import assert from 'node:assert/strict';
import PQueue from 'p-queue';

test('real p-queue enforces concurrency, tracks pending and settles failures', async()=>{
  const queue=new PQueue({concurrency:2});
  let running=0,peak=0;
  const tasks=Array.from({length:7},(_,index)=>queue.add(async()=>{
    running++;peak=Math.max(peak,running);
    try{await new Promise(resolve=>setTimeout(resolve,15)); if(index===4)throw new Error('fixture');return index;}
    finally{running--;}
  }));
  const result=await Promise.allSettled(tasks);
  assert.equal(peak,2);
  assert.deepEqual(result.map(r=>r.status),['fulfilled','fulfilled','fulfilled','fulfilled','rejected','fulfilled','fulfilled']);
  assert.equal(queue.size,0);
  assert.equal(queue.pending,0);
  await queue.onIdle();
});

test('queued add promises settle when cancelled before starting', async()=>{
  const queue=new PQueue({concurrency:1,autoStart:false});
  const controller=new AbortController();
  const promises=[queue.add(async()=>1,{signal:controller.signal}),queue.add(async()=>2,{signal:controller.signal})];
  controller.abort(new DOMException('stop','AbortError'));
  queue.clear();
  const result=await Promise.allSettled(promises);
  assert.deepEqual(result.map(r=>r.status),['rejected','rejected']);
  assert.equal(queue.size,0);
});
