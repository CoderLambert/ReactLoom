import assert from 'node:assert/strict'
import test from 'node:test'
import { Evented, LngLat, MercatorCoordinate } from 'maplibre-gl'

test('real SDK longitude/latitude and Mercator conversions retain the station coordinates', () => {
  const input = new LngLat(116.4, 39.9)
  assert.deepEqual(input.toArray(), [116.4, 39.9])
  const restored = MercatorCoordinate.fromLngLat(input).toLngLat()
  assert.ok(Math.abs(restored.lng - 116.4) < 1e-9)
  assert.ok(Math.abs(restored.lat - 39.9) < 1e-9)
  assert.throws(() => new LngLat(116.4, 190), /latitude/i)
})

test('real SDK Evented removes only the registered listener', () => {
  const target = new Evented()
  let owned = 0
  let other = 0
  const listener = () => owned++
  const otherListener = () => other++
  try {
    target.on('probe', listener)
    target.on('probe', otherListener)
    target.fire('probe')
    target.off('probe', listener)
    target.fire('probe')
    assert.deepEqual([owned, other], [1, 2])
  } finally {
    target.off('probe', listener)
    target.off('probe', otherListener)
  }
})
