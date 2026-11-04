import test from 'node:test';
import assert from 'node:assert/strict';
import pLimit from 'p-limit';

test('actual p-limit keeps concurrency bounded and returns ordered values', async () => {
  const limit = pLimit(2);
  let active = 0;
  let peak = 0;
  const values = await Promise.all(Array.from({length: 8}, (_, i) => limit(async () => {
    active++;
    peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, 4));
    active--;
    return i;
  })));
  assert.equal(peak, 2);
  assert.deepEqual(values, [0, 1, 2, 3, 4, 5, 6, 7]);
  assert.equal(limit.activeCount, 0);
  assert.equal(limit.pendingCount, 0);
});

test('rejectOnClear settles every queued promise with AbortError', {timeout: 5000}, async () => {
  const limit = pLimit({concurrency: 1, rejectOnClear: true});
  let finishFirst;
  let unexpectedlyStarted = 0;
  const running = limit(() => new Promise(resolve => {
    finishFirst = () => resolve('finished');
  }));
  const queued = Array.from({length: 3}, () => limit(() => {
    unexpectedlyStarted++;
    return 'unexpected';
  }));
  // Attach handlers before clearing so intentional rejections are not unhandled.
  const settling = Promise.allSettled(queued);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(limit.activeCount, 1);
  assert.equal(limit.pendingCount, 3);
  limit.clearQueue();
  const results = await settling;
  assert.equal(unexpectedlyStarted, 0);
  for (const item of results) {
    assert.equal(item.status, 'rejected');
    assert.equal(item.reason.name, 'AbortError');
  }
  finishFirst();
  assert.equal(await running, 'finished');
  assert.equal(limit.pendingCount, 0);
});

test('clearing queue does not abort running work without its own signal', {timeout: 5000}, async () => {
  const limit = pLimit({concurrency: 1, rejectOnClear: true});
  const controller = new AbortController();
  const running = limit(() => new Promise((_resolve, reject) => {
    controller.signal.addEventListener('abort', () => reject(controller.signal.reason), {once: true});
  }));
  const runningOutcome = Promise.allSettled([running]);
  const queuedOutcome = Promise.allSettled([limit(() => 'must not start')]);
  await new Promise(resolve => setImmediate(resolve));
  controller.abort(new DOMException('cancelled', 'AbortError'));
  limit.clearQueue();
  const [[first], [second]] = await Promise.all([runningOutcome, queuedOutcome]);
  assert.equal(first.status, 'rejected');
  assert.equal(first.reason.name, 'AbortError');
  assert.equal(second.status, 'rejected');
  assert.equal(second.reason.name, 'AbortError');
});
