import test from 'node:test';
import assert from 'node:assert/strict';
import {transitionJob, cancelUnsettledJobs} from '../examples/job-policy.mjs';
test('queued -> running -> done is valid and keeps ID', () => {
  const initial = [{id:1,state:'queued'}, {id:2,state:'queued'}];
  const running = transitionJob(initial, 1, 'running');
  const done = transitionJob(running, 1, 'done');
  assert.deepEqual(done, [{id:1,state:'done'}, {id:2,state:'queued'}]);
  assert.deepEqual(initial, [{id:1,state:'queued'}, {id:2,state:'queued'}]);
});
test('late callbacks cannot resurrect cancelled or done work', () => {
  const initial = [{id:1,state:'running'}, {id:2,state:'queued'}, {id:3,state:'done'}];
  const stopped = cancelUnsettledJobs(initial);
  assert.deepEqual(stopped.map(job=>job.state), ['cancelled','cancelled','done']);
  assert.strictEqual(transitionJob(stopped, 1, 'done'), stopped);
  assert.strictEqual(transitionJob(stopped, 2, 'running'), stopped);
  assert.strictEqual(transitionJob(stopped, 3, 'error'), stopped);
});
test('no queued task can skip running and terminal cancellation is idempotent', () => {
  const list = [{id:1,state:'queued'}];
  assert.strictEqual(transitionJob(list,1,'done'), list);
  assert.strictEqual(transitionJob(list,99,'running'), list);
  const cancelled = cancelUnsettledJobs(list);
  assert.strictEqual(cancelUnsettledJobs(cancelled), cancelled);
});
test('invalid state/identity fail rather than silently corrupting the UI', () => {
  assert.throws(()=>transitionJob([], 1.2,'running'), TypeError);
  assert.throws(()=>transitionJob([], 1,'finished'), TypeError);
  assert.throws(()=>cancelUnsettledJobs(null), TypeError);
});
