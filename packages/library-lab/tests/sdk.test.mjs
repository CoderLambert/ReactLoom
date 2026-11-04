import assert from 'node:assert/strict'
import test from 'node:test'
import clsx from 'clsx'
import { clsx as lite } from 'clsx/lite'
import pLimit from 'p-limit'

test('actual clsx composes conditions without merging utilities', () => {
  assert.equal(
    clsx('base', { selected: true, hidden: false }, [null, 'px-2', 'px-4']),
    'base selected px-2 px-4',
  )
  assert.equal(clsx(false, 0, null, undefined), '')
  assert.equal(lite('base', false && 'hidden'), 'base')
})
test('actual p-limit respects maximum concurrency and preserves aggregation order', async () => {
  const limit = pLimit(2)
  let active = 0,
    max = 0
  const values = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      limit(async () => {
        active++
        max = Math.max(max, active)
        await new Promise((resolve) => setTimeout(resolve, 5))
        active--
        return i
      }),
    ),
  )
  assert.equal(max, 2)
  assert.deepEqual(values, [0, 1, 2, 3, 4, 5])
  assert.equal(limit.activeCount, 0)
  assert.equal(limit.pendingCount, 0)
})
test('actual p-limit failure does not prevent later jobs', async () => {
  const limit = pLimit(1)
  const result = await Promise.allSettled([
    limit(() => {
      throw new Error('fixture')
    }),
    limit(() => 42),
  ])
  assert.equal(result[0].status, 'rejected')
  assert.deepEqual(result[1], { status: 'fulfilled', value: 42 })
})
