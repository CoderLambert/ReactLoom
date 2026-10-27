import test from 'node:test';
import assert from 'node:assert/strict';
import {createOwnedResourceCleanup} from './resource-cleanup.mjs';

test('releases every resource in order even when earlier disposers throw', () => {
  const visited = [];
  const slots = {};
  for (const [key, method] of [['observer','disconnect'], ['markerListener','dispose'], ['contentListener','dispose'], ['editor','dispose'], ['model','dispose']]) {
    slots[key] = {[method]() { visited.push(key); if (key === 'markerListener' || key === 'editor') throw Error(key + ' failed'); }};
  }
  slots.releaseWorkers = () => visited.push('releaseWorkers');
  let reported;
  const cleanup = createOwnedResourceCleanup(slots, (failures) => { reported = failures; });
  assert.deepEqual(cleanup().map(failure => failure.step), ['marker-listener','editor']);
  assert.deepEqual(visited, ['observer','markerListener','contentListener','editor','model','releaseWorkers']);
  assert.equal(reported.length, 2);
  assert.deepEqual(cleanup(), []);
  assert.equal(visited.length, 6);
});

test('handles partially constructed editor and ignores a throwing reporter', () => {
  let leases = 0;
  const slots = {model:{dispose(){throw Error('model-fail')}},releaseWorkers(){leases++}};
  const cleanup = createOwnedResourceCleanup(slots, () => {throw Error('reporter-fail')});
  assert.deepEqual(cleanup().map(e => e.step), ['model']);
  assert.equal(leases, 1);
  assert.deepEqual(cleanup(), []);
});

test('rejects invalid slots and reports a malformed disposer while still releasing lease', () => {
  assert.throws(() => createOwnedResourceCleanup(null), /resources/);
  let released = false;
  const cleanup = createOwnedResourceCleanup({editor:{}, releaseWorkers(){released = true}});
  assert.equal(cleanup()[0].step, 'editor');
  assert.equal(released, true);
});
