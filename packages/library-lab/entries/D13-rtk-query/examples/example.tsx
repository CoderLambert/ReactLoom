import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Provider } from 'react-redux'
import { createDemoRuntime, type Feed } from './runtime'

type Level = 'basic' | 'business' | 'advanced'
type Runtime = ReturnType<typeof createDemoRuntime>
function FeedsPanel({
  runtime,
  tenant,
  search,
  level,
}: {
  runtime: Runtime
  tenant: string
  search: string
  level: Level
}) {
  // currentData never displays successful rows from a previous query argument.
  const { currentData, isLoading, isFetching, isError, error, refetch } = runtime.api.useListQuery({
    tenant,
    search,
  })
  const data = currentData ?? []
  const [toggle, mutation] = runtime.api.useToggleMutation()
  const [notice, setNotice] = useState('当前数据来自隔离内存 fixture')
  const inFlight = useRef<{ abort(): void } | null>(null)
  const requestEpoch = useRef(0)
  useEffect(
    () => () => {
      requestEpoch.current++
      inFlight.current?.abort()
      inFlight.current = null
    },
    [],
  )
  async function change(row: Feed) {
    // A stale mutation may settle after tenant/search changes or unmount.
    const ticket = ++requestEpoch.current
    inFlight.current?.abort()
    const request = toggle({ tenant, id: row.id })
    inFlight.current = request
    try {
      await request.unwrap()
      if (ticket === requestEpoch.current)
        setNotice('已修改，RTK Query 对此租户缓存标签发起失效刷新')
    } catch (e) {
      if (ticket === requestEpoch.current) setNotice(`操作被拒绝：${JSON.stringify(e)}`)
    } finally {
      if (ticket === requestEpoch.current) inFlight.current = null
    }
  }
  return (
    <div>
      <p>
        {isLoading ? '加载中' : isFetching ? '后台刷新中' : isError ? '查询失败' : '查询完成'} ·
        租户 {tenant}
      </p>
      {isError && <p role="alert">{JSON.stringify(error)}</p>}
      <div className="demo-controls">
        <button type="button" onClick={() => void refetch()}>
          重新获取本租户
        </button>
        {level === 'advanced' && (
          <button type="button" onClick={() => runtime.clear()}>
            清空当前示例缓存
          </button>
        )}
      </div>
      <ul data-testid="d13-rows">
        {data.map((row) => (
          <li key={row.id}>
            {row.title} — {row.paused ? '暂停' : '启用'}{' '}
            <button type="button" disabled={mutation.isLoading} onClick={() => void change(row)}>
              切换状态
            </button>
          </li>
        ))}
      </ul>
      {data.length === 0 && !isLoading && !isError && <p>当前查询没有订阅结果。</p>}
      <p role="status">{notice}</p>
      {level === 'advanced' && (
        <p>
          尝试 team-b 的 conflict 频道触发模拟 409；切回 team-a，检查不同 tenant
          查询缓存互不复用。重置仅作用于本示例私有 store。
        </p>
      )}
    </div>
  )
}
function SharedSubscriber({
  runtime,
  tenant,
  search,
}: {
  runtime: Runtime
  tenant: string
  search: string
}) {
  const { currentData, isFetching } = runtime.api.useListQuery({ tenant, search })
  return (
    <p data-testid="d13-second">
      第二订阅：{isFetching ? '刷新中' : `${currentData?.length ?? 0} 行`}
    </p>
  )
}
export default function RtkQueryExample({ level }: { level: Level }) {
  const [runtime] = useState(createDemoRuntime)
  const [tenant, setTenant] = useState('team-a')
  const [search, setSearch] = useState('')
  const [draftSearch, setDraftSearch] = useState('')
  const composing = useRef(false)
  const diagnostics = useSyncExternalStore(
    runtime.store.subscribe,
    () => JSON.stringify(runtime.inspect()),
    () => '{}',
  )
  const [second, setSecond] = useState(false)
  useEffect(
    () => () => {
      runtime.dispose()
    },
    [runtime],
  )
  return (
    <section aria-label="RTK Query 实际运行示例">
      <h2>
        {level === 'basic'
          ? '缓存查询与失效'
          : level === 'business'
            ? '多租户 RSS 订阅'
            : '取消、409 和缓存隔离'}
      </h2>
      <div className="demo-controls">
        {level !== 'basic' && (
          <label>
            租户{' '}
            <select value={tenant} onChange={(e) => setTenant(e.target.value)}>
              <option value="team-a">team-a</option>
              <option value="team-b">team-b</option>
            </select>
          </label>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (!composing.current) setSearch(draftSearch.trim())
          }}
        >
          <label>
            标题搜索{' '}
            <input
              value={draftSearch}
              onChange={(e) => setDraftSearch(e.target.value)}
              onCompositionStart={() => {
                composing.current = true
              }}
              onCompositionEnd={() => {
                composing.current = false
              }}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  (composing.current || event.nativeEvent.isComposing || event.keyCode === 229)
                )
                  event.preventDefault()
              }}
            />
          </label>
          <button type="submit">应用搜索</button>
        </form>
        {level === 'advanced' && (
          <button type="button" onClick={() => runtime.setDelay(700)}>
            模拟慢传输
          </button>
        )}
      </div>
      {level === 'basic' && (
        <label>
          <input type="checkbox" checked={second} onChange={(e) => setSecond(e.target.checked)} />
          第二个相同参数订阅
        </label>
      )}
      <Provider store={runtime.store}>
        <FeedsPanel
          key={JSON.stringify([tenant, search])}
          runtime={runtime}
          tenant={tenant}
          search={search}
          level={level}
        />
        {level === 'basic' && second && (
          <SharedSubscriber runtime={runtime} tenant={tenant} search={search} />
        )}
      </Provider>
      <h3>实际 baseQuery 执行与缓存键</h3>
      <pre data-testid="d13-cache">{diagnostics}</pre>
      <p>
        查询 key 同时包含 tenant 与 search，服务端仍需验证租户权限；本地 fixture
        与授权服务不是一回事。
      </p>
    </section>
  )
}
