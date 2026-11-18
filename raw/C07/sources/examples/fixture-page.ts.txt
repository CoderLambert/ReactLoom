import type { SortingState } from '@tanstack/react-table'
import { type Feed, feedSeed } from './table-data.ts'
export type Response = { rows: Feed[]; total: number }

export function fetchLocalPage(
  params: {
    pageIndex: number
    pageSize: number
    sort: SortingState
    query: string
    fail: boolean
    limit: number
  },
  signal: AbortSignal,
): Promise<Response> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('已取消', 'AbortError'))
      return
    }
    let done = false
    const cancel = () => {
      if (done) return
      done = true
      clearTimeout(timer)
      signal.removeEventListener('abort', cancel)
      reject(new DOMException('已取消', 'AbortError'))
    }
    const timer = setTimeout(() => {
      if (done) return
      done = true
      signal.removeEventListener('abort', cancel)
      if (params.fail) {
        reject(new Error('本地模拟服务端 503'))
        return
      }
      const filtered = feedSeed
        .slice(0, params.limit)
        .filter((x) => (x.title + x.category).toLowerCase().includes(params.query.toLowerCase()))
      const sort = params.sort[0]
      const sorted = [...filtered]
      if (sort && ['title', 'category', 'subscribers', 'status'].includes(sort.id)) {
        sorted.sort((a, b) => {
          const left = a[sort.id as keyof Feed],
            right = b[sort.id as keyof Feed]
          const order =
            typeof left === 'number' && typeof right === 'number'
              ? left - right
              : String(left).localeCompare(String(right), 'zh')
          return (sort.desc ? -order : order) || a.id.localeCompare(b.id)
        })
      }
      const start = params.pageIndex * params.pageSize
      resolve({ rows: sorted.slice(start, start + params.pageSize), total: sorted.length })
    }, 360)
    signal.addEventListener('abort', cancel, { once: true })
  })
}
