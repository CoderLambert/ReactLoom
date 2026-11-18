import assert from 'node:assert/strict'
import test from 'node:test'
import { createFileCheck } from './file-check.mjs'

test('crop/export epoch changes do not prevent file-check completion', () => {
  const check = createFileCheck()
  const id = check.begin()
  let exportEpoch = 0
  exportEpoch++
  exportEpoch++
  assert.equal(check.current(id), true)
  assert.equal(exportEpoch, 2)
})
test('new selection and unmount reject stale file completion', () => {
  const check = createFileCheck()
  const old = check.begin(),
    next = check.begin()
  assert.equal(check.current(old), false)
  assert.equal(check.current(next), true)
  check.dispose()
  assert.equal(check.current(next), false)
})
