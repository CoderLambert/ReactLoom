import { useState } from 'react'
import { ambiguousFallback, calendarDayView, dailyWindow } from './calendar.mjs'
import { inspectWallTime, resolveWallTime, type WallCandidate } from './wall-time.mjs'
import './styles.css'

export { ambiguousFallback, dailyWindow, parseCalendarDay } from './calendar.mjs'

type Level = 'basic' | 'business' | 'advanced'
const zones = ['America/New_York', 'Asia/Shanghai', 'UTC'] as const
type Zone = (typeof zones)[number]

export default function LuxonWorkshop({ level }: { level: Level }) {
  const [civil, setCivil] = useState('2026-03-07')
  const [zone, setZone] = useState<Zone>('America/New_York')
  const [displayZone, setDisplayZone] = useState<Zone>('Asia/Shanghai')
  const [wall, setWall] = useState('2026-11-01T01:30')
  const [selectedOffset, setSelectedOffset] = useState('')
  const [candidates, setCandidates] = useState<WallCandidate[]>([])
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  function clearOutput() {
    setResult('')
    setError('')
    setCandidates([])
  }
  function chooseZone(value: string, setValue: (next: Zone) => void) {
    const next = zones.find((item) => item === value)
    if (next) {
      setValue(next)
      clearOutput()
    }
  }
  function presetDay(value: string) {
    setCivil(value)
    setZone('America/New_York')
    clearOutput()
  }
  function run() {
    clearOutput()
    try {
      let output: unknown
      if (level === 'basic') output = calendarDayView(civil, zone, displayZone)
      else if (level === 'business')
        output = {
          schedule: dailyWindow(civil, zone),
          note: '中午到次日中午；日历天+1不同于固定经过24小时，区间是[start,end)',
        }
      else {
        setCandidates(inspectWallTime(wall, 'America/New_York').candidates)
        output = {
          spring: dailyWindow('2026-03-07', 'America/New_York'),
          fall: dailyWindow('2026-10-31', 'America/New_York'),
          ambiguous: ambiguousFallback(),
          resolved: resolveWallTime(wall, 'America/New_York', selectedOffset || undefined),
        }
      }
      setResult(JSON.stringify(output, null, 2))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
    }
  }
  return (
    <section
      className="c16-workshop"
      aria-label="Luxon 时间区间与时区"
      data-testid="c16-workshop"
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? '显式时区的日期和同一瞬间'
          : level === 'business'
            ? '日历排程与经过小时'
            : 'DST 缺口与回拨选择'}
      </h2>
      <p>SDK读取宿主Intl/ICU规则，应用只定义输入和消歧策略；数据为固定本地排程，不访问服务端。</p>
      {level !== 'advanced' && (
        <div className="c16-controls">
          <label>
            日历日期{' '}
            <input
              aria-label="日历日期"
              value={civil}
              onChange={(event) => {
                setCivil(event.target.value)
                clearOutput()
              }}
            />
          </label>
          <label>
            时区{' '}
            <select
              aria-label="时区"
              value={zone}
              onChange={(event) => chooseZone(event.target.value, setZone)}
            >
              {zones.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          {level === 'basic' && (
            <label>
              显示时区{' '}
              <select
                aria-label="显示时区"
                value={displayZone}
                onChange={(event) => chooseZone(event.target.value, setDisplayZone)}
              >
                {zones.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          )}
          {level === 'business' && (
            <>
              <button type="button" onClick={() => presetDay('2026-03-07')}>
                纽约春季窗口
              </button>
              <button type="button" onClick={() => presetDay('2026-10-31')}>
                纽约秋季窗口
              </button>
              <button type="button" onClick={() => presetDay('2026-03-09')}>
                纽约普通窗口
              </button>
            </>
          )}
        </div>
      )}
      {level === 'advanced' && (
        <div className="c16-controls">
          <label>
            纽约本地时间{' '}
            <input
              aria-label="纽约本地时间"
              value={wall}
              onChange={(event) => {
                setWall(event.target.value)
                clearOutput()
              }}
            />
          </label>
          <label>
            显式 UTC 偏移{' '}
            <select
              aria-label="显式 UTC 偏移"
              value={selectedOffset}
              onChange={(event) => {
                setSelectedOffset(event.target.value)
                clearOutput()
              }}
            >
              <option value="">未选择（回拨必须拒绝）</option>
              <option value="-04:00">-04:00（先发生）</option>
              <option value="-05:00">-05:00（后发生）</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              setWall('2026-03-08T02:30')
              setSelectedOffset('')
              clearOutput()
            }}
          >
            模拟春季不存在的本地 02:30
          </button>
          <button
            type="button"
            onClick={() => {
              setWall('2026-11-01T01:30')
              setSelectedOffset('')
              clearOutput()
            }}
          >
            纽约回拨 01:30
          </button>
        </div>
      )}
      <button type="button" onClick={run}>
        使用 Luxon 运行
      </button>
      <p role="status" data-testid="c16-status">
        {error ? '输入被拒绝，请修正后重新运行' : result ? '已完成真实Luxon计算' : '当前输入待运行'}
      </p>
      {candidates.length > 0 && (
        <div>
          <h3>当前墙上时间的真实候选（尚不等于已保存）</h3>
          <pre data-testid="luxon-candidates">{JSON.stringify(candidates, null, 2)}</pre>
        </div>
      )}
      {error && (
        <p role="alert" data-testid="luxon-error">
          {error}
        </p>
      )}
      {result && <pre data-testid="luxon-result">{result}</pre>}
      <p>
        {level === 'basic'
          ? '日历日用所选时区的中午表示；普通setZone只改变显示，epoch保持相同。'
          : level === 'business'
            ? '区间含起点、不含终点。这里是中午窗口，不是自然日午夜边界。'
            : '不选偏移时仍可查看候选，但回拨时不会产生已解析结果；缺口回读不一致直接拒绝。'}
      </p>
      <output data-testid="c16-environment">
        {JSON.stringify({ luxon: '3.7.2', intl: Intl.DateTimeFormat().resolvedOptions() })}
      </output>
    </section>
  )
}
