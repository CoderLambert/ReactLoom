import uPlot from 'uplot'

export type Level = 'basic' | 'business' | 'advanced'
export const START = Math.floor(Date.UTC(2026, 9, 26) / 1000)
export const WINDOW = 100

/** Local deterministic fixture; data retention is bounded before it reaches uPlot. */
export function createSeries(total: number, shift: number, level: Level): uPlot.AlignedData {
  const x: number[] = [],
    latency: Array<number | null> = [],
    errors: number[] = []
  const errorX: number[] = [],
    sparseErrors: number[] = []
  const begin = Math.max(0, total + shift - WINDOW)
  for (let i = begin; i < total + shift; i++) {
    const timestamp = START + i * 60
    const error = i % 11 === 0 ? 3 : i % 5 === 0 ? 1 : 0
    x.push(timestamp)
    latency.push(
      level === 'advanced' && i % 17 === 0
        ? null
        : Math.round(75 + Math.sin(i / 5) * 26 + (i % 9) * 5),
    )
    errors.push(error)
    if (i % 3 === 0) {
      errorX.push(timestamp)
      sparseErrors.push(error)
    }
  }
  if (level === 'basic') return [x, latency]
  if (level === 'advanced') return [x, latency, errors]
  // Genuine SDK join aligns a minute-level metric with a three-minute metric.
  // uPlot alignment artifacts are undefined; expose them explicitly as null, never as zero.
  const joined = uPlot.join([
    [x, latency],
    [errorX, sparseErrors],
  ])
  return [
    Array.from(joined[0]),
    Array.from(joined[1], (value) => value ?? null),
    Array.from(joined[2], (value) => value ?? null),
  ]
}
