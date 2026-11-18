import FullCalendar, {
  type CalendarRef,
  type DatesSetInfo,
  type EventDropInfo,
  type EventResizeDoneInfo,
} from '@fullcalendar/react'
import { useEffect, useRef, useState } from 'react'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/classic/theme.css'
import '@fullcalendar/react/themes/classic/palette.css'
import { type CalendarEvent, FOLD, LOCALE, PLUGINS, seedEvents, ZONE } from './calendar-contract'
import { allocateEventId, getUtcInstant, isCivilDate } from './calendar-policy.mjs'
import './styles.css'

export { getUtcInstant } from './calendar-policy.mjs'

type Level = 'basic' | 'business' | 'advanced'
type EventValue = { id: string; title: string; start: string; end: string; allDay: boolean }
type Receipt = {
  kind: 'drop' | 'resize'
  id: string
  from: string
  start: string
  end: string
  allDay: boolean
  decision: 'accepted' | 'reverted'
}
type Range = { view: string; start: string; end: string; timeZone: string }

export default function CalendarExample({ level }: { level: Level }) {
  return <CalendarSession key={level} level={level} />
}
function CalendarSession({ level }: { level: Level }) {
  const [events, setEvents] = useState(() => seedEvents(level === 'advanced'))
  const eventsRef = useRef(events)
  const [title, setTitle] = useState('RSS 频道审核')
  const [date, setDate] = useState('2026-11-03')
  const [status, setStatus] = useState('演示仅更新组件内存，不连接真实日历服务')
  const [range, setRange] = useState<Range | null>(null)
  const [apiEvents, setApiEvents] = useState<EventValue[] | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [callbacks, setCallbacks] = useState({ dates: 0, drops: 0, resizes: 0, reverts: 0 })
  const [epoch, setEpoch] = useState(0)
  const epochRef = useRef(0)
  const alive = useRef(true)
  const composing = useRef(false)
  const calendarRef = useRef<CalendarRef | null>(null)
  const localSequence = useRef(1)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      composing.current = false
    }
  }, [])
  const current = () => alive.current && epoch === epochRef.current
  function commit(next: CalendarEvent[]) {
    eventsRef.current = next
    setEvents(next)
  }
  function add() {
    if (composing.current) {
      setStatus('请先完成标题选词')
      return
    }
    if (!title.trim() || !isCivilDate(date)) {
      setStatus('标题及日历日期必须有效（不允许自动进位）')
      return
    }
    const allocated = allocateEventId(
      localSequence.current,
      eventsRef.current.map((event) => event.id),
    )
    localSequence.current = allocated.nextSequence
    commit([
      ...eventsRef.current,
      { id: allocated.id, title: title.trim(), start: date, allDay: true },
    ])
    setTitle('')
    setApiEvents(null)
    setStatus('本地事件已添加，未写入服务端')
  }
  function move(kind: 'drop' | 'resize', info: EventDropInfo | EventResizeDoneInfo) {
    if (!current()) return
    const proposed = {
      kind,
      id: info.event.id,
      from: info.oldEvent.startStr,
      start: info.event.startStr,
      end: info.event.endStr,
      allDay: info.event.allDay,
    }
    const invalid = proposed.allDay
      ? !isCivilDate(proposed.start) || (!!proposed.end && !isCivilDate(proposed.end))
      : !getUtcInstant(proposed.start) || (!!proposed.end && !getUtcInstant(proposed.end))
    const conflict = level === 'advanced' && proposed.id === 'fold-early'
    const known = eventsRef.current.some((event) => event.id === proposed.id)
    const rejected = invalid || conflict || !known
    setCallbacks((old) => ({
      ...old,
      drops: old.drops + Number(kind === 'drop'),
      resizes: old.resizes + Number(kind === 'resize'),
      reverts: old.reverts + Number(rejected),
    }))
    setReceipt({ ...proposed, decision: rejected ? 'reverted' : 'accepted' })
    setApiEvents(null)
    if (rejected) {
      info.revert()
      setStatus(
        conflict
          ? '模拟 409：修订冲突，已调用 revert() 恢复原日期'
          : '日期/偏移无效或未知事件；已调用 revert()',
      )
      return
    }
    commit(
      eventsRef.current.map((event) =>
        event.id === proposed.id
          ? {
              ...event,
              start: proposed.start,
              end: proposed.end || undefined,
              allDay: proposed.allDay,
            }
          : event,
      ),
    )
    setStatus('拖拽后的日期已同步到 React 数据源；未发起网络请求')
  }
  function observeDates(info: DatesSetInfo) {
    if (!current()) return
    setRange({
      view: info.view.type,
      start: info.startStr,
      end: info.endStr,
      timeZone: info.timeZone,
    })
    setCallbacks((old) => ({ ...old, dates: old.dates + 1 }))
  }
  function readApi() {
    const api = calendarRef.current?.getApi()
    if (!api) {
      setStatus('日历API尚未就绪')
      return
    }
    setApiEvents(
      api.getEvents().map((event) => ({
        id: event.id,
        title: event.title,
        start: event.startStr,
        end: event.endStr,
        allDay: event.allDay,
      })),
    )
  }
  function reset() {
    epochRef.current++
    setEpoch(epochRef.current)
    commit(seedEvents(level === 'advanced'))
    localSequence.current = 1
    composing.current = false
    setTitle('RSS 频道审核')
    setDate('2026-11-03')
    setRange(null)
    setApiEvents(null)
    setReceipt(null)
    setCallbacks({ dates: 0, drops: 0, resizes: 0, reverts: 0 })
    setStatus('已重置本地日历与本轮观察')
  }
  return (
    <section
      aria-label="FullCalendar 真实演示"
      className="c12-workshop"
      data-testid="c12-workshop"
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? '视图、事件与半开日期范围'
          : level === 'business'
            ? 'RSS 全天创建与真实改期'
            : 'DST 重复时刻与冲突回滚'}
      </h2>
      <p>
        真实FullCalendar
        React7.1.3，纽约时区，中文界面；基础MIT插件，不含Premium。日历处理视图/交互，React拥有事件数组。
      </p>
      <div className="c12-controls">
        <button type="button" onClick={readApi}>
          读取日历API事件
        </button>
        <button type="button" onClick={() => calendarRef.current?.getApi().gotoDate('2026-11-01')}>
          跳到 DST 回拨日
        </button>
        <button type="button" onClick={reset}>
          重置本地日历
        </button>
      </div>
      {level !== 'basic' && (
        <div className="c12-controls">
          <label>
            标题{' '}
            <input
              aria-label="标题"
              value={title}
              maxLength={80}
              onChange={(event) => setTitle(event.target.value)}
              onCompositionStart={() => {
                composing.current = true
              }}
              onCompositionEnd={() => {
                composing.current = false
              }}
              onBlur={() => {
                composing.current = false
              }}
            />
          </label>
          <label>
            日期{' '}
            <input
              aria-label="日期"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </label>
          <button type="button" onClick={add}>
            创建本地事件
          </button>
        </div>
      )}
      <p role="status" data-testid="c12-status">
        {status}
      </p>
      <p data-testid="c12-callbacks">{JSON.stringify(callbacks)}</p>
      <div className="c12-calendar" data-testid="c12-calendar">
        <FullCalendar
          key={epoch}
          ref={calendarRef}
          plugins={PLUGINS}
          locale={LOCALE}
          firstDay={0}
          initialView={level === 'basic' ? 'dayGridMonth' : 'timeGridWeek'}
          initialDate="2026-11-01"
          timeZone={ZONE}
          height={level === 'basic' ? 520 : 640}
          scrollTime={level === 'advanced' ? '00:00:00' : '08:00:00'}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,listWeek',
          }}
          events={events}
          editable={level !== 'basic'}
          datesSet={observeDates}
          eventDrop={(info) => move('drop', info)}
          eventResize={(info) => move('resize', info)}
          eventClass={(info) => `c12-event c12-event-${info.event.id}`}
          eventContent={(info) => <span data-c12-event-id={info.event.id}>{info.event.title}</span>}
          eventClick={(info) => {
            if (current()) setStatus(`选择事件：${info.event.id}`)
          }}
        />
      </div>
      <details>
        <summary>查看真实SDK范围、API事件和末次改期</summary>
        <p>datesSet是SDK范围；API事件需点按钮重新读取；decision与计数为应用观察，非服务端结果。</p>
        <pre data-testid="c12-range">{JSON.stringify(range, null, 2)}</pre>
        <pre data-testid="c12-api-events">{JSON.stringify(apiEvents, null, 2)}</pre>
        <pre data-testid="c12-receipt">{JSON.stringify(receipt, null, 2)}</pre>
      </details>
      {level === 'advanced' && (
        <div>
          <h3>两个不同的 UTC instant</h3>
          <p>
            纽约2026-11-01的01:30出现两次；偏移对应05:30Z与06:30Z。拖动fold-early同步模拟409并revert，不是实际HTTP或完整TZDB业务校验。
          </p>
          <pre data-testid="c12-fold">
            {JSON.stringify(
              FOLD.map((event) => ({
                id: event.id,
                source: event.start,
                instant: getUtcInstant(event.start),
              })),
              null,
              2,
            )}
          </pre>
        </div>
      )}
      <h3>React权威事件与可读清单</h3>
      <ul>
        {events.map((event) => (
          <li key={event.id}>
            {event.title} — {event.start} {event.end ? `→ ${event.end}` : ''}{' '}
            {event.allDay ? '（全天，end不包含）' : ''}
          </li>
        ))}
      </ul>
      <pre data-testid="c12-events">{JSON.stringify(events, null, 2)}</pre>
      <p>
        两天校对的[11月3日,11月5日)只覆盖3、4日。本例无网络取数/异步回包；未知ID与无明确偏移改期拒绝。完整触摸/读屏与系统IME未验收。
      </p>
    </section>
  )
}
