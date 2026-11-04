import test from 'node:test';
import assert from 'node:assert/strict';
import {queueMermaidRender} from '../examples/render-queue.ts';

test('render jobs are serialized, never overlap', async () => {
  const events: string[] = [];
  let unblock!: () => void;
  const hold = new Promise<void>(resolve => { unblock = resolve; });
  const first = queueMermaidRender(() => true, async () => {
    events.push('first:start'); await hold; events.push('first:end'); return 'one';
  }, result => events.push(result), () => assert.fail('unexpected error'));
  const second = queueMermaidRender(() => true, async () => {
    events.push('second:start'); return 'two';
  }, result => events.push(result), () => assert.fail('unexpected error'));
  await Promise.resolve();
  assert.deepEqual(events, ['first:start']);
  unblock(); await Promise.all([first, second]);
  assert.deepEqual(events, ['first:start', 'first:end', 'one', 'second:start', 'two']);
});

test('invalidated jobs are skipped before parse; stale render result is ignored', async () => {
  let current = true; let finish!: (value: string) => void;
  const results: string[] = [];
  const one = queueMermaidRender(() => true, () => new Promise<string>(resolve => { finish = resolve; }), () => {}, () => {});
  await Promise.resolve();
  const two = queueMermaidRender(() => current, async () => { assert.fail('must skip stale parse'); }, () => assert.fail('stale commit'), () => assert.fail('stale error'));
  current = false;
  finish('ok'); await Promise.all([one, two]);
  const three = queueMermaidRender(() => true, async () => 'fresh', value => results.push(value), () => {});
  await three;
  assert.deepEqual(results, ['fresh']);
});

test('inflight render is not committed after unmount', async () => {
  let current = true; let finish!: (value: string) => void;
  let committed = false;
  const job = queueMermaidRender(() => current, () => new Promise<string>(resolve => { finish = resolve; }), () => { committed = true; }, () => {});
  await Promise.resolve(); current = false; finish('late'); await job;
  assert.equal(committed, false);
});

test('render failures only reach active owner; queue continues afterward', async () => {
  const errors: unknown[] = [];
  await queueMermaidRender(() => true, async () => { throw new Error('bad DSL'); }, () => {}, e => errors.push(e));
  let completed = false;
  await queueMermaidRender(() => true, async () => 7, v => { completed = v === 7; }, () => {});
  assert.match(String(errors[0]), /bad DSL/);
  assert.equal(completed, true);
});
