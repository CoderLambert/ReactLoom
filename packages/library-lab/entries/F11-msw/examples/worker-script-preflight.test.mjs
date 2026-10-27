import test from 'node:test';
import assert from 'node:assert/strict';
import {assertScopedWorkerScriptUrl, preflightScopedWorkerScript, MAX_WORKER_SCRIPT_BYTES} from './worker-script-preflight.mjs';
const scope = 'https://lab.example/lab-runners/msw/';
const script = scope + 'mockServiceWorker.js';
function fakeResponse(source = '/* actual script must still be verified by browser MSW */', extra = {}) {
  const encoded = new TextEncoder().encode(source);
  return {
    status: 200, redirected: false, url: script,
    headers: new Headers({'content-type':'application/javascript', ...extra.headers}),
    body: new ReadableStream({start(controller){controller.enqueue(encoded);controller.close()}}),
    ...Object.fromEntries(Object.entries(extra).filter(([key])=>key!=='headers')),
  };
}
test('preflights only the exact same-origin scoped Worker asset', async () => {
  const calls = [];
  const result = await preflightScopedWorkerScript(scope,script,(url,options)=>{calls.push({url,options});return fakeResponse()});
  assert.equal(result.url,script);
  assert.equal(result.mime,'application/javascript');
  assert.equal(calls[0].options.redirect,'error');
  assert.equal(calls[0].options.cache,'no-store');
  assert.equal(calls[0].options.mode,'same-origin');
});
test('rejects root workers, other origins, query strings and remote files', () => {
  for (const [a,b] of [[scope,'https://evil.example/mockServiceWorker.js'],
    [scope,'https://lab.example/mockServiceWorker.js'],
    [scope,script+'?cache=1'],
    ['https://lab.example/','https://lab.example/mockServiceWorker.js']]) {
    assert.throws(()=>assertScopedWorkerScriptUrl(a,b), /scoped asset/);
  }
});
test('rejects redirects, missing scripts and SPA fallbacks before registration', async () => {
  for (const response of [fakeResponse('ok',{status:404}), fakeResponse('ok',{redirected:true}),
    fakeResponse('ok',{url:'https://lab.example/'}), fakeResponse('<!doctype html>',{headers:{'content-type':'text/html'}}),
    fakeResponse('<html>',{headers:{'content-type':'text/javascript'}})]) {
    await assert.rejects(preflightScopedWorkerScript(scope,script,()=>response), /script|HTML/);
  }
});
test('enforces actual streamed size even if Content-Length lies or is absent', async () => {
  await assert.rejects(preflightScopedWorkerScript(scope,script,()=>fakeResponse('a'.repeat(MAX_WORKER_SCRIPT_BYTES+1))), /bounded size/);
  await assert.rejects(preflightScopedWorkerScript(scope,script,()=>fakeResponse('x',{headers:{'content-length':String(MAX_WORKER_SCRIPT_BYTES+1)}})), /bounded size/);
});
test('rejects empty response bodies and unsupported body readers', async () => {
  await assert.rejects(preflightScopedWorkerScript(scope,script,()=>fakeResponse('')), /empty/);
  await assert.rejects(preflightScopedWorkerScript(scope,script,()=>fakeResponse('x',{body:null})), /streaming/);
});
