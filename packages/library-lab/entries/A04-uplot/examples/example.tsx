import { useEffect, useMemo, useRef, useState } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { createPlotOptions } from './chart-options'
import { createSeries, type Level, WINDOW } from './series-data'
import { shouldRunStream } from './stream-policy'
import './workshop.css'

type Observation = {
  instance: number
  dataEvents: number
  sizeEvents: number
  seriesEvents: number
  width: number
  height: number
  points: number
  firstX: number | undefined
  lastX: number | undefined
  errorsVisible: boolean | null
  seriesScales: Array<string | undefined>
  axisScales: Array<string | undefined>
  axisSides: Array<number | undefined>
}

function TelemetryChart({
  data,
  level,
  showErrors,
}: {
  data: uPlot.AlignedData
  level: Level
  showErrors: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const plot = useRef<uPlot | null>(null)
  const instanceSequence = useRef(0)
  const [observation, setObservation] = useState<Observation | null>(null)
  const [actualData, setActualData] = useState<Array<Array<number | null | undefined>> | null>(null)
  // biome-ignore lint/correctness/useExhaustiveDependencies: structural changes rebuild; a separate effect handles every data update.
  useEffect(() => {
    const element = host.current
    if (!element) return
    let animationFrame = 0
    const instanceId = ++instanceSequence.current
    let dataEvents = 0,
      sizeEvents = 0,
      seriesEvents = 0
    function observe(self: uPlot) {
      const x = self.data[0]
      setObservation({
        instance: instanceId,
        dataEvents,
        sizeEvents,
        seriesEvents,
        width: self.width,
        height: self.height,
        points: x.length,
        firstX: x[0],
        lastX: x[x.length - 1],
        errorsVisible: level === 'basic' ? null : self.series[2].show !== false,
        seriesScales: self.series.map((series) => series.scale),
        axisScales: self.axes.map((axis) => axis.scale),
        axisSides: self.axes.map((axis) => axis.side),
      })
      // Copy real columns; JSON renders missing entries as null, never numerical zero.
      setActualData(self.data.map((column) => Array.from(column)))
    }
    const options = createPlotOptions(Math.max(280, Math.floor(element.clientWidth)), level, {
      setData: [
        (self) => {
          dataEvents++
          observe(self)
        },
      ],
      setSize: [
        (self) => {
          sizeEvents++
          observe(self)
        },
      ],
      setSeries: [
        (self) => {
          seriesEvents++
          observe(self)
        },
      ],
      ready: [observe],
      destroy: [
        () => {
          element.dataset.uplotDestroyed = 'true'
        },
      ],
    })
    element.dataset.uplotDestroyed = 'false'
    const instance = new uPlot(options, data, element)
    plot.current = instance
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => {
        if (plot.current !== instance) return
        const width = Math.max(280, Math.floor(element.clientWidth))
        if (width !== instance.width) instance.setSize({ width, height: 250 })
      })
    })
    observer.observe(element)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(animationFrame)
      instance.destroy()
      if (plot.current === instance) plot.current = null
    }
  }, [level])
  // Replacing the bounded snapshot is a real SDK update, not an append API or a rebuild.
  useEffect(() => {
    plot.current?.setData(data)
  }, [data])
  useEffect(() => {
    if (level !== 'basic') plot.current?.setSeries(2, { show: showErrors })
  }, [showErrors, level])
  return (
    <>
      <div
        ref={host}
        role="img"
        aria-label="uPlot 时间序列走势（下方表格提供等价数据）"
        className="a04-plot"
        data-testid="a04-plot"
      />
      <p data-testid="a04-sdk-summary">
        {observation
          ? `SDK当前 ${observation.points} 点；尺寸 ${observation.width}×${observation.height}；setData钩子 ${observation.dataEvents} 次`
          : '等待真实uPlot初始化'}
      </p>
      <details>
        <summary>查看真实SDK数据与生命周期观察</summary>
        <pre data-testid="a04-plot-stats">{JSON.stringify(observation, null, 2)}</pre>
        <pre data-testid="a04-series-json">{JSON.stringify(actualData, null, 2)}</pre>
      </details>
    </>
  )
}

