import assert from 'node:assert/strict'
import { test } from 'node:test'
import { visibleArtwork } from './gallery-policy.mjs'

const images = Array.from({ length: 4 }, (_, i) => ({
  id: i + 1,
  src: `local-${i}`,
  alt: `图像 ${i}`,
  width: 1200,
  height: 800,
}))

test('basic/business/advanced gallery selection has deterministic boundaries', () => {
  assert.deepEqual(
    visibleArtwork(images, 'basic').map((v) => v.id),
    [1],
  )
  assert.deepEqual(
    visibleArtwork(images, 'business').map((v) => v.id),
    [1, 2, 3],
  )
  assert.deepEqual(
    visibleArtwork(images, 'advanced', true).map((v) => v.id),
    [1, 2, 3, 4],
  )
  assert.deepEqual(
    visibleArtwork(images, 'advanced', false).map((v) => v.id),
    [1, 2, 3],
  )
})

test('unknown level and duplicate selected IDs fail', () => {
  assert.throws(() => visibleArtwork(images, 'unexpected'))
  assert.throws(() => visibleArtwork([images[0], images[0]], 'business'), /无效/)
})

test('bad dimension/alt is not forwarded to PhotoSwipe', () => {
  assert.throws(() => visibleArtwork([{ ...images[0], width: 0 }], 'basic'))
  assert.throws(() => visibleArtwork([{ ...images[0], alt: '' }], 'basic'))
})

test('actual owned SVG fixture has intrinsic dimensions matching gallery metadata', async () => {
  const { artwork } = await import('./artwork.mjs')
  assert.equal(artwork.length, 4)
  for (const item of artwork) {
    const svg = decodeURIComponent(item.src.split(',')[1])
    assert.ok(svg.includes('width="1200" height="800" viewBox="0 0 1200 800"'))
    assert.equal(item.width, 1200)
    assert.equal(item.height, 800)
    assert.ok(!/<script|onerror|href=/.test(svg))
  }
})
