import assert from 'node:assert/strict'
import test from 'node:test'
import { readTextPreview } from '../examples/preview-policy.mjs'

test('decodes valid multilingual UTF-8 without network', async () => {
  assert.equal(await readTextPreview(new Blob(['新闻,hello\n'])), '新闻,hello\n')
})
test('rejects payload larger than 12KB before reading bytes', async () => {
  await assert.rejects(readTextPreview(new Blob([new Uint8Array(12_001)])), /12,000字节/)
})
test('rejects binary control bytes and invalid UTF-8', async () => {
  await assert.rejects(readTextPreview(new Blob(['hello\0world'])), /控制字符/)
  await assert.rejects(readTextPreview(new Blob([new Uint8Array([0xc3, 0x28])])), TypeError)
})
test('caps visible preview while accepting bounded content', async () => {
  const result = await readTextPreview(new Blob(['x'.repeat(8_000)]))
  assert.equal(result.length, 4_000)
})

test('display truncates Unicode codepoints without splitting surrogate pairs', async () => {
  const output = await readTextPreview(new Blob([`${'x'.repeat(3999)}😀suffix`]))
  assert.equal(Array.from(output).length, 4000)
  assert.ok(output.endsWith('😀'))
})
test('only TAB LF CR are allowed C0 controls and empty text is valid', async () => {
  assert.equal(await readTextPreview(new Blob(['\t\n\r'])), '\t\n\r')
  await assert.rejects(readTextPreview(new Blob(['\f'])), /控制字符/)
  assert.equal(await readTextPreview(new Blob([])), '')
})
