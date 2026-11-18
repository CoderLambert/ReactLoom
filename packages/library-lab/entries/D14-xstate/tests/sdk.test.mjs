import assert from 'node:assert/strict'
import test from 'node:test'
import { createActor } from 'xstate'
import { reviewMachine } from '../examples/review-machine.ts'
import { MAX_REJECTION_REASON_LENGTH } from '../examples/review-policy.mjs'

function started() {
  return createActor(reviewMachine).start()
}
test('displayed machine ignores absent transitions and resets published state', () => {
  const actor = started()
  try {
    actor.send({ type: 'APPROVE' })
    assert.equal(actor.getSnapshot().value, 'draft')
    actor.send({ type: 'SUBMIT' })
    actor.send({ type: 'APPROVE' })
    assert.equal(actor.getSnapshot().value, 'published')
    actor.send({ type: 'REJECT', reason: 'late' })
    assert.equal(actor.getSnapshot().value, 'published')
    actor.send({ type: 'RESET' })
    assert.equal(actor.getSnapshot().value, 'draft')
    assert.deepEqual(actor.getSnapshot().context, { retries: 0, reason: '' })
  } finally {
    actor.stop()
  }
})
test('displayed machine rejects invalid raw REJECT and normalizes Unicode reason', () => {
  const actor = started()
  try {
    actor.send({ type: 'SUBMIT' })
    for (const reason of [
      '',
      '  ',
      null,
      undefined,
      '😀'.repeat(MAX_REJECTION_REASON_LENGTH + 1),
    ]) {
      actor.send({ type: 'REJECT', reason })
      assert.equal(actor.getSnapshot().value, 'reviewing')
    }
    const valid = '😀'.repeat(MAX_REJECTION_REASON_LENGTH)
    actor.send({ type: 'REJECT', reason: `  ${valid}  ` })
    assert.equal(actor.getSnapshot().value, 'rejected')
    assert.equal(actor.getSnapshot().context.reason, valid)
  } finally {
    actor.stop()
  }
})
test('displayed machine bounds retries and RESET clears count and reason', () => {
  const actor = started()
  try {
    actor.send({ type: 'SUBMIT' })
    for (let retry = 1; retry <= 2; retry++) {
      actor.send({ type: 'REJECT', reason: 'not ready' })
      actor.send({ type: 'RETRY' })
      assert.equal(actor.getSnapshot().value, 'reviewing')
      assert.deepEqual(actor.getSnapshot().context, { retries: retry, reason: '' })
    }
    actor.send({ type: 'REJECT', reason: 'still not ready' })
    actor.send({ type: 'RETRY' })
    assert.equal(actor.getSnapshot().value, 'rejected')
    assert.equal(actor.getSnapshot().context.retries, 2)
    actor.send({ type: 'RESET' })
    assert.deepEqual(actor.getSnapshot().context, { retries: 0, reason: '' })
  } finally {
    actor.stop()
  }
})
test('unsubscribe and stop release owner; stopped actor does not process new events', () => {
  const actor = started()
  let count = 0
  const sub = actor.subscribe(() => {
    count++
  })
  actor.send({ type: 'SUBMIT' })
  sub.unsubscribe()
  const before = count
  actor.send({ type: 'APPROVE' })
  assert.equal(count, before)
  actor.stop()
  actor.send({ type: 'RESET' })
  assert.equal(actor.getSnapshot().value, 'published')
})
