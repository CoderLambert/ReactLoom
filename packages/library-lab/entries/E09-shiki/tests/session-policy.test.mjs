import assert from 'node:assert/strict'
import test from 'node:test'
import { setTimeout as delay } from 'node:timers/promises'
import { scheduleHighlight } from '../examples/highlight-session.mjs'

test('cleanup prevents a pending timer from starting work', async () => {
  let calls = 0
  const cancel = scheduleHighlight(
    async () => {
      calls++
    },
    () => {},
    () => {},
    5,
  )
  cancel()
  await delay(15)
  assert.equal(calls, 0)
})
test('cleanup suppresses stale completion while new request settles', async () => {
  let resolve
  let started = false
  const results = []
  const cancel = scheduleHighlight(
    () => {
      started = true
      return new Promise((r) => {
        resolve = r
      })
    },
    (value) => results.push(value),
    () => {},
    0,
  )
  await delay(10)
  assert.equal(started, true)
  cancel()
  const stop = scheduleHighlight(
    async () => 'new',
    (value) => results.push(value),
    () => {},
    0,
  )
  await delay(10)
  resolve('old')
  await delay(5)
  assert.deepEqual(results, ['new'])
  stop()
})
test('cleanup suppresses late failure and active failure is reported', async () => {
  let reject
  const errors = []
  const cancel = scheduleHighlight(
    () =>
      new Promise((_, r) => {
        reject = r
      }),
    () => {},
    (e) => errors.push(e),
    0,
  )
  await delay(10)
  cancel()
  reject(Error('old'))
  await delay(5)
  assert.equal(errors.length, 0)
  const stop = scheduleHighlight(
    async () => {
      throw Error('active')
    },
    () => {},
    (e) => errors.push(e),
    0,
  )
  await delay(10)
  assert.equal(errors[0].message, 'active')
  stop()
})
