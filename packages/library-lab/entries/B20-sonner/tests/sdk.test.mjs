import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import test from 'node:test'
import { Worker } from 'node:worker_threads'

const sdkEntry = createRequire(import.meta.url).resolve('sonner')

// Each real SDK module store belongs to one Node Worker. No DOM/RAF replacement:
// a browser is needed for dismissal/rendering; terminating this worker releases its own heap.
async function inspectStore(finite) {
  const worker = new Worker(
    `
    const { parentPort, workerData } = require('node:worker_threads');
    const { toast } = require(workerData.entry);
    const id = toast.loading('local task', { duration: Infinity, toasterId: 'owned-container' });
    const other = toast('independent notice', { toasterId: 'other-container', duration: 1234 });
    const updatedId = toast.success('done', { id, toasterId: 'owned-container', ...(workerData.finite ? { duration: 3500 } : {}) });
    parentPort.postMessage({ id, updatedId, other, toasts: toast.getToasts() });
  `,
    { eval: true, workerData: { entry: sdkEntry, finite } },
  )
  let timer
  try {
    return await new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('Actual Sonner worker timed out')), 5000)
      worker.once('message', resolve)
      worker.once('error', reject)
      worker.once('exit', (code) => {
        if (code !== 0) reject(new Error(`Actual Sonner worker exited ${code}`))
      })
    })
  } finally {
    clearTimeout(timer)
    await worker.terminate()
  }
}

test('actual Sonner same-id updates retain loading Infinity when omitted', async () => {
  const result = await inspectStore(false)
  assert.equal(result.updatedId, result.id)
  const own = result.toasts.filter((item) => item.id === result.id)
  assert.equal(own.length, 1)
  assert.equal(own[0].type, 'success')
  assert.equal(own[0].title, 'done')
  assert.equal(own[0].duration, Infinity)
})

test('actual Sonner same-id finite terminal update preserves identity and other-container data', async () => {
  const result = await inspectStore(true)
  assert.equal(result.updatedId, result.id)
  assert.equal(result.toasts.length, 2)
  const own = result.toasts.find((item) => item.id === result.id)
  assert.equal(own.duration, 3500)
  assert.equal(own.toasterId, 'owned-container')
  assert.equal(own.type, 'success')
  const other = result.toasts.find((item) => item.id === result.other)
  assert.equal(other.toasterId, 'other-container')
  assert.equal(other.duration, 1234)
  assert.equal(other.title, 'independent notice')
  // SDK store semantics only; not a claim about Toaster routing, timers or rendering.
})
