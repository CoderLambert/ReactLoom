import type uPlot from 'uplot'
import type { Level } from './series-data'

export function createPlotOptions(
  width: number,
  level: Level,
  hooks: uPlot.Hooks.Arrays,
): uPlot.Options {
  return {
    width,
    height: 250,
    scales: { x: { time: true }, ...(level !== 'basic' ? { errors: { auto: true } } : {}) },
    axes: [
      {},
      { label: '耗时 / ms' },
      ...(level !== 'basic' ? [{ scale: 'errors', side: 1 as const, label: '错误数' }] : []),
    ],
    series: [
      {},
      { label: '延迟', stroke: '#257653', width: 2, spanGaps: false },
      ...(level !== 'basic'
        ? [
            {
              label: '错误数',
              scale: 'errors',
              stroke: '#b65e27',
              width: 1.5,
              spanGaps: false,
              ...(level === 'business' ? { points: { show: true, size: 5 } } : {}),
            },
          ]
        : []),
    ],
    hooks,
  }
}
