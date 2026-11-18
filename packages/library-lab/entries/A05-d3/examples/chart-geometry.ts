import { curveMonotoneX, line, max, scaleBand, scaleLinear } from 'd3'
import type { ReadingPoint } from './chart-policy'

export const HEIGHT = 280
export const MARGIN = { top: 24, right: 24, bottom: 46, left: 47 }
export function createGeometry(rows: readonly ReadingPoint[], measured: number) {
  const width = Math.max(240, measured)
  const x = scaleBand<string>()
    .domain(rows.map((row) => row.day))
    .range([MARGIN.left, width - MARGIN.right])
    .padding(0.26)
  const ceiling = max(rows.flatMap((row) => [row.views, row.saves]).filter(Number.isFinite)) ?? 1
  const y = scaleLinear()
    .domain([0, Math.max(10, ceiling * 1.15)])
    .range([HEIGHT - MARGIN.bottom, MARGIN.top])
    .nice()
  const center = (row: ReadingPoint) => (x(row.day) ?? MARGIN.left) + x.bandwidth() / 2
  return { width, height: HEIGHT, x, y, center }
}
export function createMetricPaths(
  rows: readonly ReadingPoint[],
  geometry: ReturnType<typeof createGeometry>,
) {
  return (['views', 'saves'] as const).map((key) => ({
    key,
    path: line<ReadingPoint>()
      .defined((row) => Number.isFinite(row[key]))
      .x(geometry.center)
      .y((row) => geometry.y(row[key]))
      .curve(curveMonotoneX)(rows),
  }))
}
