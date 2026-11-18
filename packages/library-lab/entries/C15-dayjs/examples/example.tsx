import { useState } from 'react'
import {
  basicReport,
  civilWindow,
  strictDate,
  twoFallbackInstants,
  ZONES,
  type Zone,
} from './date-operations.mjs'
import { resolveExplicitZonedInstant } from './offset-instant.mjs'
import './styles.css'

export { civilWindow, strictDate, twoFallbackInstants }

type Level = 'basic' | 'business' | 'advanced'
export default function DayjsWorkshop({ level }: { level: Level }) {
  return <DayjsSession key={level} level={level} />
}
function DayjsSession({ level }: { level: Level }) {
  const [civil, setCivil] = useState('2026-03-07')
  const [zone, setZone] = useState<Zone>('America/New_York')
  const [eventInput, setEventInput] = useState('2026-11-01T01:30:00-04:00')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('尚未计算；当前是输入草稿')
  function clear() {
    setResult('')
    setError('')
    setStatus('输入已变更，请重新计算')
  }
  function selectEvent(value: string) {
    setEventInput(value)
    clear()
  }
  function reset() {
    setCivil('2026-03-07')
    setZone('America/New_York')
    setEventInput('2026-11-01T01:30:00-04:00')
    clear()
    setStatus('已重置当前目标，尚未计算')
  }
  function run() {
    try {
      const output =
        level === 'basic'
          ? basicReport(civil)
          : level === 'business'
            ? {
                window: civilWindow(civil, zone),
                note: '本地演示每日中午，不在浏览器注册生产定时任务',
              }
            : {
                spring: civilWindow('2026-03-07', 'America/New_York'),
                fall: civilWindow('2026-10-31', 'America/New_York'),
                fallback: twoFallbackInstants(),
                selectedEvent: resolveExplicitZonedInstant(eventInput, 'America/New_York'),
              }
      setResult(JSON.stringify(output, null, 2))
      setError('')
      setStatus('已用真实Day.js计算；结果对应当前输入')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setResult('')
      setStatus('已拒绝本次计算，没有保留旧结果')
    }
  }
  return (
    <section
      className="c15-workshop"
      aria-label="Day.js 官方插件实际运算"
      data-testid="c15-workshop"
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? '严格日期、不可变与中文显示'
          : level === 'business'
            ? 'RSS 订阅每日中午窗口'
            : '夏令时 23/25 小时与回拨歧义'}
      </h2>
      <p>utc、timezone、customParseFormat在模块顶层登记；时区由明确输入决定，语言只影响展示。</p>
      {level !== 'advanced' && (
        <div className="c15-controls">
          <label>
            日历日期{' '}
            <input
              aria-label="日历日期"
              value={civil}
              onChange={(event) => {
                setCivil(event.target.value)
                clear()
              }}
            />
          </label>
          {level === 'business' && (
            <label>
              IANA 时区{' '}
              <select
                aria-label="IANA 时区"
                value={zone}
                onChange={(event) => {
                  setZone(event.target.value as Zone)
                  clear()
                }}
              >
                {ZONES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
      {level === 'advanced' && (
        <div className="c15-controls">
          <label>
            纽约带偏移的绝对事件{' '}
            <input
              aria-label="纽约带偏移的绝对事件"
              value={eventInput}
              onChange={(event) => selectEvent(event.target.value)}
            />
          </label>
          <button type="button" onClick={() => selectEvent('2026-11-01T01:30:00-05:00')}>
            选择回拨后的 -05:00
          </button>
          <button type="button" onClick={() => selectEvent('2026-03-08T02:30:00-05:00')}>
            尝试春季不存在的 02:30
          </button>
        </div>
      )}
      <div className="c15-controls">
        <button type="button" onClick={run}>
          使用 Day.js 运行计算
        </button>
        <button type="button" onClick={reset}>
          重置当前目标
        </button>
      </div>
      <p role="status" data-testid="c15-status">
        {status}
      </p>
      <div className="c15-error">{error && <p role="alert">{error}</p>}</div>
      {result && <pre data-testid="dayjs-result">{result}</pre>}
      <p>
        {level === 'advanced'
          ? '回拨日两条01:30各有合法偏移；春季02:30即使可表示instant，也可能不属于纽约的真实墙上时间。'
          : '日历日、经过毫秒和本地化展示分别观察；没有注册cron、请求或持久化。'}
      </p>
    </section>
  )
}
