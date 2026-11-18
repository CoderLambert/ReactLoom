import assert from 'node:assert/strict'
import test from 'node:test'
import { addLocalFiles, bindLocalQueue, createLocalQueue } from '../examples/local-queue.mjs'

const file = (name, text = 'hello', type = 'text/plain') =>
  new File([text], name, { type, lastModified: 0 })
function queue(run) {
  const uppy = createLocalQueue('F01-real-node', { infoTimeout: 0 })
  try {
    return run(uppy)
  } finally {
    uppy.destroy()
  }
}

test('real Core batch partially accepts type failures; existing duplicates emit instead of throw', () =>
  queue((uppy) => {
    const first = file('first.txt'),
      bad = file('bad.exe', 'bad', 'application/octet-stream')
    const summary = addLocalFiles(uppy, [first, bad, file('notes.md')])
    assert.equal(summary.added, 2)
    assert.equal(summary.notAdded, 1)
    assert.equal(summary.errors.length, 1)
    assert.equal(summary.fatal, null)
    const duplicate = addLocalFiles(uppy, [first])
    assert.equal(duplicate.added, 0)
    assert.equal(duplicate.errors.length, 1)
    assert.equal(duplicate.fatal, null)
    assert.equal(uppy.getFiles().length, 2)
  }))
test('real Core max-number aggregate rejects the whole excess batch, not first remaining slot', () =>
  queue((uppy) => {
    addLocalFiles(uppy, [file('a.txt'), file('b.txt')])
    const batch = addLocalFiles(uppy, [file('c.txt'), file('d.txt')])
    assert.equal(batch.added, 0)
    assert.equal(batch.notAdded, 2)
    assert.equal(batch.errors.length, 1)
    assert.equal(uppy.getFiles().length, 2)
    assert.equal(addLocalFiles(uppy, [file('c.txt')]).added, 1)
    assert.equal(addLocalFiles(uppy, [file('large.txt', new Uint8Array(1024 * 1024 + 1))]).added, 0)
    assert.equal(uppy.getFiles().length, 3)
  }))
test('real non-restriction application error aborts before batch state update', () =>
  queue((uppy) => {
    uppy.setOptions({
      onBeforeFileAdded() {
        throw new Error('test application hook')
      },
    })
    const result = addLocalFiles(uppy, [file('a.txt'), file('b.txt')])
    assert.match(result.fatal, /test application hook/)
    assert.equal(result.added, 0)
    assert.equal(uppy.getFiles().length, 0)
  }))
test('real remove emits file-removed; clear resets state without that per-file event', () =>
  queue((uppy) => {
    let removed = 0
    const observer = () => removed++
    uppy.on('file-removed', observer)
    addLocalFiles(uppy, [file('a.txt'), file('b.txt')])
    uppy.removeFile(uppy.getFiles()[0].id)
    assert.equal(removed, 1)
    uppy.clear()
    assert.equal(uppy.getFiles().length, 0)
    assert.equal(removed, 1)
    uppy.off('file-removed', observer)
  }))
test('shared cleanup offs owned callbacks then real destroy drops Core queue File references', () => {
  const uppy = createLocalQueue('F01-real-dispose', { infoTimeout: 0 })
  let updates = 0,
    restrictions = 0,
    released = false
  const dispose = bindLocalQueue(
    uppy,
    () => updates++,
    () => restrictions++,
  )
  try {
    const input = file('owned.txt')
    addLocalFiles(uppy, [input])
    assert.equal(uppy.getFiles()[0].data, input)
    const before = updates
    dispose()
    released = true
    assert.equal(uppy.getFiles().length, 0)
    assert.equal(updates, before)
    uppy.emit('restriction-failed', undefined, new Error('post-disposal probe'))
    assert.equal(restrictions, 0)
  } finally {
    if (!released) dispose()
  }
})
