import assert from 'node:assert/strict'
import test from 'node:test'
import { Worker } from 'node:worker_threads'
import * as Comlink from 'comlink'
import nodeEndpoint from 'comlink/dist/esm/node-adapter.mjs'

async function session(run) {
  const worker = new Worker(new URL('./node-worker.mjs', import.meta.url))
  const remote = Comlink.wrap(nodeEndpoint(worker))
  try {
    await run(remote)
  } finally {
    remote[Comlink.releaseProxy]()
    const exit = await worker.terminate()
    assert.equal(typeof exit, 'number')
  }
}
test(
  'actual shared API runs in real Node Worker; special keys remain data',
  { timeout: 5000 },
  () =>
    session(async (remote) => {
      const result = await remote.summarize(['__proto__', 'constructor', '__proto__'])
      assert.deepEqual(result, {
        count: 3,
        frequency: [
          { value: '__proto__', count: 2 },
          { value: 'constructor', count: 1 },
        ],
      })
    }),
)
test('actual remote validation rejects, then the same endpoint recovers', { timeout: 5000 }, () =>
  session(async (remote) => {
    await assert.rejects(remote.summarize(['rss', 42]), /Expected at most/)
    assert.equal((await remote.summarize(['rss'])).count, 1)
    await assert.rejects(remote.sumBytes([1, 2]), /Expected Uint8Array/)
  }),
)
test('actual Worker owns transferred buffer and calls real proxy in order', { timeout: 5000 }, () =>
  session(async (remote) => {
    const bytes = new Uint8Array([5, 10, 15, 20, 25])
    assert.equal(await remote.sumBytes(Comlink.transfer(bytes, [bytes.buffer])), 75)
    assert.equal(bytes.byteLength, 0)
    const steps = []
    assert.equal(
      await remote.progress(
        3,
        Comlink.proxy(async (step) => {
          steps.push(step)
        }),
      ),
      3,
    )
    assert.deepEqual(steps, [1, 2, 3])
    await assert.rejects(
      remote.progress(
        21,
        Comlink.proxy(async () => {}),
      ),
      /1..20/,
    )
  }),
)
