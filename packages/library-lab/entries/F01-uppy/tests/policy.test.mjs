import test from 'node:test';
import assert from 'node:assert/strict';
import { readTextPreview } from '../preview-policy.mjs';

test('decodes valid multilingual UTF-8 without network', async () => {
  assert.equal(await readTextPreview(new Blob(['新闻,hello\n'])), '新闻,hello\n');
});
test('rejects payload larger than 12KB before reading bytes', async () => {
  await assert.rejects(readTextPreview(new Blob([new Uint8Array(12_001)])), /12KB/);
});
test('rejects binary control bytes and invalid UTF-8', async () => {
  await assert.rejects(readTextPreview(new Blob(['hello\0world'])), /控制字符/);
  await assert.rejects(readTextPreview(new Blob([new Uint8Array([0xc3, 0x28])])), TypeError);
});
test('caps visible preview while accepting bounded content', async () => {
  const result = await readTextPreview(new Blob(['x'.repeat(8_000)]));
  assert.equal(result.length, 4_000);
});
