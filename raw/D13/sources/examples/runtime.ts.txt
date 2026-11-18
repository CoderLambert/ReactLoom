import { configureStore } from '@reduxjs/toolkit'
import { type BaseQueryFn, createApi } from '@reduxjs/toolkit/query/react'
export type Feed = { id: string; tenant: string; title: string; paused: boolean }
type QueryArg =
  | { kind: 'list'; tenant: string; search: string }
  | { kind: 'toggle'; tenant: string; id: string }
type Failure = { status: number; data: string }
const FIXTURE: Feed[] = [
  { id: 'news', tenant: 'team-a', title: '科技日报', paused: false },
  { id: 'frontend', tenant: 'team-a', title: '前端精选', paused: false },
  { id: 'security', tenant: 'team-b', title: '安全研究', paused: false },
  { id: 'conflict', tenant: 'team-b', title: '只读受保护频道', paused: false },
]
function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const abort = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, ms)
    signal.addEventListener('abort', abort, { once: true })
  })
}
export function createDemoRuntime() {
  const reads: Record<string, number> = {}
  let mutations = 0
  let active = 0
  let feeds = FIXTURE.map((row) => ({ ...row }))
  let delay = 200
  const baseQuery: BaseQueryFn<QueryArg, Feed[] | Feed, Failure> = async (arg, { signal }) => {
    if (arg.kind === 'list') reads[arg.tenant] = (reads[arg.tenant] ?? 0) + 1
    else mutations++
    active++
    try {
      await wait(delay, signal)
    } catch {
      return { error: { status: 499, data: 'aborted' } }
    } finally {
      active--
    }
    if (arg.kind === 'list')
      return {
        data: feeds
          .filter((row) => row.tenant === arg.tenant && row.title.includes(arg.search))
          .map((row) => ({ ...row })),
      }
    const target = feeds.find((row) => row.tenant === arg.tenant && row.id === arg.id)
    if (!target) return { error: { status: 404, data: 'not-found' } }
    if (target.id === 'conflict') return { error: { status: 409, data: 'stale-revision' } }
    const updated = { ...target, paused: !target.paused }
    feeds = feeds.map((row) => (row === target ? updated : row))
    return { data: updated }
  }
  const api = createApi({
    reducerPath: 'rlCD13RtkApi',
    baseQuery,
    tagTypes: ['Feeds'],
    endpoints: (builder) => ({
      list: builder.query<Feed[], { tenant: string; search: string }>({
        query: ({ tenant, search }) => ({ kind: 'list', tenant, search }),
        providesTags: (_result, _error, args) => [{ type: 'Feeds', id: args.tenant }],
      }),
      toggle: builder.mutation<Feed, { tenant: string; id: string }>({
        query: ({ tenant, id }) => ({ kind: 'toggle', tenant, id }),
        invalidatesTags: (result, _error, args) =>
          result ? [{ type: 'Feeds', id: args.tenant }] : [],
      }),
    }),
  })
  const store = configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  })
  function clear() {
    for (const query of store.dispatch(api.util.getRunningQueriesThunk())) query.abort()
    for (const mutation of store.dispatch(api.util.getRunningMutationsThunk())) mutation.abort()
    store.dispatch(api.util.resetApiState())
  }
  return {
    api,
    store,
    clear,
    dispose: clear,
    setDelay: (next: number) => {
      delay = next
    },
    inspect: () => ({
      reads: { ...reads },
      mutations,
      active,
      queries: Object.entries(store.getState()[api.reducerPath].queries).map(([key, query]) => ({
        key,
        status: query?.status,
      })),
    }),
  }
}
