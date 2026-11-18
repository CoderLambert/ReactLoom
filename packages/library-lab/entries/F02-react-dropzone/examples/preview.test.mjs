import assert from 'node:assert/strict'
import test from 'node:test'
import { PREVIEW_BYTES, PREVIEW_CHARACTERS, readLocalTextPreview } from './preview.mjs'

// Native Node Blob API; does not import react-dropzone or exercise browser drag-drop.
test('F02 bounded File API: reads only first 8192 bytes', async () => {
  const blob = new Blob(['a'.repeat(12000)])
  let range
  const file = {
    size: blob.size,
    slice(start, end) {
      range = [start, end]
      return blob.slice(start, end)
    },
  }
  const text = await readLocalTextPreview(file)
  assert.deepEqual(range, [0, PREVIEW_BYTES])
  assert.equal(text, 'a'.repeat(PREVIEW_CHARACTERS))
})
test('F02 bounded File API: preserves short UTF-8 content', async () => {
  assert.equal(await readLocalTextPreview(new Blob(['本地CSV,通过'])), '本地CSV,通过')
})
test('F02 bounded File API: rejects malformed file inputs', async () => {
  await assert.rejects(readLocalTextPreview({ size: 1 }), /Blob\/File/)
  await assert.rejects(readLocalTextPreview({ size: -1, slice() {} }), /Blob\/File/)
})

test('drops incomplete trailing UTF8 and never splits a visible surrogate pair', async () => {
  const input = new Blob(['a'.repeat(8191), '界'])
  const preview = await readLocalTextPreview(input)
  assert.equal(preview.includes('\ufffd'), false)
  assert.equal(await readLocalTextPreview(new Blob(['a'.repeat(1599), '😀'])), 'a'.repeat(1599))
})

test('invalid interior UTF8 uses replacement rather than claiming strict validation', async () => {
  assert.equal(await readLocalTextPreview(new Blob([new Uint8Array([0xff, 0x61])])), '\ufffda')
})
