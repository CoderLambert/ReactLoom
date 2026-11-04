import test from 'node:test';
import assert from 'node:assert/strict';
import {readLocalTextPreview, PREVIEW_BYTES, PREVIEW_CHARACTERS} from './preview.mjs';

// Native Node Blob API; does not import react-dropzone or exercise browser drag-drop.
test('F02 bounded File API: reads only first 8192 bytes', async () => {
  const blob = new Blob(['a'.repeat(12000)]);
  let range;
  const file = {size: blob.size, slice(start,end) {range=[start,end];return blob.slice(start,end)}};
  const text = await readLocalTextPreview(file);
  assert.deepEqual(range, [0,PREVIEW_BYTES]);
  assert.equal(text, 'a'.repeat(PREVIEW_CHARACTERS));
});
test('F02 bounded File API: preserves short UTF-8 content', async () => {
  assert.equal(await readLocalTextPreview(new Blob(['本地CSV,通过'])), '本地CSV,通过');
});
test('F02 bounded File API: rejects malformed file inputs', async () => {
  await assert.rejects(readLocalTextPreview({size: 1}), /Blob\/File/);
  await assert.rejects(readLocalTextPreview({size: -1, slice() {}}), /Blob\/File/);
});
