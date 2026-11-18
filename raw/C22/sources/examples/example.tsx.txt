import { useState } from 'react'
import {
  calendarReport,
  DISPLAY_ZONES,
  type DisplayZone,
  DST_FIXTURES,
  type FixtureId,
  instantReport,
  isDisplayZone,
  scheduleComparison,
} from './migration.mjs'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'

function Report({ value, testId }: { value: unknown; testId: string }) {
  return <pre data-testid={testId}>{JSON.stringify(value, null, 2)}</pre>
}

function CalendarDemo() {
  const [day, setDay] = useState('2026-11-01')
  const result = calendarReport(day)
  return (
    <>
      <h2>迁移日期字段：严格解析与不可变返回值</h2>
      <p>输入账单的日历日期，比较两套格式令牌，并观察加一天后原值是否变化。</p>
      <label>
        日历日期
        <input value={day} onChange={(event) => setDay(event.target.value)} maxLength={10} />
      </label>
      <div className="c22-actions">
        <button type="button" onClick={() => setDay('2026-02-30')}>
          试无效日期
        </button>
        <button type="button" onClick={() => setDay('2026-11-01')}>
          恢复有效日期
        </button>
      </div>
      {!result.valid && <p role="alert">{result.reason}</p>}
      <Report value={result} testId="calendar-report" />
      <p>
        UTC 只用于让日期校验避开操作系统时区，业务日继续保存为字符串。两套 SDK 都返回下一天，原
        Day.js 值保留。
      </p>
    </>
  )
}

function InstantDemo() {
  const [instant, setInstant] = useState('2026-11-01T05:30:00Z')
  const [zone, setZone] = useState<DisplayZone>('America/New_York')
  const result = instantReport(instant, zone)
  return (
    <>
      <h2>迁移发布时间：时间点与显示时区分开</h2>
      <p>同一时间点换地区只改变显示。回拨日两个 01:30 通过偏移保留各自身份。</p>
      <label>
        带偏移 ISO 时间点
        <input
          value={instant}
          onChange={(event) => setInstant(event.target.value)}
          maxLength={45}
        />
      </label>
      <label>
        显示时区
        <select
          value={zone}
          onChange={(event) => {
            if (isDisplayZone(event.target.value)) setZone(event.target.value)
          }}
        >
          {DISPLAY_ZONES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      <div className="c22-actions">
        <button type="button" onClick={() => setInstant('2026-11-01T01:30:00-04:00')}>
          回拨较早 01:30
        </button>
        <button type="button" onClick={() => setInstant('2026-11-01T01:30:00-05:00')}>
          回拨较晚 01:30
        </button>
        <button type="button" onClick={() => setInstant('2026-11-01T01:30:00')}>
          试缺少偏移
        </button>
      </div>
      {!result.valid && <p role="alert">{result.reason}</p>}
      <Report value={result} testId="instant-report" />
      <p>
        按钮里的日期是受控样例；偏移解析由 date-fns 执行，地区显示由浏览器 Intl
        执行，没有发布请求或服务端排程。
      </p>
    </>
  )
}

function DstDemo() {
  const [fixture, setFixture] = useState<FixtureId>('spring')
  const result = scheduleComparison(fixture)
  return (
    <>
      <h2>迁移排程：明天同一时刻与 24 小时后</h2>
      <p>起点固定在纽约中午。切换春季、秋季和普通日期，比较 addDays 与 addHours 的结果。</p>
      <label>
        纽约排程样例
        <select
          value={fixture}
          onChange={(event) => {
            const selected = DST_FIXTURES.find(({ id }) => id === event.target.value)
            if (selected) setFixture(selected.id)
          }}
        >
          {DST_FIXTURES.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <Report value={result} testId="dst-report" />
      <p>
        calendarNext 保住次日 12:00；elapsedNext 保住 24 个实际小时。TZDate 与函数的 in 参数共同指定
        IANA 时区。
      </p>
    </>
  )
}

export default function MomentMigrationExample({ level }: { level: Level }) {
  return (
    <section className="c22-workshop" aria-label="Moment 日期迁移工作坊">
      {level === 'basic' ? <CalendarDemo /> : level === 'business' ? <InstantDemo /> : <DstDemo />}
    </section>
  )
}
