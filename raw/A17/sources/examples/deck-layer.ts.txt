import { ScatterplotLayer } from '@deck.gl/layers'
import type { Site } from './deck-data'

export function makeLayer(rows: Site[], radius: number) {
  return new ScatterplotLayer<Site>({
    id: 'library-sites',
    data: rows,
    getPosition: (row) => row.position,
    getFillColor: (row) => (row.healthy ? [32, 129, 103, 225] : [196, 125, 51, 225]),
    getRadius: (row) => Math.max(5, Math.sqrt(row.volume) * radius),
    radiusUnits: 'pixels',
    radiusMinPixels: 4,
    radiusMaxPixels: 28,
    stroked: true,
    getLineColor: [255, 255, 255],
    lineWidthMinPixels: 1,
    pickable: true,
    updateTriggers: { getRadius: radius },
  })
}
