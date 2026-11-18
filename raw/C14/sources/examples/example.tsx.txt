import { useId, useState } from 'react'
import {
  calculateDateResult,
  DEFAULT_INPUT,
  isZone,
  type Level,
  ZONES,
  type Zone,
} from './date-contract'
import './styles.css'

export { parseCivilDate, parseInstant, planCivilDays } from './date-contract'
export type Props = { level: Level }

export default function DateFnsExample({ level }: Props) {
  return <DateSession key={level} level={level} />
}

function DateSession({ level }: Props) {
  const civilId = useId()
  const zoneId = useId()
  const countId = useId()
  const instantId = useId()
  const [civil, setCivil] = useState(DEFAULT_INPUT.civil)
  const [zone, setZone] = useState<Zone>(DEFAULT_INPUT.zone)
  const [count, setCount] = useState(DEFAULT_INPUT.count)
  const [instant, setInstant] = useState(DEFAULT_INPUT.instant)
  const [result, setResult] = useState<ReturnType<typeof calculateDateResult> | null>(null)
  const [error, setError] = useState('')

  function clearOutput() {
    setResult(null)
    setError('')
  }
  function calculate() {
    try {
      setResult(calculateDateResult(level, { civil, zone, count, instant }))
      setError('')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : String(failure))
      setResult(null)
    }
  }
  function reset() {
    setCivil(DEFAULT_INPUT.civil)
    setZone(DEFAULT_INPUT.zone)
    setCount(DEFAULT_INPUT.count)
    setInstant(DEFAULT_INPUT.instant)
    clearOutput()
  }

  return (
    <section
      className="c14-workshop"
      aria-label="date-fns 真实时区演示"
      data-testid="c14-workshop"
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? '严格日历日与目标时区中午'
          : level === 'business'
            ? '日历排程与经过小时'
            : 'DST 对照与明确事件瞬间'}
      </h2>
      <p>
        真实 date-fns 4.4.0 + @date-fns/tz 1.5.0；日历日、IANA 时区与 instant
        各有合同，输出不取设备默认时区。
      </p>
      {level !== 'advanced' && (
        <div className="c14-controls">
          <p>本例日历范围 1901–9999 年；历史秒级偏移另需专门验证。</p>
          <label htmlFor={civilId}>日历日期</label>
          <input
            id={civilId}
            value={civil}
            maxLength={10}
            placeholder="YYYY-MM-DD"
            onChange={(event) => {
              setCivil(event.currentTarget.value)
              clearOutput()
            }}
          />
          <label htmlFor={zoneId}>IANA 时区</label>
          <select
            id={zoneId}
            value={zone}
            onChange={(event) => {
              const next = event.currentTarget.value
              if (isZone(next)) {
                setZone(next)
                clearOutput()
              }
            }}
          >
            {ZONES.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          {level === 'business' && (
            <>
              <label htmlFor={countId}>增加天数</label>
              <select
                id={countId}
                value={count}
                onChange={(event) => {
                  setCount(Number(event.currentTarget.value))
                  clearOutput()
                }}
              >
                {[1, 2, 3, 7, 14].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      )}
      {level === 'advanced' && (
        <>
          <p>
            DST 对照固定为纽约的中午到次日中午；下面的事件输入只决定
            instantUTC，不受其他场景的草稿影响。
          </p>
          <label htmlFor={instantId}>绝对事件时间</label>
          <input
            id={instantId}
            className="c14-instant"
            value={instant}
            maxLength={35}
            onChange={(event) => {
              setInstant(event.currentTarget.value)
              clearOutput()
            }}
          />
          <p>删除末尾 -04:00 必须拒绝；改成 -05:00 会选择另一个 01:30，二者相隔一小时。</p>
        </>
      )}
      <div className="c14-controls">
        <button type="button" onClick={calculate}>
          运行日期计算
        </button>
        <button type="button" onClick={reset}>
          重置当前计算
        </button>
      </div>
      <p role="status" data-testid="c14-status">
        {error
          ? '计算失败，请修正输入'
          : result
            ? '计算成功：以下为当前输入的真实 SDK 返回值'
            : '等待计算；输入变化后需重新运行'}
      </p>
      {error && (
        <p role="alert" data-testid="c14-error">
          {error}
        </p>
      )}
      {result && <pre data-testid="date-result">{JSON.stringify(result, null, 2)}</pre>}
      <p>
        纯同步计算，没有定时器、任务调度、后端或网络请求；重置/切场景清本轮结果。程序输入不等于真实操作系统输入法验收。
      </p>
    </section>
  )
}
