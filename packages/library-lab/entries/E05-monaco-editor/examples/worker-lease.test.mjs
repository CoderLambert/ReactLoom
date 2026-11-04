import test from 'node:test';
import assert from 'node:assert/strict';
import {acquireWorkerEnvironment} from './worker-lease.mjs';
const factory = () => ({getWorker: () => ({})});
test('multiple editors share one mapping and last release clears only their mapping', () => {
  const host = {}; let calls = 0;
  const first = acquireWorkerEnvironment(host, () => {calls++;return factory()});
  const second = acquireWorkerEnvironment(host, () => {calls++;return factory()});
  assert.equal(calls, 1);
  const original = host.MonacoEnvironment;
  first(); first();
  assert.equal(host.MonacoEnvironment, original);
  second();
  assert.equal('MonacoEnvironment' in host, false);
});
test('does not silently steal another application worker configuration', () => {
  const existing = factory();
  assert.throws(() => acquireWorkerEnvironment({MonacoEnvironment: existing}, factory), /external/);
});
test('releases own lease without deleting an externally replaced mapping', () => {
  const host = {}; const dispose = acquireWorkerEnvironment(host, factory);
  const external = factory(); host.MonacoEnvironment = external;
  assert.throws(() => acquireWorkerEnvironment(host, factory), /replaced/);
  dispose(); assert.equal(host.MonacoEnvironment, external);
});
test('invalid environment factories fail without claiming the global', () => {
  const host = {};
  assert.throws(() => acquireWorkerEnvironment(host, () => ({})), /getWorker/);
  assert.equal('MonacoEnvironment' in host, false);
});
