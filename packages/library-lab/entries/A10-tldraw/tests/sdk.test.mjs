import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Worker } from 'node:worker_threads'

/** @param {'restore' | 'scope'} scenario */
async function runSdkScenario(scenario) {
  const worker = new Worker(new URL('./fixtures/store-worker.mjs', import.meta.url), {
    workerData: { scenario },
  })
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  try {
    const result = await new Promise((resolve, reject) => {
      timeout = setTimeout(() => reject(new Error(`SDK worker timed out: ${scenario}`)), 10_000)
      worker.once('error', reject)
      worker.once('exit', (code) =>
        reject(new Error(`SDK worker exited without result: ${scenario} (${code})`)),
      )
      worker.once('message', resolve)
    })
    assert.deepEqual(result, { scenario, passed: true })
  } finally {
    clearTimeout(timeout)
    // No process.exit or force-exit: release only the execution resource owned by this test.
    await worker.terminate()
  }
}

test('real SDK document-only restore removes later shapes and retains saved record identity/text', async () => {
  await runSdkScenario('restore')
})

test('getSnapshot separates session from document-scoped Store records', async () => {
  await runSdkScenario('scope')
})
