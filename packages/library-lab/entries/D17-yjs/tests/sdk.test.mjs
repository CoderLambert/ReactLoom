import assert from 'node:assert/strict'
import test from 'node:test'
import { createReplicaRuntime } from '../examples/runtime.ts'

test('actual runtime transacts two map changes in one update and merges offline independent keys', () => {
  const r = createReplicaRuntime()
  try {
    r.add('left')
    assert.equal(r.inspect().pending, 1)
    assert.deepEqual(r.inspect().right, {})
    r.add('right')
    assert.equal(r.inspect().pending, 2)
    const delta = r.sync()
    assert.ok(delta.bytesToRight > 0 && delta.bytesToLeft > 0)
    assert.deepEqual(r.inspect().left, r.inspect().right)
    assert.equal(Object.keys(r.inspect().left).length, 2)
    assert.equal(r.inspect().pending, 0)
  } finally {
    r.destroy()
  }
})
test('actual runtime reorders dependent source updates and replays without inventing a winner', () => {
  const r = createReplicaRuntime()
  try {
    r.add('left')
    r.add('left')
    r.add('right')
    r.conflict()
    const delta = r.sync(true)
    assert.equal(delta.replayedUpdates, 5)
    const first = r.inspect()
    assert.deepEqual(first.left, first.right)
    assert.equal(Object.keys(first.left).length, 3)
    assert.equal(first.leftTitle, first.rightTitle)
    assert.ok(['A 的标题', 'B 的标题'].includes(first.leftTitle))
    r.sync(true)
    const replayed = r.inspect()
    assert.deepEqual(replayed.left, first.left)
    assert.equal(replayed.leftTitle, first.leftTitle)
  } finally {
    r.destroy()
  }
})
test('actual runtime rejects wrong scope before applying and destroys both owned Docs once', () => {
  const r = createReplicaRuntime()
  let destroyed = 0
  r.left.on('destroy', () => destroyed++)
  r.right.on('destroy', () => destroyed++)
  try {
    r.add('left')
    const before = r.inspect()
    assert.throws(() => r.rejectWrongScope(), /mismatch/)
    assert.deepEqual(r.inspect(), before)
  } finally {
    r.destroy()
    r.destroy()
  }
  assert.equal(destroyed, 2)
  assert.throws(() => r.add('left'), /destroyed/)
  assert.throws(() => r.sync(), /destroyed/)
})
