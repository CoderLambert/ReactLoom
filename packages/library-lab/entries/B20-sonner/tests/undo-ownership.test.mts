import test from 'node:test';
import assert from 'node:assert/strict';
import {LatestRunGuard} from '../examples/latest-run.ts';
test('old save toast cannot undo a newer save', () => {
  const owner = new LatestRunGuard();
  const oldSave = owner.start(), newestSave = owner.start();
  assert.equal(owner.isCurrent(oldSave), false);
  assert.equal(owner.isCurrent(newestSave), true);
});
test('one undo consumes its ownership and cannot fire twice', () => {
  const owner = new LatestRunGuard();
  const save = owner.start();
  assert.equal(owner.isCurrent(save), true);
  owner.invalidate();
  assert.equal(owner.isCurrent(save), false);
});
test('switching demo level invalidates past undo and active task tokens', () => {
  const save = new LatestRunGuard(), task = new LatestRunGuard();
  const undoToken = save.start(), taskToken = task.start();
  save.invalidate(); task.invalidate();
  assert.equal(save.isCurrent(undoToken), false);
  assert.equal(task.isCurrent(taskToken), false);
});