export default function UplotExample({ level }: { level: Level }) {
  const [samples, setSamples] = useState(28)
  const [shift, setShift] = useState(0)
  const [stream, setStream] = useState(false)
  const [narrow, setNarrow] = useState(false)
  const [showErrors, setShowErrors] = useState(true)
  const [overrideReducedMotion, setOverrideReducedMotion] = useState(false)
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible',
  )
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    if (level !== 'advanced') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncVisibility = () => setVisible(document.visibilityState === 'visible')
    const syncReducedMotion = () => setReducedMotion(media.matches)
    syncVisibility()
    syncReducedMotion()
    document.addEventListener('visibilitychange', syncVisibility)
    media.addEventListener('change', syncReducedMotion)
    return () => {
      document.removeEventListener('visibilitychange', syncVisibility)
      media.removeEventListener('change', syncReducedMotion)
    }
  }, [level])
  const canStream = shouldRunStream({
    advanced: level === 'advanced',
    requested: stream,
    visible,
    reducedMotion,
    overrideReducedMotion,
  })
  // biome-ignore lint/correctness/useExhaustiveDependencies: changing level resets scenario-owned controls.
  useEffect(() => {
    setSamples(28)
    setShift(0)
    setStream(false)
    setShowErrors(true)
  }, [level])
  useEffect(() => {
    if (!canStream) return
    const timer = window.setInterval(() => setShift((value) => value + 1), 650)
    return () => window.clearInterval(timer)
  }, [canStream])
  const data = useMemo(() => createSeries(samples, shift, level), [samples, shift, level])
  const count = data[0].length
  return (
    <section className="a04-workshop" aria-label="uPlot 实时数据示例" data-testid="a04-workshop">
      <h2>
        {level === 'basic'
          ? '列式数据、Unix秒与Canvas'
          : level === 'business'
            ? '不同采样频率与两个单位'
            : '有界窗口、暂停与销毁'}
      </h2>
      <p>
        真实uPlot负责Canvas绘制；应用生成本地数据和最多100点的快照，没有遥测HTTP服务。setData替换整批列，不是SDK自动采样或自动限内存。
      </p>
      <div className="demo-controls">
        <label>
          采样数量{' '}
          <select
            aria-label="采样数量"
            value={samples}
            onChange={(event) => setSamples(Number(event.target.value))}
          >
            {[28, 60, 100].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={narrow}
            onChange={(event) => setNarrow(event.target.checked)}
          />
          使用窄面板
        </label>
        {level === 'business' && (
          <label>
            <input
              type="checkbox"
              checked={showErrors}
              onChange={(event) => setShowErrors(event.target.checked)}
            />
            显示错误数
          </label>
        )}
        {level === 'advanced' && (
          <>
            <button
              type="button"
              disabled={canStream}
              onClick={() => setShift((value) => value + 1)}
            >
              追加1个采样
            </button>
            <button
              type="button"
              disabled={canStream}
              onClick={() => setShift((value) => value + 10)}
            >
              追加10个采样
            </button>
            <button type="button" onClick={() => setStream((value) => !value)}>
              {stream ? '暂停模拟采样' : '开始模拟采样'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStream(false)
                setShift(0)
              }}
            >
              清空增量并重置
            </button>
            <label>
              <input
                type="checkbox"
                checked={overrideReducedMotion}
                onChange={(event) => setOverrideReducedMotion(event.target.checked)}
              />
              明确允许在减少动态偏好下采样
            </label>
          </>
        )}
      </div>
      {level === 'advanced' && stream && !canStream && (
        <p role="status">
          采样已暂停：{!visible ? '页面位于后台' : '遵循系统减少动态偏好'}
          。返回可见页面或明确覆盖偏好后会恢复。
        </p>
      )}
      <p data-testid="a04-data-summary">
        应用保留 {count} 点/列；上限 {WINDOW}；增量 {shift}；首/末Unix秒 {data[0][0]} /{' '}
        {data[0][count - 1]}
      </p>
      {level === 'business' && (
        <p>
          延迟每分钟采样，错误数每3分钟采样；真实uPlot.join合并X，未测错误数是null而不是0。两指标分别使用ms和计数轴。
        </p>
      )}
      <div className="a04-frame" style={{ width: narrow ? 320 : '100%' }}>
        <TelemetryChart data={data} level={level} showErrors={showErrors} />
      </div>
      <p role="status">
        当前数据点 {count}；窗口上限 {WINDOW}；最后时间戳{' '}
        {new Date(data[0][count - 1] * 1000).toISOString()}
      </p>
      <div className="a04-table-scroll">
        <table>
          <caption>最近五个采样（UTC；Canvas的文字替代）</caption>
          <thead>
            <tr>
              <th scope="col">采样时间</th>
              <th scope="col">延迟 (ms)</th>
              {level !== 'basic' && <th scope="col">错误数</th>}
            </tr>
          </thead>
          <tbody>
            {Array.from(data[0].slice(-5)).map((timestamp, index) => {
              const columnIndex = count - Math.min(5, count) + index
              return (
                <tr key={timestamp}>
                  <td>{new Date(timestamp * 1000).toISOString().slice(11, 19)}</td>
                  <td>{data[1][columnIndex] ?? '缺失'}</td>
                  {level !== 'basic' && <td>{data[2][columnIndex] ?? '缺失'}</td>}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {level === 'advanced' && (
        <p>
          缺测null不等于0。100点只是应用数据保留上限，不是整个页面的内存字节上限；Canvas/DPR、临时数组和库缓存另占内存。
        </p>
      )}
    </section>
  )
}
