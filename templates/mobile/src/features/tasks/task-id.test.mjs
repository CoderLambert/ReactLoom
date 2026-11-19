import assert from 'node:assert/strict'
import { test } from 'node:test'
import { encodeTaskIdSegment } from './task-id.ts'

const pathnameFor = (id) =>
  new URL(`/api/tasks/${encodeTaskIdSegment(id)}`, 'https://api.example.test').pathname

test('keeps an ordinary task ID on the task detail route', () => {
  assert.equal(pathnameFor('task-7'), '/api/tasks/task-7')
})

test('percent-encodes reserved URL characters without changing the route', () => {
  assert.equal(pathnameFor('one/two?yes#x'), '/api/tasks/one%2Ftwo%3Fyes%23x')
  assert.equal(pathnameFor('../session'), '/api/tasks/..%2Fsession')
  assert.equal(pathnameFor('%2E%2E'), '/api/tasks/%252E%252E')
})

test('rejects empty and dot-only path segments instead of normalizing to a parent route', () => {
  for (const id of ['', '.', '..']) {
    assert.throws(() => pathnameFor(id), /Task ID must identify/)
  }
})
