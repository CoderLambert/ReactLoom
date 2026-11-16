import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSingleFlightAction } from '../src/features/tasks/status-action.ts'

test('rejects a second status action before the first request settles', async () => {
  const singleFlight = createSingleFlightAction()
  let finish = () => {}
  const pending = new Promise((resolve) => {
    finish = resolve
  })
  let requests = 0
  const first = singleFlight(async () => {
    requests += 1
    await pending
  })
  const second = singleFlight(async () => {
    requests += 1
  })
  assert.equal(await second, false)
  assert.equal(requests, 1)
  finish()
  assert.equal(await first, true)
})

test('accepts another status update after the previous one succeeds', async () => {
  const singleFlight = createSingleFlightAction()
  let requests = 0
  assert.equal(await singleFlight(async () => { requests += 1 }), true)
  assert.equal(await singleFlight(async () => { requests += 1 }), true)
  assert.equal(requests, 2)
})

test('releases the lock after a rejected request so the user can retry', async () => {
  const singleFlight = createSingleFlightAction()
  await assert.rejects(singleFlight(async () => { throw new Error('HTTP 500') }), /HTTP 500/)
  assert.equal(await singleFlight(async () => {}), true)
})

test('releases the lock after a synchronous request exception', async () => {
  const singleFlight = createSingleFlightAction()
  await assert.rejects(singleFlight(() => { throw new Error('sync error') }), /sync error/)
  assert.equal(await singleFlight(async () => {}), true)
})

test('a fresh page/session action is not blocked by a previous page', async () => {
  const oldAction = createSingleFlightAction()
  const newAction = createSingleFlightAction()
  let finish = () => {}
  const pending = new Promise((resolve) => { finish = resolve })
  const oldRequest = oldAction(() => pending)
  assert.equal(await newAction(async () => {}), true)
  finish()
  await oldRequest
})
