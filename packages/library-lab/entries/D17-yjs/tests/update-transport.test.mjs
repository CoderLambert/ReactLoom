import test from 'node:test';
import assert from 'node:assert/strict';
import {MAX_DEMO_UPDATE_BYTES,validateYjsEnvelope} from '../examples/update-transport.mjs';
const scope={tenantId:'tenant-demo',documentId:'rss-playground'};
const valid={...scope,format:'yjs-v1',update:new Uint8Array([0,1,2])};
test('accept small V1 update in matching document',()=>assert.equal(validateYjsEnvelope(valid,scope),valid.update));
test('reject other tenant, document, and incompatible version',()=>{
 for(const change of [{tenantId:'tenant-B'},{documentId:'other'},{format:'yjs-v2'}])
  assert.throws(()=>validateYjsEnvelope({...valid,...change},scope),/mismatch/);
});
test('reject zero, non-binary and oversized update',()=>{
 for(const bytes of [new Uint8Array(),new Uint8Array(MAX_DEMO_UPDATE_BYTES+1),'not bytes'])
  assert.throws(()=>validateYjsEnvelope({...valid,update:bytes},scope),/byte limit/);
});
