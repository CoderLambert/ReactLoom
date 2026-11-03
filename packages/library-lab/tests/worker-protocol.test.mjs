import assert from 'node:assert/strict'
import test from 'node:test'
import {
  appendWorkerLog,
  parseWorkerReply,
  workerStartMessage,
} from '../src/lib/worker-protocol.mjs'

test('worker start contract is explicit and limited to three recognized stages', () => {
  assert.deepEqual(workerStartMessage('business', 'run-1'), {
    type: 'start',
    level: 'business',
    runId: 'run-1',
  })
  assert.throws(() => workerStartMessage('unsafe', 'run-1'), /invalid/)
  assert.throws(() => workerStartMessage('basic', ''), /invalid/)
})
test('host ignores stale, malformed and arbitrary script messages', () => {
  for (const data of [
    null,
    [],
    { type: 'result', message: 'OK', runId: 'other' },
    { type: 'eval', message: 'alert(1)', runId: 'run-1' },
    { type: 'progress', message: { evil: 1 }, runId: 'run-1' },
  ])
    assert.equal(parseWorkerReply(data, 'run-1'), null)
  const value = parseWorkerReply(
    { type: 'result', message: 'a'.repeat(5000), runId: 'run-1' },
    'run-1',
  )
  assert.equal(value.type, 'result')
  assert.equal(value.message.length, 4096)
})

test('worker log rows discard controls, embedded newlines and bidi spoofing', () => {
  const raw = 'start\nresult\u0000\u202eSTAP\u2066end'
  const reply = parseWorkerReply({ type: 'progress', message: raw, runId: 'run-1' }, 'run-1')
  assert.equal(reply.message, 'start result  STAP end')
  assert.equal(reply.message.includes('\n'), false)
})

test('bounded Worker transcript retains the terminal result and error at capacity', () => {
  const original = Array.from({ length: 40 }, (_, index) => `item-${index}`)
  const discarded = appendWorkerLog(original, { type: 'progress', message: 'ignored' })
  assert.equal(discarded.length, 40)
  assert.deepEqual(discarded, original)
  const result = appendWorkerLog(discarded, { type: 'result', message: 'final result' })
  assert.equal(result.length, 40)
  assert.equal(result[0], 'item-1')
  assert.equal(result.at(-1), 'final result')
  const failure = appendWorkerLog(result, { type: 'error', message: 'terminal failure' })
  assert.equal(failure.length, 40)
  assert.equal(failure.at(-1), 'terminal failure')
  assert.equal(original[0], 'item-0')
})
