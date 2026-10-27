import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {inspectScopedMswWorker,verifyScopedMswWorker,MAX_SCOPED_MSW_WORKER_BYTES} from '../scripts/verify-msw-worker.mjs';
const fakeScript=new TextEncoder().encode('/* fixture, NOT an SDK worker */\nself.addEventListener("install", () => {});\n');
test('checks staged scoped JS bytes and marks the result asset-only',()=>{
 const result=inspectScopedMswWorker(fakeScript);
 assert.equal(result.path,'/lab-runners/msw/sessions/<session>/mockServiceWorker.js');
 assert.equal(result.bytes,fakeScript.byteLength);assert.match(result.sha256,/^[0-9a-f]{64}$/u);assert.equal(result.assurance,'generated-asset-only');
});
test('rejects HTML fallback, malformed UTF-8, non-worker JS and oversize responses',()=>{
 for(const bytes of [new Uint8Array(),new TextEncoder().encode('<!doctype html>'),new TextEncoder().encode('console.log("not a service worker")'),new Uint8Array([0xff]),new Uint8Array(MAX_SCOPED_MSW_WORKER_BYTES+1)])assert.throws(()=>inspectScopedMswWorker(bytes));
});
test('reads only a regular scoped worker and rejects symlink staging',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'reactloom-msw-')),folder=path.join(root,'runners/msw/public');await mkdir(folder,{recursive:true});const filename=path.join(folder,'mockServiceWorker.js');
 try{await writeFile(filename,fakeScript);assert.equal((await verifyScopedMswWorker(root)).bytes,fakeScript.byteLength);await rm(filename);await symlink(path.join(root,'outside.js'),filename);await assert.rejects(verifyScopedMswWorker(root),/regular file/);}
 finally{await rm(root,{recursive:true,force:true});}
});
