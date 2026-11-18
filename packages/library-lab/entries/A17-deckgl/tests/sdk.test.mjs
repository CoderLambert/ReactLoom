import assert from 'node:assert/strict'
import test from 'node:test'
import { WebMercatorViewport } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'
import { SITES } from '../examples/deck-data.ts'
import { makeLayer } from '../examples/deck-layer.ts'

test('real production ScatterplotLayer descriptor keeps stable id, accessors and radius trigger', () => {
  const layer = makeLayer(SITES, 1.5)
  const updated = makeLayer([...SITES], 3)
  assert.ok(layer instanceof ScatterplotLayer)
  assert.equal(layer.id, 'library-sites')
  assert.equal(updated.id, layer.id)
  assert.equal(layer.props.radiusUnits, 'pixels')
  assert.deepEqual(layer.props.getPosition(SITES[0]), [116.4, 39.9])
  assert.deepEqual(layer.props.getFillColor(SITES[1]), [196, 125, 51, 225])
  assert.equal(updated.props.getRadius(SITES[0]), layer.props.getRadius(SITES[0]) * 2)
  assert.equal(updated.props.updateTriggers.getRadius, 3)
  assert.equal(layer.isLoaded, false) // A descriptor alone is not a GPU-initialized layer.
})

test('real WebMercatorViewport projects known coordinates and round-trips without a GPU', () => {
  const viewport = new WebMercatorViewport({
    width: 800,
    height: 330,
    longitude: 116.1,
    latitude: 39,
    zoom: 6,
  })
  const center = viewport.project([116.1, 39])
  assert.ok(Math.abs(center[0] - 400) < 1e-6)
  assert.ok(Math.abs(center[1] - 165) < 1e-6)
  const original = [116.4, 39.9]
  const restored = viewport.unproject(viewport.project(original))
  assert.ok(Math.abs(restored[0] - original[0]) < 1e-8)
  assert.ok(Math.abs(restored[1] - original[1]) < 1e-8)
})
