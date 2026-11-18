import assert from 'node:assert/strict'
import test from 'node:test'
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { init, use, version } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { baseline, buildReadingOption, labels, previous } from '../examples/reading-option.ts'
import { advanceReadingCounts } from '../examples/stream-policy.ts'

// Real SSR rendering shares the Demo option builder. Canvas, observer and UI remain browser gates.
use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  SVGRenderer,
])
const option = (level, extra = {}) =>
  buildReadingOption({
    level,
    values: baseline,
    showPrevious: true,
    reducedMotion: true,
    allowMotion: false,
    ...extra,
  })
function withChart(run) {
  const chart = init(null, undefined, { renderer: 'svg', ssr: true, width: 640, height: 360 })
  try {
    run(chart)
  } finally {
    chart.dispose()
  }
  assert.equal(chart.isDisposed(), true)
}

test('A01 real 6.1.0 renders the shared axes and bar data, then updates the same instance', () => {
  assert.equal(version, '6.1.0')
  withChart((chart) => {
    chart.setOption(option('basic'), { notMerge: true })
    const id = chart.id
    assert.match(chart.renderToSVGString(), /<svg\b/u)
    assert.deepEqual(chart.getOption().xAxis[0].data, [...labels])
    assert.equal(chart.getOption().yAxis[0].type, 'value')
    assert.equal(chart.getOption().series[0].type, 'bar')
    assert.deepEqual(chart.getOption().series[0].data, [...baseline])
    const updated = baseline.map((value, index) => (index === 0 ? value + 5 : value))
    chart.setOption(option('basic', { values: updated }), { notMerge: true })
    assert.equal(chart.id, id)
    assert.deepEqual(chart.getOption().series[0].data, updated)
  })
})

test('A01 business removes and restores the previous series with the Demo full replacement strategy', () => {
  withChart((chart) => {
    chart.setOption(option('business'), { notMerge: true })
    assert.deepEqual(
      chart.getOption().series.map((series) => series.id),
      ['current-reads', 'previous-reads'],
    )
    assert.deepEqual(chart.getOption().series[1].data, [...previous])
    chart.setOption(option('business', { showPrevious: false }), { notMerge: true })
    assert.deepEqual(
      chart.getOption().series.map((series) => series.id),
      ['current-reads'],
    )
    chart.setOption(option('business'), { notMerge: true })
    assert.equal(chart.getOption().series.length, 2)
    assert.match(chart.renderToSVGString(), /<svg\b/u)
  })
})

test('A01 advanced uses real line updates and resize; reduced motion disables animation', () => {
  withChart((chart) => {
    const values = advanceReadingCounts(baseline, 0)
    chart.setOption(option('advanced', { values }), { notMerge: true })
    assert.equal(chart.getOption().animation, false)
    assert.equal(chart.getOption().series[0].type, 'line')
    assert.deepEqual(chart.getOption().series[0].data, [15, ...baseline.slice(1)])
    chart.resize({ width: 320, height: 300 })
    assert.equal(chart.getWidth(), 320)
    assert.equal(chart.getHeight(), 300)
    assert.match(chart.renderToSVGString(), /width="320"/u)
  })
})
