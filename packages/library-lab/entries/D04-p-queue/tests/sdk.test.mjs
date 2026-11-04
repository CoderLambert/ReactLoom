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
  const result=await Promise.allSettled(promises);
  assert.deepEqual(result.map(r=>r.status),['rejected','rejected']);
  assert.equal(queue.size,0);
});

test('abort while paused cancels both running and queued jobs without clear()', async()=>{
  const queue=new PQueue({concurrency:1});
  const controller=new AbortController();
  let started=0;
  const jobs=Array.from({length:4},()=>queue.add(async ({signal})=>{
    started++;
    await new Promise((resolve,reject)=>{
      if(signal.aborted){reject(signal.reason);return;}
      const timer=setTimeout(resolve,500);
      signal.addEventListener('abort',()=>{clearTimeout(timer);reject(signal.reason);},{once:true});
    });
  },{signal:controller.signal}));
  await new Promise(resolve=>setTimeout(resolve,10));
  queue.pause();
  controller.abort(new DOMException('cancelled','AbortError'));
  const settled=await Promise.allSettled(jobs);
  assert.equal(started,1);
  assert.deepEqual(settled.map(result=>result.status),Array(4).fill('rejected'));
  assert.equal(queue.size,0);
  await queue.onIdle();
});

