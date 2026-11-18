import type { BarSeriesOption, LineSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  LegendComponentOption,
  TitleComponentOption,
  TooltipComponentOption,
} from 'echarts/components'
import type { ComposeOption } from 'echarts/core'

export type ReadingLevel = 'basic' | 'business' | 'advanced'
export type ReadingChartOption = ComposeOption<
  | BarSeriesOption
  | LineSeriesOption
  | GridComponentOption
  | LegendComponentOption
  | TitleComponentOption
  | TooltipComponentOption
>

export const labels = Object.freeze(['周一', '周二', '周三', '周四', '周五', '周六', '周日'])
export const baseline = Object.freeze([12, 20, 15, 28, 22, 34, 27])
export const previous = Object.freeze([9, 13, 18, 23, 19, 25, 22])

/** The same data-to-option mapping is used by the React chart and the real SDK checks. */
export function buildReadingOption({
  level,
  values,
  showPrevious,
  reducedMotion,
  allowMotion,
}: {
  level: ReadingLevel
  values: readonly number[]
  showPrevious: boolean
  reducedMotion: boolean
  allowMotion: boolean
}): ReadingChartOption {
  const animate = !reducedMotion || allowMotion
  const current: BarSeriesOption | LineSeriesOption =
    level === 'advanced'
      ? {
          id: 'current-reads',
          name: '阅读量',
          type: 'line',
          smooth: true,
          data: [...values],
          itemStyle: { color: '#36715a' },
          areaStyle: { opacity: 0.12 },
        }
      : {
          id: 'current-reads',
          name: level === 'business' ? '本周' : '阅读量',
          type: 'bar',
          data: [...values],
          itemStyle: { color: '#36715a' },
        }
  const series: (BarSeriesOption | LineSeriesOption)[] = [current]
  if (level === 'business' && showPrevious) {
    series.push({
      id: 'previous-reads',
      name: '上周',
      type: 'line',
      smooth: true,
      data: [...previous],
      lineStyle: { color: '#a36c27' },
      itemStyle: { color: '#a36c27' },
    })
  }
  return {
    animation: animate,
    animationDuration: animate ? 280 : 0,
    animationDurationUpdate: animate ? 280 : 0,
    title: {
      text: level === 'basic' ? '近七日文章阅读' : '订阅内容阅读趋势',
      left: 10,
      textStyle: { fontSize: 15 },
    },
    tooltip: { trigger: 'axis', confine: true },
    legend: { show: level === 'business', bottom: 0 },
    grid: { left: 42, right: 22, top: 66, bottom: level === 'business' ? 64 : 35 },
    xAxis: { type: 'category', data: [...labels], axisLabel: { interval: 0 } },
    yAxis: { type: 'value', min: 0 },
    series,
  }
}
