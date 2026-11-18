import assert from 'node:assert/strict'
import test from 'node:test'
import { applyStatusEdit } from '../examples/edit-policy.mjs'
import { captureEdit, expectedRevision } from '../examples/edit-session.ts'

const source = () => ({
  id: 'feed-0001',
  name: 'RSS',
  category: '前端',
  articles: 1,
  status: 'active' as const,
  revision: 1,
})
test('an editing session copies the start revision instead of rereading submission data', () => {
  const data = source()
  const session = captureEdit(data)
  data.revision = 2
  assert.deepEqual(session, { id: 'feed-0001', revision: 1 })
  const revision = expectedRevision(session, data.id)
  assert.equal(revision, 1)
  if (revision === null) throw new Error('Missing start snapshot')
  assert.equal(applyStatusEdit([data], data.id, 'paused', revision).outcome, 'conflict')
  assert.equal(data.status, 'active')
})
test('missing or mismatched session cannot supply an expected revision', () => {
  assert.equal(captureEdit(undefined), null)
  assert.equal(expectedRevision(null, 'feed-0001'), null)
  assert.equal(expectedRevision(captureEdit(source()), 'another-id'), null)
})
