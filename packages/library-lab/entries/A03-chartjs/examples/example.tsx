import { BarElement, Chart, type Plugin, PointElement } from 'chart.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type ChartKind, createReadingConfig, READING_DAYS } from './chart-model'
import { chartCounts, MAX_REVISION, nextRevision, shouldAutoSample } from './chart-stream-policy'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
type Observation = {
  chartId: string
  type: string
  width: number
  height: number
  data: unknown[]
  active: number[]
  centers: { index: number; x: number | null; y: number | null }[]
  created: number
  destroyed: number
  updates: number
}

export default function ChartJsExample({ level }: { level: Level }) {
  const [kind, setKind] = useState<ChartKind>('bar')
  const [revision, setRevision] = useState(0)
  const [autoSample, setAutoSample] = useState(false)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [narrow, setNarrow] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [allowMotion, setAllowMotion] = useState(false)
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  )
  const [observation, setObservation] = useState<Observation | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart<ChartKind, number[], string> | null>(null)
  const mounted = useRef(false)
  const lifecycle = useRef({ created: 0, destroyed: 0, updates: 0 })
  const counts = useMemo(() => chartCounts(revision), [revision])
  const currentCounts = useRef(counts)
  currentCounts.current = counts
  const effectiveKind: ChartKind = level === 'advanced' ? kind : 'bar'

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    const updateVisibility = () => setTabVisible(document.visibilityState === 'visible')
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(media.matches)
    updateMotion()
    media.addEventListener('change', updateMotion)
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility)
      media.removeEventListener('change', updateMotion)
    }
  }, [])
  useEffect(() => {
    if (!shouldAutoSample(autoSample, level, tabVisible, revision, reducedMotion, allowMotion))
      return
    const timer = window.setInterval(() => setRevision(nextRevision), 400)
    return () => window.clearInterval(timer)
  }, [autoSample, level, tabVisible, revision, reducedMotion, allowMotion])

  const publish = useCallback((chart: Chart<ChartKind>) => {
    if (!mounted.current) return
    setObservation({
      chartId: String(chart.id),
      type: chart.getDatasetMeta(0).type,
      width: chart.width,
      height: chart.height,
      data: [...chart.data.datasets[0].data],
      active: chart.getActiveElements().map((item) => item.index),
      centers: chart
        .getDatasetMeta(0)
        .data.flatMap((element, index) =>
          element instanceof BarElement || element instanceof PointElement
            ? [{ index, ...element.getCenterPoint() }]
            : [],
        ),
      ...lifecycle.current,
    })
  }, [])
  const observationPlugin = useMemo<Plugin<ChartKind>>(
    () => ({
      id: 'a03-observe-owned-chart',
      afterInit() {
        lifecycle.current.created++
      },
      afterUpdate(chart) {
        lifecycle.current.updates++
        publish(chart)
      },
      afterDestroy() {
        lifecycle.current.destroyed++
      },
    }),
    [publish],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    // Type owns the construction lifetime; data updates below reuse this instance.
    const chart = new Chart(
      context,
      createReadingConfig(
        effectiveKind,
        currentCounts.current,
        {
          onClick: (_event, elements) => {
            const index = elements[0]?.index
            if (typeof index === 'number' && index >= 0 && index < READING_DAYS.length)
              setSelectedDay(index)
          },
        },
        [observationPlugin],
      ),
    )
    chartRef.current = chart
    return () => {
      if (chartRef.current === chart) chartRef.current = null
      chart.destroy()
    }
  }, [effectiveKind, observationPlugin])
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || chart.getDatasetMeta(0).type !== effectiveKind) return
    chart.data.datasets[0].data = [...counts]
    chart.update('none')
  }, [counts, effectiveKind])
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || chart.getDatasetMeta(0).type !== effectiveKind) return
    chart.setActiveElements(selectedDay === null ? [] : [{ datasetIndex: 0, index: selectedDay }])
    chart.update('none')
  }, [selectedDay, effectiveKind])

  return (
    <section
      className="a03-workshop"
      aria-label="Chart.js 真实 Canvas 示例"
      data-testid="a03-workshop"
    >
      <h2>
        {level === 'basic'
          ? '注册组件、绘制与选择'
          : level === 'business'
            ? '复用实例更新统计'
            : '类型、尺寸与实例所有权'}
      </h2>
      <p>
        真实Chart.js绘制本地七日阅读量。React拥有业务数字与选择，SDK拥有Canvas图形；下面表格提供同一份精确数据。
      </p>
      <div className="a03-controls">
        <button
          type="button"
          disabled={revision >= MAX_REVISION}
          onClick={() => setRevision(nextRevision)}
        >
          模拟新增阅读
        </button>
        {level === 'advanced' && (
          <>
            <label>
              <input
                type="checkbox"
                checked={autoSample}
                onChange={(event) => setAutoSample(event.currentTarget.checked)}
              />
              自动采样（400ms，后台暂停）
            </label>
            {reducedMotion && (
              <label>
                <input
                  type="checkbox"
                  checked={allowMotion}
                  onChange={(event) => setAllowMotion(event.currentTarget.checked)}
                />
                允许自动变化
              </label>
            )}
            <label>
              图形类型
              <select
                aria-label="选择图形类型"
                value={kind}
                onChange={(event) => setKind(event.currentTarget.value === 'line' ? 'line' : 'bar')}
              >
                <option value="bar">柱形</option>
                <option value="line">折线</option>
              </select>
            </label>
            <button type="button" onClick={() => setNarrow((value) => !value)}>
              {narrow ? '恢复容器宽度' : '缩窄图表容器'}
            </button>
            <button type="button" onClick={() => chartRef.current?.resize()}>
              重新测量尺寸
            </button>
          </>
        )}
        <output aria-live="polite" data-testid="a03-total">
          七日总阅读：{counts.reduce((a, b) => a + b, 0)}
        </output>
        <output data-testid="a03-selection">
          {selectedDay === null
            ? '可点选图形或使用下方表格按钮'
            : `${READING_DAYS[selectedDay]}：${counts[selectedDay]} 次阅读`}
        </output>
      </div>
      {level === 'advanced' && (
        <p>
          更新动画始终关闭；系统减少动态效果：{reducedMotion ? '是（默认暂停自动采样）' : '否'}
          。自动采样需要显式勾选，最高revision {MAX_REVISION}。
        </p>
      )}
      <div
        className="a03-chart-container"
        data-testid="a03-chart-container"
        style={{ width: narrow ? '70%' : '100%' }}
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="七日阅读量趋势 Canvas 图，下方表格提供精确数字"
          data-testid="a03-canvas"
        />
      </div>
      <div className="a03-table-wrap">
        <table>
          <caption>Canvas 图表等价数据表</caption>
          <thead>
            <tr>
              <th scope="col">日期</th>
              {READING_DAYS.map((day) => (
                <th scope="col" key={day}>
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">阅读数</th>
              {counts.map((count, i) => (
                <td key={READING_DAYS[i]}>
                  <button
                    type="button"
                    aria-label={`选中${READING_DAYS[i]}的阅读量 ${count}`}
                    aria-pressed={selectedDay === i}
                    onClick={() => setSelectedDay(i)}
                  >
                    {count}
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <details>
        <summary>查看真实实例和绘制结果</summary>
        <p>
          下面来自SDK实例/元素和实际plugin回调。计数是本例观察，不是SDK公开资源计数；centers是Canvas坐标，浏览器点击时需换算DOM尺寸。
        </p>
        <pre data-testid="a03-sdk-state">
          {observation ? JSON.stringify(observation, null, 2) : '尚未创建图表'}
        </pre>
      </details>
      <p>
        柱线切换先destroy再创建；数字变化复用实例update。容器大小由SDK响应式跟踪，不额外创建ResizeObserver；停止卸载销毁本例Chart及采样/媒体监听。
      </p>
    </section>
  )
}
