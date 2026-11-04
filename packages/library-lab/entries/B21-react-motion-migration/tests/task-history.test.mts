import test from 'node:test';
import assert from 'node:assert/strict';
import {initialTaskState, reduceTasks, MAX_TASKS} from '../examples/task-history.ts';
test('rapid adds use monotonic IDs and one-step undo is atomic', () => {
  let s = initialTaskState();
  s = reduceTasks(reduceTasks(s, {type: 'add'}), {type: 'add'});
  assert.deepEqual(s.items.slice(-2).map(x => x.id), ['local-1', 'local-2']);
  s = reduceTasks(s, {type: 'undo'});
  assert.deepEqual(s.items.slice(-1).map(x => x.id), ['local-1']);
  s = reduceTasks(s, {type: 'add'});
  assert.equal(s.items.at(-1)?.id, 'local-3');
});
test('selection and undo restore a deleted selected item', () => {
  let s = reduceTasks(initialTaskState(), {type: 'select', id: 'model'});
  s = reduceTasks(s, {type: 'remove', id: 'model'});
  assert.equal(s.selected, null);
  s = reduceTasks(s, {type: 'undo'});
  assert.equal(s.selected, 'model');
  assert.ok(s.items.some(x => x.id === 'model'));
});
test('unknown IDs are inert and do not overwrite undo', () => {
  let s = reduceTasks(initialTaskState(), {type: 'add'});
  assert.strictEqual(reduceTasks(s, {type: 'remove', id: 'absent'}), s);
  assert.strictEqual(reduceTasks(s, {type: 'select', id: 'absent'}), s);
});
test('capacity is bounded and reset does not reuse IDs after undo', () => {
  let s = initialTaskState();
  for (let i = 0; i < MAX_TASKS + 3; i++) s = reduceTasks(s, {type: 'add'});
  assert.equal(s.items.length, MAX_TASKS);
  const saturated = s;
  assert.strictEqual(reduceTasks(s, {type: 'add'}), saturated);
  s = reduceTasks(s, {type: 'undo'});
  s = reduceTasks(s, {type: 'add'});
  assert.equal(s.items.at(-1)?.id, 'local-22');
});
