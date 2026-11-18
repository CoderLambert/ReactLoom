import {
  QueryClient,
  QueryClientProvider,
  useIsFetching,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import CachePrimer from './cache-primer'
import {
  type Backend,
  createFixtureBackend,
  type ListPage,
  pageSize,
  type Tenant,
} from './fixture-backend'
import { commitRow, optimisticRow, rollbackRow } from './optimistic-policy.mjs'
import { keys } from './query-keys'
import './workshop.css'

type Props = { level: 'basic' | 'business' | 'advanced' }

function QueryWorkspace({ level, backend }: { level: Props['level']; backend: Backend }) {
  const client = useQueryClient()
  const [tenant, setTenant] = useState<Tenant>('team-a')
  // Mutation completion belongs to the identity epoch in which it started.
  // A -> B -> A must not resurrect a message from the first A session.
  const tenantEpoch = useRef(0)
  const mutationSequence = useRef(0)
  const inFlightRows = useRef(new Set<string>())
  useEffect(
    () => () => {
      tenantEpoch.current++
    },
    [],
  )
  const [draft, setDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [delay, setDelay] = useState(280)
  const [failNext, setFailNext] = useState(false)
  const [message, setMessage] = useState('')
  const pending = useIsFetching({ queryKey: keys.tenant(tenant) })
  const stats = useQuery({
    queryKey: keys.stats(tenant),
    queryFn: ({ signal }) => backend.stats(tenant, signal),
    staleTime: 10_000,
  })
  const list = useQuery({
    queryKey: keys.list(tenant, search, page),
    queryFn: ({ signal }) => backend.list(tenant, search, page, signal, delay),
    staleTime: 3_000,
    // A previous search/page is not a valid placeholder for the new key.
  })
  const update = useMutation({
    mutationKey: keys.mutations(tenant),
    scope: { id: `library-lab-toggle-${tenant}` },
    mutationFn: (vars: {
      tenant: Tenant
      id: string
      enabled: boolean
      expectedRev: number
      fail: boolean
    }) => backend.toggle(vars.tenant, vars.id, vars.enabled, vars.expectedRev, vars.fail),
    onMutate: async (vars) => {
      const epoch = tenantEpoch.current
      const token = ++mutationSequence.current
      await client.cancelQueries({ queryKey: keys.feeds(vars.tenant) })
      // Save only the original affected row, never restore an entire old page.
      const snapshots = client
        .getQueriesData<ListPage>({ queryKey: keys.feeds(vars.tenant) })
        .map(([key, page]) => ({ key, previous: page?.items.find((row) => row.id === vars.id) }))
      client.setQueriesData<ListPage>({ queryKey: keys.feeds(vars.tenant) }, (old) =>
        optimisticRow(old, {
          id: vars.id,
          enabled: vars.enabled,
          expectedRev: vars.expectedRev,
          token,
        }),
      )
      return { snapshots, epoch, token }
    },
    onError: (error, vars, context) => {
      if (context)
        for (const { key, previous } of context.snapshots)
          client.setQueryData<ListPage>(key, (old) =>
            rollbackRow(old, { id: vars.id, token: context.token, previous }),
          )
      if (context?.epoch === tenantEpoch.current && vars.tenant === tenant)
        setMessage(`更新失败，已按行回滚：${error.message}`)
    },
    onSuccess: (saved, vars, context) => {
      if (context)
        client.setQueriesData<ListPage>({ queryKey: keys.feeds(vars.tenant) }, (old) =>
          commitRow(old, { id: vars.id, token: context.token, saved }),
        )
      if (context?.epoch === tenantEpoch.current && vars.tenant === tenant)
        setMessage(`更新完成：${saved.id} rev ${saved.rev}`)
    },
    onSettled: async (_saved, _error, vars) => {
      inFlightRows.current.delete(`${vars.tenant}:${vars.id}`)
      // Old invalidation must not refetch over a newer pending draft.
      if (client.isMutating({ mutationKey: keys.mutations(vars.tenant) }) !== 1) return
      await Promise.all([
        client.invalidateQueries({ queryKey: keys.feeds(vars.tenant) }),
        client.invalidateQueries({ queryKey: keys.stats(vars.tenant) }),
      ])
    },
  })
  const data = list.data
  const rows = data?.items ?? []
  function switchTenant(value: Tenant) {
    if (value === tenant) return
    tenantEpoch.current++
    setTenant(value)
    setDraft('')
    setSearch('')
    setPage(0)
    setMessage('')
  }
  return (
    <section
      className="d07-workshop"
      aria-label="TanStack Query 实际SDK"
      data-testid="d07-workspace"
    >
      <h2>
        {level === 'basic'
          ? '查询与 freshness'
          : level === 'business'
            ? '租户隔离、缓存和分页'
            : '取消、更新和回滚'}
      </h2>
      <p>SDK 操作真实 QueryClient；业务 API 是明确标注的每例隔离内存 fixture，不对外发送请求。</p>
      <div className="demo-controls">
        <label>
          工作区{' '}
          <select
            aria-label="工作区"
            value={tenant}
            onChange={(e) => switchTenant(e.target.value as Tenant)}
          >
            <option value="team-a">技术团队 A</option>
            <option value="team-b">商业团队 B</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => void client.invalidateQueries({ queryKey: keys.tenant(tenant) })}
        >
          标记当前团队缓存失效
        </button>
      </div>
      <p role="status" data-testid="d07-fetching">
        {pending > 0 ? `后台查询 ${pending} 个` : '后台空闲'}
      </p>
      {stats.isPending ? (
        <p>正在读取统计…</p>
      ) : stats.isError ? (
        <p role="alert">{stats.error.message}</p>
      ) : (
        <p>
          订阅源：{stats.data.total}；启用：{stats.data.enabled}
        </p>
      )}
      {level !== 'basic' && (
        <form
          className="demo-controls"
          onSubmit={(e) => {
            e.preventDefault()
            setSearch(draft.trim())
            setPage(0)
          }}
        >
          <label>
            RSS 搜索
            <input aria-label="RSS 搜索" value={draft} onChange={(e) => setDraft(e.target.value)} />
          </label>
          <button type="submit">查询</button>
        </form>
      )}
      {level === 'advanced' && (
        <div className="demo-controls">
          <label>
            本地请求延迟{' '}
            <select value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
              <option value={280}>280ms</option>
              <option value={900}>900ms</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => {
              void client.cancelQueries({ queryKey: keys.feeds(tenant) })
              setMessage('已取消当前列表查询；已有缓存保留，重新获取可恢复。')
            }}
          >
            取消当前列表查询
          </button>
          <button type="button" onClick={() => void list.refetch()}>
            重新获取当前列表
          </button>
          <label>
            <input
              type="checkbox"
              checked={failNext}
              onChange={(e) => setFailNext(e.target.checked)}
            />
            模拟下一次更新409
          </label>
        </div>
      )}
      <p data-testid="d07-query-state">
        列表 status={list.status} · fetchStatus={list.fetchStatus} ·{' '}
        {list.isStale ? 'stale' : 'fresh'}
      </p>
      <pre data-testid="d07-query-key">{JSON.stringify(keys.list(tenant, search, page))}</pre>
      {list.isPending ? (
        <p>
          {list.fetchStatus === 'idle'
            ? '当前没有列表数据，查询已停止。请重新获取。'
            : '读取列表中…'}
        </p>
      ) : list.isError ? (
        <p role="alert">查询失败：{list.error.message}</p>
      ) : (
        <div>
          <ul>
            {rows.map((row) => (
              <li key={row.id} data-testid={`d07-row-${row.id}`} style={{ padding: '7px 0' }}>
                {row.title} · {row.enabled ? '已启用' : '已暂停'} · rev {row.rev}
                {row.optimisticToken !== undefined ? ' · 等待服务端确认' : ''}
                {level === 'advanced' && (
                  <button
                    type="button"
                    disabled={update.isPending}
                    onClick={() => {
                      const key = `${tenant}:${row.id}`
                      if (inFlightRows.current.has(key)) return
                      inFlightRows.current.add(key)
                      const fail = failNext
                      setFailNext(false)
                      setMessage('')
                      update.mutate({
                        tenant,
                        id: row.id,
                        enabled: !row.enabled,
                        expectedRev: row.rev,
                        fail,
                      })
                    }}
                  >
                    {row.enabled ? '暂停' : '启用'}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {rows.length === 0 && <p>没有匹配的来源</p>}
        </div>
      )}
      {level !== 'basic' && (
        <div className="demo-controls">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            上一页
          </button>
          <span>
            第 {page + 1} 页（总数 {data?.total ?? 0}）
          </span>
          <button
            type="button"
            disabled={!data || (page + 1) * pageSize >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
          </button>
        </div>
      )}
      {message && (
        <p role="status" data-testid="d07-message">
          {message}
        </p>
      )}
      <p>当前 queryKey 同时包含 tenant、search、page；组件外的 Lab QueryClient 不共享此缓存。</p>
    </section>
  )
}

export default function TanStackQueryExample({ level }: Props) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 60_000 } } }),
  )
  const [backend] = useState(createFixtureBackend)
  useEffect(() => () => client.clear(), [client])
  return (
    <QueryClientProvider client={client}>
      {level === 'basic' ? (
        <CachePrimer backend={backend} />
      ) : (
        <QueryWorkspace level={level} backend={backend} />
      )}
    </QueryClientProvider>
  )
}
