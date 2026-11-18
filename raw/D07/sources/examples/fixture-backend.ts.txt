export type Feed = {
  id: string
  title: string
  enabled: boolean
  rev: number
  optimisticToken?: number
}
export type Tenant = 'team-a' | 'team-b'
export type ListPage = { items: Feed[]; total: number; page: number }
export const pageSize = 3

function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('已取消', 'AbortError'))
      return
    }
    const stop = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', stop)
      reject(new DOMException('已取消', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', stop)
      resolve()
    }, ms)
    signal?.addEventListener('abort', stop, { once: true })
  })
}

/** Per-demo in-memory fixture backend. Not a real network API. */
export function createFixtureBackend() {
  const db: Record<Tenant, Feed[]> = {
    'team-a': Array.from({ length: 9 }, (_, n) => ({
      id: `a-${n + 1}`,
      title: `工程频道 ${n + 1}`,
      enabled: n % 2 === 0,
      rev: 1,
    })),
    'team-b': Array.from({ length: 6 }, (_, n) => ({
      id: `b-${n + 1}`,
      title: `商业资讯 ${n + 1}`,
      enabled: n % 2 === 0,
      rev: 1,
    })),
  }
  const statsRequests: Record<Tenant, number> = { 'team-a': 0, 'team-b': 0 }
  let added = 0
  return {
    addFixtureFeed(tenant: Tenant) {
      const id = `${tenant}-fixture-${++added}`
      db[tenant].push({ id, title: `本地新增来源 ${added}`, enabled: true, rev: 1 })
    },
    async list(
      tenant: Tenant,
      search: string,
      page: number,
      signal: AbortSignal,
      delay = 280,
    ): Promise<ListPage> {
      await pause(delay, signal)
      const filtered = db[tenant].filter((feed) =>
        feed.title.toLowerCase().includes(search.toLowerCase()),
      )
      return {
        items: filtered.slice(page * pageSize, (page + 1) * pageSize).map((feed) => ({ ...feed })),
        total: filtered.length,
        page,
      }
    },
    async stats(tenant: Tenant, signal: AbortSignal, delay = 140) {
      const request = ++statsRequests[tenant]
      await pause(delay, signal)
      return {
        total: db[tenant].length,
        enabled: db[tenant].filter((feed) => feed.enabled).length,
        request,
      }
    },
    async toggle(
      tenant: Tenant,
      id: string,
      enabled: boolean,
      expectedRev: number,
      fail: boolean,
    ): Promise<Feed> {
      await pause(240)
      if (fail) throw new Error('业务 fixture：模拟 409 版本冲突')
      const index = db[tenant].findIndex((row) => row.id === id)
      if (index < 0) throw new Error('来源不存在')
      if (db[tenant][index].rev !== expectedRev)
        throw new Error('业务 fixture：409 版本已变化，请刷新')
      const updated = { ...db[tenant][index], enabled, rev: db[tenant][index].rev + 1 }
      db[tenant][index] = updated
      return { ...updated }
    },
  }
}
export type Backend = ReturnType<typeof createFixtureBackend>
