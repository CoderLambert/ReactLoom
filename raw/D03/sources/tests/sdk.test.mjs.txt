import assert from 'node:assert/strict'
import test from 'node:test'
import pLimit from 'p-limit'

for (const concurrency of [1, 2, 4]) {
  test(`actual p-limit measures peak ${concurrency} and returns values in input order`, async () => {
    const limit = pLimit({ concurrency, rejectOnClear: true })
    let active = 0
    let peak = 0
    const values = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        limit(async () => {
          active++
          peak = Math.max(peak, active)
          try {
            await new Promise((resolve) => setTimeout(resolve, 4))
            return i
          } finally {
            active--
          }
        }),
      ),
    )
    assert.equal(peak, concurrency)
    assert.deepEqual(values, [0, 1, 2, 3, 4, 5, 6, 7])
    assert.equal(limit.activeCount, 0)
    assert.equal(limit.pendingCount, 0)
  })
}

test('a rejected task releases its slot and the remaining queue still completes', async () => {
  const limit = pLimit({ concurrency: 2, rejectOnClear: true })
  const completed = []
  const outcomes = await Promise.allSettled(
    Array.from({ length: 10 }, (_, index) =>
      limit(async () => {
        await new Promise((resolve) => setTimeout(resolve, 4))
        if (index === 3) throw new Error('local failure')
        completed.push(index)
        return index
      }),
    ),
  )
  assert.equal(outcomes.filter((outcome) => outcome.status === 'rejected').length, 1)
  assert.equal(outcomes[3].status, 'rejected')
  assert.deepEqual(
    completed.toSorted((a, b) => a - b),
    [0, 1, 2, 4, 5, 6, 7, 8, 9],
  )
  assert.equal(limit.activeCount, 0)
  assert.equal(limit.pendingCount, 0)
})

test('rejectOnClear settles every queued promise with AbortError', { timeout: 5000 }, async () => {
  const limit = pLimit({ concurrency: 1, rejectOnClear: true })
  let finishFirst
  let unexpectedlyStarted = 0
  const running = limit(
    () =>
      new Promise((resolve) => {
        finishFirst = () => resolve('finished')
      }),
  )
  const queued = Array.from({ length: 3 }, () =>
    limit(() => {
      unexpectedlyStarted++
      return 'unexpected'
    }),
  )
  // Attach handlers before clearing so intentional rejections are not unhandled.
  const settling = Promise.allSettled(queued)
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(limit.activeCount, 1)
  assert.equal(limit.pendingCount, 3)
  limit.clearQueue()
  const results = await settling
  assert.equal(unexpectedlyStarted, 0)
  for (const item of results) {
    assert.equal(item.status, 'rejected')
    assert.equal(item.reason.name, 'AbortError')
  }
  finishFirst()
  assert.equal(await running, 'finished')
  assert.equal(limit.pendingCount, 0)
})

test('clearing queue does not abort running work without its own signal', {
  timeout: 5000,
}, async () => {
  const limit = pLimit({ concurrency: 1, rejectOnClear: true })
  const controller = new AbortController()
  const running = limit(
    () =>
      new Promise((_resolve, reject) => {
        controller.signal.addEventListener('abort', () => reject(controller.signal.reason), {
          once: true,
        })
      }),
  )
  const runningOutcome = Promise.allSettled([running])
  const queuedOutcome = Promise.allSettled([limit(() => 'must not start')])
  await new Promise((resolve) => setImmediate(resolve))
  controller.abort(new DOMException('cancelled', 'AbortError'))
  limit.clearQueue()
  const [[first], [second]] = await Promise.all([runningOutcome, queuedOutcome])
  assert.equal(first.status, 'rejected')
  assert.equal(first.reason.name, 'AbortError')
  assert.equal(second.status, 'rejected')
  assert.equal(second.reason.name, 'AbortError')
})
