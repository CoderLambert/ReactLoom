import axios, {
  type AxiosAdapter,
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

export type Feed = { id: string; title: string; tenant: 'a' | 'b' }
const items: Feed[] = [
  { id: 'a1', title: 'React 工程复盘', tenant: 'a' },
  { id: 'a2', title: 'AI 工具调用', tenant: 'a' },
  { id: 'b1', title: '商业周报', tenant: 'b' },
]
async function pause(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('aborted', 'AbortError'))
      return
    }
    const cleanup = () => signal?.removeEventListener('abort', abort)
    const abort = () => {
      clearTimeout(timer)
      cleanup()
      reject(new DOMException('aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      cleanup()
      resolve()
    }, ms)
    signal?.addEventListener('abort', abort, { once: true })
  })
}
export function makeFixtureClient(onTrace: (text: string) => void) {
  const attempts = new Map<string, number>()
  const adapter: AxiosAdapter = async (config: InternalAxiosRequestConfig) => {
    const url = new URL(axios.getUri(config)) // Axios serializes baseURL AND params before fixture routing
    if (url.origin !== 'https://lab.invalid')
      throw new Error('fixture 只支持 https://lab.invalid，拒绝外部请求')
    await pause(url.pathname === '/slow' ? 340 : 60, config.signal as AbortSignal | undefined)
    const key = url.pathname
    const current = (attempts.get(key) ?? 0) + 1
    attempts.set(key, current)
    const status = key === '/conflict' ? 409 : key === '/transient' && current === 1 ? 503 : 200
    const tenant = url.searchParams.get('tenant') === 'b' ? 'b' : 'a'
    const filtered = items.filter(
      (row) => row.tenant === tenant && row.title.includes(url.searchParams.get('q') ?? ''),
    )
    const body =
      key === '/transient'
        ? { attempt: current, ok: status === 200 }
        : key === '/conflict'
          ? { error: 'version_conflict' }
          : filtered
    const response: AxiosResponse = {
      status,
      statusText: String(status),
      data: body,
      headers: new AxiosHeaders({ 'content-type': 'application/json' }),
      config,
    }
    onTrace(
      config.method?.toUpperCase() +
        ' ' +
        key +
        ' → ' +
        status +
        ' (request ' +
        current +
        ', X-Lab-Request=' +
        String(config.headers.get('X-Lab-Request')) +
        ')',
    )
    if (status >= 400)
      throw new AxiosError(
        `fixture HTTP ${status}`,
        AxiosError.ERR_BAD_RESPONSE,
        config,
        undefined,
        response,
      )
    return response
  }
  const client = axios.create({ baseURL: 'https://lab.invalid', adapter, timeout: 2000 })
  let ids: { request: number; response: number } | undefined
  function install() {
    if (ids) return
    ids = {
      request: client.interceptors.request.use((config) => {
        config.headers.set('X-Lab-Request', 'isolated')
        return config
      }),
      response: client.interceptors.response.use((response) => {
        onTrace(`response interceptor → ${response.status}`)
        return response
      }),
    }
  }
  function dispose() {
    if (!ids) return
    client.interceptors.request.eject(ids.request)
    client.interceptors.response.eject(ids.response)
    ids = undefined
  }
  install()
  return { client, install, resetTransient: () => attempts.delete('/transient'), dispose }
}
export async function boundedGetRetry(client: AxiosInstance, signal: AbortSignal) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await client.get('/transient', { signal })
    } catch (e) {
      if (signal.aborted || !axios.isAxiosError(e) || e.response?.status !== 503 || attempt === 1)
        throw e
    }
  }
  throw new Error('不可达：重试次数已耗尽')
}
export function validate(value: unknown): Feed[] {
  if (!Array.isArray(value) || value.length > 30) throw new Error('响应不是受控列表')
  return value.map((item) => {
    const row = item as Partial<Feed> | null
    if (
      !row ||
      typeof row !== 'object' ||
      typeof row.id !== 'string' ||
      typeof row.title !== 'string' ||
      !['a', 'b'].includes(row.tenant ?? '')
    )
      throw new Error('响应数据字段非法')
    return row as Feed
  })
}
