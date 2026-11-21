import assert from 'node:assert/strict'
import test from 'node:test'
import { taskResourcePath } from '../src/features/tasks/task-path.ts'

const baseUrl = 'http://127.0.0.1:4317/'

function resolved(id) {
  return new URL(taskResourcePath(id), baseUrl)
}

test('keeps ordinary IDs at the existing task endpoint', () => {
  assert.equal(taskResourcePath('task-1'), '/api/tasks/task-1')
  assert.equal(resolved('task-1').pathname, '/api/tasks/task-1')
})

test('treats slashes and path traversal strings as opaque IDs', () => {
  for (const id of ['team/42', '../session', 'folder\\item']) {
    const url = resolved(id)
    assert.equal(url.pathname, `/api/tasks/${encodeURIComponent(id)}`)
    assert.equal(decodeURIComponent(url.pathname.slice('/api/tasks/'.length)), id)
  }
})

test('does not turn reserved URL characters into search or fragment components', () => {
  for (const id of ['task?admin=true', 'task#debug', 'test%2Fvalue', 'a b']) {
    const url = resolved(id)
    assert.equal(url.pathname, `/api/tasks/${encodeURIComponent(id)}`)
    assert.equal(url.search, '')
    assert.equal(url.hash, '')
    assert.equal(decodeURIComponent(url.pathname.slice('/api/tasks/'.length)), id)
  }
})

test('preserves Unicode ID semantics', () => {
  const id = '任务-🎯'
  assert.equal(decodeURIComponent(resolved(id).pathname.slice('/api/tasks/'.length)), id)
})

test('rejects empty or URL-normalized dot-only resource IDs', () => {
  for (const id of ['', '.', '..']) {
    assert.throws(() => taskResourcePath(id), /Invalid task ID/)
  }
})
