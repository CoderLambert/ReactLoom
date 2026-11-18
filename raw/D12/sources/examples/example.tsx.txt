import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { actions, createFeedStore } from './store.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Props = { level: Level }
export default function ReduxExample({ level }: Props) {
  const [stores] = useState(() => ({ A: createFeedStore(), B: createFeedStore() }))
  const [tenant, setTenant] = useState<'A' | 'B'>('A')
  const active = stores[tenant]
  const state = useSyncExternalStore(active.subscribe, active.getState, active.getState).feeds
  const seq = useRef(0)
  const [raceIds, setRaceIds] = useState<{ tenant: 'A' | 'B'; old: string; latest: string } | null>(
    null,
  )
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(
    () => () => {
      for (const timer of timers.current) clearTimeout(timer)
      timers.current = []
      active.dispatch(actions.cancelRequest())
    },
    [active],
  )
  function add() {
    const id = `${tenant}-${++seq.current}`
    active.dispatch(actions.addFeed({ id, title: `新闻源 ${id}`, read: false }))
  }
  function demonstrateRace() {
    timers.current.forEach(clearTimeout)
    timers.current = []
    const first = `${tenant}-old-${++seq.current}`,
      latest = `${tenant}-new-${++seq.current}`
    setRaceIds({ tenant, old: first, latest })
    active.dispatch(actions.startRequest(first))
    active.dispatch(actions.startRequest(latest))
    timers.current.push(
      setTimeout(
        () => active.dispatch(actions.finishRequest({ id: latest, value: '新请求已采用' })),
        350,
      ),
    )
    timers.current.push(
      setTimeout(
        () => active.dispatch(actions.finishRequest({ id: first, value: '旧请求不该覆盖' })),
        1000,
      ),
    )
  }
  return (
    <section aria-label="Redux Toolkit真实store演示">
      <h2>
        {level === 'basic'
          ? 'createSlice 与不可变更新'
          : level === 'business'
            ? '租户独立 store 与动态条目'
            : '请求身份与过期响应防护'}
      </h2>
      {level !== 'basic' && (
        <label>
          当前工作区{' '}
          <select value={tenant} onChange={(event) => setTenant(event.target.value as 'A' | 'B')}>
            <option value="A">团队 A</option>
            <option value="B">团队 B</option>
          </select>
        </label>
      )}
      <div className="demo-controls">
        {level !== 'advanced' && (
          <button type="button" onClick={() => active.dispatch(actions.increment())}>
            计数 +1
          </button>
        )}
        {level === 'business' && (
          <button type="button" onClick={add}>
            增加频道
          </button>
        )}
        {level === 'advanced' && (
          <button type="button" onClick={demonstrateRace}>
            模拟先后返回的两个请求
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            timers.current.forEach(clearTimeout)
            timers.current = []
            setRaceIds(null)
            active.dispatch(actions.reset())
          }}
        >
          只重置当前工作区
        </button>
      </div>
      <output className="demo-output" data-testid="redux-state">
        当前 {tenant} {level !== 'advanced' && <>计数 {state.counter}</>}
        {level === 'business' && (
          <ul>
            {state.feeds.map((feed) => (
              <li key={feed.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={feed.read}
                    onChange={() => active.dispatch(actions.toggleRead(feed.id))}
                  />
                  {feed.title}
                </label>
              </li>
            ))}
          </ul>
        )}
        {level === 'advanced' && (
          <>
            <p data-testid="redux-request-plan">
              {raceIds && raceIds.tenant === tenant
                ? `先发 ${raceIds.old}（1000ms后回包），后发 ${raceIds.latest}（350ms后回包）；只有当前activeRequest匹配的动作可写入结果。`
                : '点击按钮发出两次本地fixture任务。'}
            </p>
            <p data-testid="redux-race">
              最后结果：{state.result || '待运行'}；已忽略过期响应：{state.ignored}；活跃请求：
              {state.activeRequest || '无'}
            </p>
            <p>这是自建请求身份守卫，不是SDK自动取消。定时器模拟回包，没有HTTP或服务端权限检查。</p>
          </>
        )}
      </output>
      <p>
        演示真实 Redux Toolkit reducer/store；React 订阅使用原生
        useSyncExternalStore。正式多组件应用可选择 react-redux，不需要将 Lab Demo 包装方式强制移植。
      </p>
    </section>
  )
}
