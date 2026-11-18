import assert from 'node:assert/strict'
import test from 'node:test'
import PQueue from 'p-queue'

test('real p-queue enforces concurrency, tracks pending and settles failures', async () => {
  const queue = new PQueue({ concurrency: 2 })
  let running = 0,
    peak = 0
  const tasks = Array.from({ length: 7 }, (_, index) =>
    queue.add(async () => {
      running++
      peak = Math.max(peak, running)
      try {
        await new Promise((resolve) => setTimeout(resolve, 15))
        if (index === 4) throw new Error('fixture')
        return index
      } finally {
        running--
      }
    }),
  )
  const result = await Promise.allSettled(tasks)
  assert.equal(peak, 2)
  assert.deepEqual(
    result.map((r) => r.status),
    ['fulfilled', 'fulfilled', 'fulfilled', 'fulfilled', 'rejected', 'fulfilled', 'fulfilled'],
  )
  assert.equal(queue.size, 0)
  assert.equal(queue.pending, 0)
  await queue.onIdle()
})

test('queued add promises settle when cancelled before starting', async () => {
  const queue = new PQueue({ concurrency: 1, autoStart: false })
  const controller = new AbortController()
  const promises = [
    queue.add(async () => 1, { signal: controller.signal }),
    queue.add(async () => 2, { signal: controller.signal }),
  ]
  controller.abort(new DOMException('stop', 'AbortError'))
  const result = await Promise.allSettled(promises)
  assert.deepEqual(
    result.map((r) => r.status),
    ['rejected', 'rejected'],
  )
  assert.equal(queue.size, 0)
})

test('abort while paused cancels both running and queued jobs without clear()', async () => {
  const queue = new PQueue({ concurrency: 1 })
  const controller = new AbortController()
  let started = 0
  const jobs = Array.from({ length: 4 }, () =>
    queue.add(
      async ({ signal }) => {
        started++
        await new Promise((resolve, reject) => {
          if (signal.aborted) {
            reject(signal.reason)
            return
          }
          const timer = setTimeout(resolve, 500)
          signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timer)
              reject(signal.reason)
            },
            { once: true },
          )
        })
      },
      { signal: controller.signal },
    ),
  )
  await new Promise((resolve) => setTimeout(resolve, 10))
  queue.pause()
  controller.abort(new DOMException('cancelled', 'AbortError'))
  const settled = await Promise.allSettled(jobs)
  assert.equal(started, 1)
  assert.deepEqual(
    settled.map((result) => result.status),
    Array(4).fill('rejected'),
  )
  assert.equal(queue.size, 0)
  await queue.onIdle()
})

test('strict rolling window and waiting priority affect actual starts', async () => {
  const queue = new PQueue({
    concurrency: 1,
    interval: 120,
    intervalCap: 2,
    strict: true,
    autoStart: false,
  })
  const starts = []
  const tasks = Array.from({ length: 6 }, (_, index) =>
    queue.add(
      async () => {
        starts.push({ id: index + 1, time: performance.now() })
        await new Promise((resolve) => setTimeout(resolve, 5))
      },
      { priority: index === 4 ? 5 : 0 },
    ),
  )
  queue.start()
  await Promise.all(tasks)
  assert.deepEqual(
    starts.map((item) => item.id),
    [5, 1, 2, 3, 4, 6],
  )
  for (let index = 2; index < starts.length; index++) {
    assert.ok(
      starts[index].time - starts[index - 2].time >= 118,
      'two-start cap holds across sliding windows (2ms timer tolerance)',
    )
  }
  await queue.onIdle()
})

test('v10 clear rejects waiting tasks but leaves running task alone', async () => {
  const queue = new PQueue({ concurrency: 1 })
  let release
  const running = queue.add(
    () =>
      new Promise((resolve) => {
        release = resolve
      }),
  )
  const waiting = queue.add(async () => 'must not start')
  const rejected = assert.rejects(waiting, { name: 'AbortError' })
  queue.clear()
  await rejected
  assert.equal(queue.pending, 1)
  release('finished')
  assert.equal(await running, 'finished')
  await queue.onIdle()
})
