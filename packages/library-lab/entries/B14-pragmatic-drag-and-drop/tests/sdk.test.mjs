import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)
const { reorder } = require('@atlaskit/pragmatic-drag-and-drop/reorder')
const { combine } = require('@atlaskit/pragmatic-drag-and-drop/combine')

test('actual SDK reorder owns a new array while retaining business object identity', () => {
  const rows = [{ id: 'ai' }, { id: 'frontend' }, { id: 'opensource' }]
  const next = reorder({ list: rows, startIndex: 0, finishIndex: 2 })
  assert.deepEqual(
    next.map((row) => row.id),
    ['frontend', 'opensource', 'ai'],
  )
  assert.deepEqual(
    rows.map((row) => row.id),
    ['ai', 'frontend', 'opensource'],
  )
  assert.notEqual(next, rows)
  assert.equal(next[2], rows[0])
})

test('actual SDK combine calls the supplied detach callbacks in registration order', () => {
  const calls = []
  const detach = combine(
    () => calls.push('draggable'),
    () => calls.push('target'),
  )
  assert.deepEqual(calls, [])
  detach()
  assert.deepEqual(calls, ['draggable', 'target'])
})
