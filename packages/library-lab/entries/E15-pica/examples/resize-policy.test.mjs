import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkSourceFile, checkSourcePixels, targetDimensions, MAX_IMAGE_BYTES } from './resize-policy.mjs';

test('file gate rejects malformed input before decode', () => {
  assert.equal(checkSourceFile({ type: 'image/webp', size: 10 }).size, 10);
  for (const file of [{ type: 'image/gif', size: 10 }, { type: 'image/png', size: 0 }, { type: 'image/png', size: MAX_IMAGE_BYTES + 1 }, { type: 'image/jpeg', size: Infinity }]) {
    assert.throws(() => checkSourceFile(file));
  }
});

test('bitmap pixel budget catches dimensions independent of file length', () => {
  assert.doesNotThrow(() => checkSourcePixels(4000, 4000));
  for (const dimensions of [[4001, 4000], [0, 100], [1.5, 100], [2, Infinity]]) {
    assert.throws(() => checkSourcePixels(...dimensions));
  }
});

test('aspect ratio stays intact and small images are not upscaled', () => {
  assert.deepEqual(targetDimensions(1280, 800, 480), { width: 480, height: 300 });
  assert.deepEqual(targetDimensions(100, 100, 800), { width: 100, height: 100 });
  assert.deepEqual(targetDimensions(1, 4000, 240), { width: 1, height: 240 });
});

test('unsafe and unapproved output sizes fail deterministically', () => {
  assert.throws(() => targetDimensions(500, 400, 400));
  assert.throws(() => targetDimensions(500, 400, NaN));
  assert.throws(() => targetDimensions(500, 400, 1e9));
});
