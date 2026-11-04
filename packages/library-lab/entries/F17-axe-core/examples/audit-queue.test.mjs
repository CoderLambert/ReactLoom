import test from 'node:test';
import assert from 'node:assert/strict';
import { enqueueAxeAudit } from './audit-queue.mjs';

test('two concurrent owners never execute their scans concurrently', async () => {
  const events = [];
  let releaseFirst;
  const barrier = new Promise(resolve => { releaseFirst = resolve; });
  const first = enqueueAxeAudit(async () => {
    events.push('start-a');
    await barrier;
    events.push('end-a');
    return 'first';
  }, () => true);
  const second = enqueueAxeAudit(async () => {
    events.push('start-b');
    return 'second';
  }, () => true);
  await Promise.resolve();
  assert.deepEqual(events, ['start-a']);
  releaseFirst();
  assert.deepEqual(await Promise.all([first, second]), [
    { skipped: false, result: 'first' },
    { skipped: false, result: 'second' },
  ]);
  assert.deepEqual(events, ['start-a', 'end-a', 'start-b']);
});

test('unmounted or changed scenario skips a pending scan before running axe', async () => {
  let releaseFirst;
  const barrier = new Promise(resolve => { releaseFirst = resolve; });
  const first = enqueueAxeAudit(() => barrier, () => true);
  let valid = true;
  let calls = 0;
  const second = enqueueAxeAudit(() => { calls++; return 2; }, () => valid);
  await Promise.resolve();
  valid = false;
  releaseFirst(1);
  assert.deepEqual(await first, { skipped: false, result: 1 });
  assert.deepEqual(await second, { skipped: true });
  assert.equal(calls, 0);
});

test('a rejected axe scan does not block future requests', async () => {
  const first = enqueueAxeAudit(() => Promise.reject(new Error('engine failed')), () => true);
  const second = enqueueAxeAudit(() => 'recovered', () => true);
  await assert.rejects(first, /engine failed/);
  assert.deepEqual(await second, { skipped: false, result: 'recovered' });
});

test('synchronous thrown errors also release the queue', async () => {
  const first = enqueueAxeAudit(() => { throw new Error('sync failure'); }, () => true);
  const second = enqueueAxeAudit(() => 4, () => true);
  await assert.rejects(first, /sync failure/);
  assert.deepEqual(await second, { skipped: false, result: 4 });
});
