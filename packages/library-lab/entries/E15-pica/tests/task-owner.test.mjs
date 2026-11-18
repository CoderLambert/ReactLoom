import assert from 'node:assert/strict'
import test from 'node:test'
import { assertPNGBlob, createTaskOwner } from '../examples/task-owner.mjs'

test('application owner single-flights and invalidation cancels once without accepting stale encoding', () => {
  const owner = createTaskOwner(),
    id = owner.begin()
  let cancels = 0
  owner.attachCancel(id, () => cancels++)
  assert.equal(owner.begin(), null)
  owner.invalidate()
  owner.invalidate()
  assert.equal(cancels, 1)
  assert.equal(owner.isCurrent(id), false)
  assert.equal(owner.isBusy(), true)
  owner.finish(id)
  assert.equal(owner.isBusy(), false)
})
test('resize settled means encoding cancellation only invalidates; old finally cannot release a new task', () => {
  const owner = createTaskOwner(),
    old = owner.begin()
  let cancels = 0
  owner.attachCancel(old, () => cancels++)
  owner.clearCancel(old)
  owner.invalidate()
  assert.equal(cancels, 0)
  assert.equal(owner.isCurrent(old), false)
  owner.finish(old)
  const next = owner.begin()
  owner.finish(old)
  assert.equal(owner.isCurrent(next), true)
  assert.equal(owner.isBusy(), true)
  owner.finish(next)
})
test('encoder null empty or wrong MIME is failure rather than false successful output', () => {
  for (const value of [
    null,
    new Blob([], { type: 'image/png' }),
    new Blob(['x'], { type: 'image/jpeg' }),
  ])
    assert.throws(() => assertPNGBlob(value), /Blob/)
  const blob = new Blob(['png-fixture'], { type: 'image/png' })
  assert.equal(assertPNGBlob(blob), blob)
})
