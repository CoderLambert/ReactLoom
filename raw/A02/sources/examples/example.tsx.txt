import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MAX_REVISION, nextRevision, normalizeWindow, sampleRows } from './chart-policy'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'

export default function RechartsExample({ level }: { level: Level }) {
  const [count, setCount] = useState(7)
  const [windowDraft, setWindowDraft] = useState('7')
  const [revision, setRevision] = useState(0)
  const [showRate, setShowRate] = useState(true)
  const isBasic = level === 'basic'
  const rows = useMemo(
    () => sampleRows(level === 'advanced' ? count : 7, revision),
    [level, count, revision],
  )
  const total = rows.reduce((sum, row) => sum + row.reads, 0)

  return (
    <section
      className="a02-workshop"
      aria-label="Recharts 真实图表示例"
      data-testid="a02-workshop"
      data-level={level}
      data-revision={revision}
      data-window={rows.length}
      data-show-rate={showRate}
    >
      <h2>
        {isBasic
          ? '七天阅读量分布'
          : level === 'business'
            ? '阅读、收藏与收藏率'
            : '窗口、单位与数据边界'}
      </h2>
      <p>本地确定性教学数据；图表和数据表读取同一 rows，不代表在线业务统计。</p>
      <fieldset className="a02-controls">
        <legend>图表数据与显示</legend>
        <button
          type="button"
          onClick={() => setRevision(nextRevision)}
          disabled={revision >= MAX_REVISION}
        >
          增加阅读数据
        </button>
        {level === 'advanced' && (
          <>
            <label>
              窗口天数
              <input
                type="number"
                min={3}
                max={14}
                step={1}
                value={windowDraft}
                onChange={(event) => {
                  const text = event.currentTarget.value
                  setWindowDraft(text)
                  if (/^\d+$/.test(text)) setCount(normalizeWindow(Number(text)))
                }}
                onBlur={() => setWindowDraft(String(count))}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={showRate}
                onChange={(event) => setShowRate(event.target.checked)}
              />
              显示收藏率
            </label>
          </>
        )}
      </fieldset>
      <p role="status" data-testid="a02-status">
        当前 {rows.length} 天 · 数据轮次 {revision} / {MAX_REVISION} · 合计阅读{' '}
        <output data-testid="a02-total">{total}</output> 次
        {revision >= MAX_REVISION ? ' · 已达到演示数据上限' : ''}
      </p>
      <div className="a02-chart" aria-hidden="true" data-testid="a02-chart">
        <ResponsiveContainer width="100%" height="100%" debounce={60}>
          {isBasic ? (
            <BarChart data={rows} accessibilityLayer={false}>
              <CartesianGrid strokeDasharray="3 4" stroke="#e0e6dc" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar
                className="a02-reads"
                dataKey="reads"
                name="阅读量"
                fill="#38795b"
                maxBarSize={42}
                isAnimationActive="auto"
              />
            </BarChart>
          ) : (
            <ComposedChart data={rows} accessibilityLayer={false}>
              <CartesianGrid strokeDasharray="3 4" stroke="#e0e6dc" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="count" allowDecimals={false} />
              {showRate && (
                <YAxis
                  className="a02-percentage-axis"
                  yAxisId="percentage"
                  orientation="right"
                  domain={[0, 100]}
                  unit="%"
                />
              )}
              <Tooltip />
              <Legend />
              <Bar
                className="a02-reads"
                dataKey="reads"
                yAxisId="count"
                name="阅读量"
                fill="#38795b"
                maxBarSize={36}
                isAnimationActive="auto"
              />
              <Bar
                className="a02-saved"
                dataKey="saved"
                yAxisId="count"
                name="收藏量"
                fill="#ca9258"
                maxBarSize={30}
                isAnimationActive="auto"
              />
              {showRate && (
                <Line
                  className="a02-rate"
                  type="monotone"
                  dataKey="rate"
                  yAxisId="percentage"
                  name="收藏率"
                  unit="%"
                  stroke="#6e7cb5"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive="auto"
                />
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="a02-table-scroll">
        <table data-testid="a02-table">
          <caption>图表同源数据表（收藏率曲线关闭后，表中仍保留原始指标）</caption>
          <thead>
            <tr>
              <th scope="col">星期</th>
              <th scope="col">阅读</th>
              <th scope="col">收藏</th>
              <th scope="col">收藏率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.day} data-day={row.day}>
                <th scope="row">{row.day}</th>
                <td>{row.reads}</td>
                <td>{row.saved}</td>
                <td>{row.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="a02-note">
        图形作为视觉视图隐藏于辅助技术，同时关闭 SDK 的图表键盘层，避免隐藏 SVG 留下焦点。
        所有数值可通过上方语义数据表读取；筛选控件使用原生键盘交互。Tooltip 保留鼠标查看。
      </p>
      <p className="a02-note">
        动画使用 Recharts 3.10.1 的 auto
        门禁，跟随系统减少动态偏好。停止或离开会卸载图表；数据不会持久化。
      </p>
    </section>
  )
}
