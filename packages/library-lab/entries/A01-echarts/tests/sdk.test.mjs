import test from 'node:test';
import assert from 'node:assert/strict';
import {init, use} from 'echarts/core';
import {BarChart, LineChart} from 'echarts/charts';
import {GridComponent, TooltipComponent} from 'echarts/components';
import {SVGRenderer} from 'echarts/renderers';

// An actual ECharts SSR renderer: this suite does not fake echarts or a canvas.
// Browser ResizeObserver, keyboard and disposal behavior are separate Playwright gates.
use([BarChart, LineChart, GridComponent, TooltipComponent, SVGRenderer]);

test('A01 real ECharts SVG renderer creates, updates and disposes an instance', () => {
  const chart = init(null, undefined, {renderer: 'svg', ssr: true, width: 640, height: 360});
  try {
    chart.setOption({
      animation: false,
      xAxis: {type: 'category', data: ['Mon', 'Tue']},
      yAxis: {type: 'value'},
      series: [{type: 'bar', data: [12, 20]}],
    });
    const svg = chart.renderToSVGString();
    assert.match(svg, /<svg\b/u);
    assert.deepEqual(chart.getOption().series[0].data, [12, 20]);

    chart.setOption({series: [{type: 'bar', data: [14, 23]}]});
    assert.deepEqual(chart.getOption().series[0].data, [14, 23]);
    assert.match(chart.renderToSVGString(), /<svg\b/u);
  } finally {
    chart.dispose();
  }
  assert.equal(chart.isDisposed(), true);
});
