import test from 'node:test';
import assert from 'node:assert/strict';
import {createPdfWorkerPayload} from './worker-payload.mjs';

test('worker payload owns a fresh transfer-safe copy of PDF state', () => {
  const original = new Uint8Array([37, 80, 68, 70, 1]);
  const payload = createPdfWorkerPayload(original);
  assert.notEqual(payload.data.buffer, original.buffer);
  assert.deepEqual(payload.data, original);
  structuredClone(payload.data.buffer, {transfer: [payload.data.buffer]});
  assert.equal(payload.data.byteLength, 0);
  assert.deepEqual(Array.from(original), [37, 80, 68, 70, 1]);
  assert.deepEqual(createPdfWorkerPayload(original).data, original);
});

test('rejects empty, non-binary and oversized PDF inputs', () => {
  assert.throws(() => createPdfWorkerPayload(new Uint8Array()), /non-empty/);
  assert.throws(() => createPdfWorkerPayload(new ArrayBuffer(3)), /Uint8Array/);
  assert.throws(() => createPdfWorkerPayload(new Uint8Array(3 * 1024 * 1024 + 1)), /3MiB/);
});
