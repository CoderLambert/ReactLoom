import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkImageFile, checkImageDimensions, checkCropArea, MAX_IMAGE_BYTES } from './crop-policy.mjs';

test('only nonempty bounded image files pass before decode', () => {
  assert.equal(checkImageFile({ type: 'image/png', size: MAX_IMAGE_BYTES }).size, MAX_IMAGE_BYTES);
  for (const file of [{ type: 'image/png', size: 0 }, { type: 'image/gif', size: 8 }, { type: 'image/jpeg', size: MAX_IMAGE_BYTES + 1 }, { type: 'image/webp', size: NaN }]) {
    assert.throws(() => checkImageFile(file));
  }
});

test('decoded dimensions require safe positive integral bounds', () => {
  assert.deepEqual(checkImageDimensions(4000, 4000), { width: 4000, height: 4000 });
  for (const size of [[0, 3], [-1, 10], [Infinity, 2], [5000, 5000], [100.5, 100]]) {
    assert.throws(() => checkImageDimensions(...size));
  }
});

test('normal croppedAreaPixels fits within original decoded image', () => {
  const area = { x: 20, y: 40, width: 1000, height: 400 };
  assert.deepEqual(checkCropArea(area, 1200, 800), area);
});

test('rejects fractional, negative and out of bounds rectangle before Canvas allocation', () => {
  for (const area of [
    { x: -1, y: 0, width: 200, height: 200 },
    { x: 1000, y: 0, width: 201, height: 200 },
    { x: 0, y: 700, width: 100, height: 101 },
    { x: 1.5, y: 0, width: 200, height: 200 },
    { x: 0, y: 0, width: NaN, height: 200 },
  ]) assert.throws(() => checkCropArea(area, 1200, 800));
});

test('rejects valid-source geometry that would exceed output Canvas memory budget', () => {
  assert.throws(() => checkCropArea({ x: 0, y: 0, width: 3000, height: 2000 }, 4000, 4000), /400万/);
});
