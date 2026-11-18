import assert from 'node:assert/strict'
import test from 'node:test'
import { makeLabWave } from '../examples/wav.ts'
import { releaseWave } from '../examples/wave-cleanup.mjs'

test('original PCM bytes describe mono16bit 8000Hz/1.6s but are not decoder evidence', async () => {
  const blob = makeLabWave(),
    bytes = await blob.arrayBuffer(),
    view = new DataView(bytes)
  const text = (start, length) => String.fromCharCode(...new Uint8Array(bytes, start, length))
  assert.equal(blob.type, 'audio/wav')
  assert.equal(text(0, 4), 'RIFF')
  assert.equal(text(8, 4), 'WAVE')
  assert.equal(view.getUint16(20, true), 1)
  assert.equal(view.getUint16(22, true), 1)
  assert.equal(view.getUint32(24, true), 8000)
  assert.equal(view.getUint16(34, true), 16)
  assert.equal(view.getUint32(40, true), 12800 * 2)
  assert.equal(bytes.byteLength, 44 + 12800 * 2)
  assert.equal(view.getUint32(40, true) / view.getUint32(28, true), 1.6)
  assert.ok(new Int16Array(bytes, 44).some((value) => value !== 0))
})
test('cleanup attempts all unsubscribers and destroy, revokes even after errors', () => {
  const calls = []
  const errors = releaseWave(
    {
      destroy() {
        calls.push('destroy')
        throw Error('test')
      },
    },
    [
      () => {
        calls.push('off1')
        throw Error('test off')
      },
      () => calls.push('off2'),
    ],
    () => calls.push('revoke'),
  )
  assert.deepEqual(calls, ['off1', 'off2', 'destroy', 'revoke'])
  assert.equal(errors.length, 2)
})
