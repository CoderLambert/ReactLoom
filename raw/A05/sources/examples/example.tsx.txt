import { useEffect, useMemo, useRef, useState } from 'react'
import {
  READING_FIXTURE as FIXTURE,
  measuredWidth,
  visibleSelection,
  visibleSeries,
} from './chart-policy'
import { clearChart, drawChart, type Level } from './draw-chart'
import './workshop.css'

type Props = { level: Level }
export default function D3Workshop({ level }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [width, setWidth] = useState(620)
  const [days, setDays] = useState(7)
  const [minimum, setMinimum] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [narrow, setNarrow] = useState(false)
  const [observation, setObservation] = useState<ReturnType<typeof drawChart> | null>(null)
  const points = useMemo(() => FIXTURE.slice(-days), [days])
  const visible = useMemo(() => visibleSeries(FIXTURE, days, minimum), [days, minimum])
  useEffect(() => {
    const element = host.current
    if (!element) return
    const observer = new ResizeObserver((entries) => {
      const next = measuredWidth(entries[0]?.contentRect.width ?? 0)
      if (next !== null) setWidth((previous) => (previous === next ? previous : next))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  // Keep joined nodes across redraws. Only component teardown releases the whole owned subtree.
  useEffect(() => {
    const element = svgRef.current
    return () => {
      if (element) clearChart(element)
    }
  }, [])
  useEffect(() => {
    const element = svgRef.current
    if (!element) return
    setObservation(drawChart(element, visible, width, level, selected, setSelected))
  }, [visible, width, level, selected])
  const highlighted = visibleSelection(visible, selected)
  return (
    <section className="a05-workshop" aria-label="D3 可视化实战" data-testid="a05-workshop">
      <h2>
        {level === 'basic'
          ? '比例尺、轴与柱的坐标'
          : level === 'business'
            ? '双指标折线与真实路径'
            : '按身份联结、筛选与重绘'}
      </h2>
      <p>
        React拥有控件、表格和空SVG容器；D3独占SVG内部的轴、图元与事件。本例7天原创数据，没有新闻接口或远程请求。
      </p>
      {level === 'advanced' && (
        <div className="demo-controls">
          <label>
            日期窗口{' '}
            <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
              <option value={3}>最近3天</option>
              <option value={5}>最近5天</option>
              <option value={7}>最近7天</option>
            </select>
          </label>
          <label>
            阅读阈值{' '}
            <input
              aria-label="阅读阈值"
              type="range"
              min="0"
              max="115"
              value={minimum}
              onChange={(event) => setMinimum(Number(event.target.value))}
            />
            {minimum}
          </label>
          <label>
            <input
              type="checkbox"
              checked={narrow}
              onChange={(event) => setNarrow(event.target.checked)}
            />
            使用窄面板
          </label>
          <button
            type="button"
            onClick={() => {
              setDays(7)
              setMinimum(0)
              setSelected(null)
            }}
          >
            恢复
          </button>
        </div>
      )}
      {level !== 'basic' && (
        <p>
          绿色：阅读数；橙色：收藏数。曲线使用curveMonotoneX，插值不是新增测量；阅读圆点可查看原始数据。
        </p>
      )}
      <div className="a05-frame" style={{ width: narrow ? '60%' : '100%' }}>
        <div ref={host} className="a05-chart-host">
          <svg
            ref={svgRef}
            role="img"
            aria-label="D3 新闻阅读数与收藏数趋势图"
            data-testid="a05-svg"
          />
        </div>
      </div>
      <p role="status" data-testid="a05-status">
        {highlighted
          ? `${selected}：阅读 ${highlighted.views}，收藏 ${highlighted.saves}`
          : visible.length === 0
            ? '当前筛选没有可绘制的数据'
            : selected
              ? '原选中日期不在当前绘制结果中'
              : '将指针移到图元上查看数据，或使用表格按钮选择'}
      </p>
      <p data-testid="a05-summary">
        日期窗口{points.length}项；实际绘制{visible.length}
        项。表格保留窗口内被阈值隐藏的数据，隐藏行不能选择。
      </p>
      <div className="a05-table-wrap">
        <table>
          <caption>可访问原始数据（含已过滤条目）</caption>
          <thead>
            <tr>
              <th scope="col">日期</th>
              <th scope="col">阅读</th>
              <th scope="col">收藏</th>
            </tr>
          </thead>
          <tbody>
            {points.map((row) => (
              <tr key={row.day}>
                <th scope="row">
                  <button
                    type="button"
                    disabled={!visible.some((point) => point.day === row.day)}
                    aria-pressed={selected === row.day}
                    onClick={() => setSelected(row.day)}
                  >
                    {row.day}
                  </button>
                </th>
                <td>{row.views}</td>
                <td>{row.saves}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details>
        <summary>查看比例尺、数据联结与真实SVG结果</summary>
        <p>
          domain/range/ticks来自D3比例尺；join计数来自真实enter/update/exit
          selection，marks/paths读取绘制后的SVG属性。选择或尺寸重绘也会产生update计数。
        </p>
        <pre data-testid="a05-observation">{JSON.stringify(observation, null, 2)}</pre>
      </details>
      <p>
        数据按本例唯一day联结，更新保留同一天节点；退出先interrupt并移除.a05命名空间事件，再remove。卸载才清空整张自有SVG并disconnect尺寸观察；没有动画或brush/zoom。
      </p>
    </section>
  )
}
