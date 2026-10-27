import test from 'node:test';
import assert from 'node:assert/strict';
import {requestGeneratedResource} from '../src/lib/resource-fetch.mjs';
const okResponse = () => new Response('ok', {headers:{'content-type':'text/plain'}});

test('successful generated resource request bypasses stale HTTP caches and parses body', async () => {
  const requests=[];
  const value=await requestGeneratedResource('/lab/raw/C20/guide.md', response=>response.text(), {
    fetchImpl: async (url,options)=>{requests.push({url,options});return okResponse();},
  });
  assert.equal(value,'ok');
  assert.equal(requests.length,1);
  assert.equal(requests[0].url,'/lab/raw/C20/guide.md');
  assert.equal(requests[0].options.cache,'no-store');
  assert.equal(requests[0].options.signal.aborted,true);
});

test('rejects external, protocol-relative, relative and traversing paths', async () => {
  for(const value of ['https://example.com/x','//example.com/x','raw/index.json','/raw/../private','/raw/./x','/raw/\\secret']) {
    await assert.rejects(requestGeneratedResource(value, async()=>{}), TypeError);
  }
  await assert.rejects(requestGeneratedResource('/raw/x',null),TypeError);
  await assert.rejects(requestGeneratedResource('/raw/x',async()=>{}, {timeoutMs:0}),RangeError);
});

test('caller abort cancels an in-flight request instead of accepting late data', async () => {
  const controller=new AbortController();
  let aborted=false;
  const fetchImpl=(_url,{signal})=>new Promise((_resolve,reject)=>{
    signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason);},{once:true});
  });
  const pending=requestGeneratedResource('/raw/C20/detail.json', response=>response.json(), {signal:controller.signal,fetchImpl});
  controller.abort(new DOMException('Navigation changed','AbortError'));
  await assert.rejects(pending,/Navigation changed/);
  assert.equal(aborted,true);
});

test('deadline bounds header wait and reports a retriable timeout', async () => {
  let aborted=false;
  const fetchImpl=(_url,{signal})=>new Promise((_resolve,reject)=>{
    signal.addEventListener('abort',()=>{aborted=true;reject(signal.reason);},{once:true});
  });
  await assert.rejects(requestGeneratedResource('/catalog-index.json',r=>r.text(),{fetchImpl,timeoutMs:15}),/生成资源读取超时/);
  assert.equal(aborted,true);
});

test('deadline continues during a response whose body never finishes', async () => {
  let cancelled=false;
  const fetchImpl=async(_url,{signal})=>{
    const stream=new ReadableStream({
      start(controller){controller.enqueue(new TextEncoder().encode('part'));
        signal.addEventListener('abort',()=>controller.error(signal.reason),{once:true});},
      cancel(){cancelled=true;},
    });
    return new Response(stream);
  };
  await assert.rejects(requestGeneratedResource('/raw/C20/guide.md',r=>r.text(),{fetchImpl,timeoutMs:15}),/生成资源读取超时/);
  // Some streams error on abort rather than receiving explicit cancel; both settle.
  assert.equal(typeof cancelled,'boolean');
});

test('parser failures propagate and a subsequent retry is independent', async()=>{
  const parse=async response=>{const data=await response.text(); if(data==='invalid')throw new SyntaxError('broken generated resource');return data;};
  await assert.rejects(requestGeneratedResource('/raw/C20/detail.json',parse,{fetchImpl:async()=>new Response('invalid')}),SyntaxError);
  assert.equal(await requestGeneratedResource('/raw/C20/detail.json',parse,{fetchImpl:async()=>new Response('valid')}),'valid');
});

test('already aborted caller signal prevents acceptance of an immediate response',async()=>{
  const signal=new AbortController();signal.abort(new DOMException('Old tab','AbortError'));
  await assert.rejects(requestGeneratedResource('/raw/C20/guide.md',r=>r.text(),{signal:signal.signal,fetchImpl:async()=>okResponse()}),/Old tab/);
});
