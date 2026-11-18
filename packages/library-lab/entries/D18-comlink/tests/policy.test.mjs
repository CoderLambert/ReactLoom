import assert from 'node:assert/strict'
import test from 'node:test'
import { releaseProxy } from 'comlink'
import { disposeSession } from '../examples/session-policy.mjs'
import { summarize } from '../examples/worker-api.ts'

test('business input bounds and dangerous keys are explicit', () => {
  assert.throws(() => summarize(new Array(10001).fill('x')), TypeError)
  assert.throws(() => summarize(['x'.repeat(201)]), TypeError)
  assert.throws(() => summarize([{}]), TypeError)
  assert.throws(() => summarize(new Array(2)), TypeError)
  assert.deepEqual(summarize(['toString', 'toString']).frequency, [{ value: 'toString', count: 2 }])
})
test('release throwing cannot skip physical termination; null cleanup is safe', () => {
  const controller = new AbortController()
  let terminated = 0
  const message = disposeSession({
    controller,
    remote: {
      [releaseProxy]() {
        throw new Error('released')
      },
    },
    worker: {
      terminate() {
        terminated++
      },
    },
  })
  assert.equal(controller.signal.aborted, true)
  assert.equal(terminated, 1)
  assert.match(message, /请求失败/)
  assert.equal(disposeSession(null), '没有活动 Worker')
})
