import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { Backend, Tenant } from './fixture-backend'
import { keys } from './query-keys'
import { sharedStatsOptions } from './shared-query'

function StatisticsCard({
  backend,
  tenant,
  name,
}: {
  backend: Backend
  tenant: Tenant
  name: 'a' | 'b'
}) {
  const query = useQuery(sharedStatsOptions(backend, tenant))
  return (
    <section
      className="d07-card"
      aria-label={`统计观察组件 ${name.toUpperCase()}`}
      data-testid={`d07-observer-${name}`}
      data-stale={query.isStale}
      data-fetch-status={query.fetchStatus}
    >
      <h3>组件 {name.toUpperCase()}</h3>
      <p>
        status={query.status} · fetchStatus={query.fetchStatus}
      </p>
      <p>{query.isStale ? 'stale：允许后续触发重新获取' : 'fresh：仍在3秒新鲜期'}</p>
      {query.isPending ? (
        <p>首次加载，没有缓存数据…</p>
      ) : query.isError ? (
        <p role="alert">{query.error.message}</p>
      ) : (
        <p data-testid={`d07-stat-value-${name}`}>
          订阅源 {query.data.total} · 启用 {query.data.enabled} · fixture请求序号{' '}
          {query.data.request}
        </p>
      )}
      {query.isFetching && query.data && <p>后台刷新中，保留上次成功数据…</p>}
    </section>
  )
}

export default function CachePrimer({ backend }: { backend: Backend }) {
  const client = useQueryClient()
  const [tenant, setTenant] = useState<Tenant>('team-a')
  const [second, setSecond] = useState(false)
  const [message, setMessage] = useState('组件A已订阅统计；可以在首次600ms请求期间挂载组件B。')
  return (
    <section
      className="d07-workshop"
      aria-label="TanStack Query 共享缓存实验"
      data-testid="d07-cache-primer"
    >
      <h2>同一个 queryKey，两个订阅组件</h2>
      <p>
        真实 useQuery 共享本例
        QueryClient；统计来自600ms本地fixture，没有HTTP请求。新鲜期3秒，过期不会主动发起轮询。
      </p>
      <div className="d07-controls">
        <label>
          工作区{' '}
          <select
            aria-label="工作区"
            value={tenant}
            onChange={(event) => {
              setTenant(event.target.value as Tenant)
              setMessage('身份进入查询键，两个团队的统计分别缓存。')
            }}
          >
            <option value="team-a">技术团队 A</option>
            <option value="team-b">商业团队 B</option>
          </select>
        </label>
        <button type="button" onClick={() => setSecond((value) => !value)}>
          {second ? '卸载第二个统计组件' : '挂载第二个统计组件'}
        </button>
        <button
          type="button"
          onClick={() => {
            backend.addFixtureFeed(tenant)
            setMessage('本地数据源已新增1条；Query缓存没有被直接修改，刷新后才能看到。')
          }}
        >
          在本地数据源新增1条
        </button>
        <button
          type="button"
          onClick={() =>
            void client.invalidateQueries({ queryKey: keys.stats(tenant), exact: true })
          }
        >
          后台刷新共享统计
        </button>
      </div>
      <pre data-testid="d07-shared-key">{JSON.stringify(keys.stats(tenant))}</pre>
      <div className="d07-cards">
        <StatisticsCard backend={backend} tenant={tenant} name="a" />
        {second && <StatisticsCard backend={backend} tenant={tenant} name="b" />}
      </div>
      <p role="status" data-testid="d07-shared-message">
        {message}
      </p>
      <p>
        同键组件共享缓存和在途请求；fixture请求序号相同表示它们显示同一次读取的结果。fresh时挂载B不重取；stale时新订阅可触发刷新，已有数据仍保留。为便于观察，本实验关闭焦点/重连自动刷新；业务场景保持通常默认行为。
      </p>
    </section>
  )
}
