const sources = [
  { id: 'frontend', title: 'React 工程', url: 'https://react.dev/blog' },
  { id: 'security', title: '安全实践', url: 'https://web.dev/' },
  { id: 'rss', title: 'RSS 标准', url: 'https://www.rssboard.org/' },
]

export function validateSources(value) {
  if (!Array.isArray(value) || value.length > 30) throw new Error('响应不是允许的来源列表')
  return value.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('来源字段缺失')
    const source = item
    if (
      typeof source.id !== 'string' ||
      typeof source.title !== 'string' ||
      typeof source.url !== 'string'
    )
      throw new Error('来源数据不合法')
    let parsed
    try {
      parsed = new URL(source.url)
    } catch {
      throw new Error('来源URL无效')
    }
    if (parsed.protocol !== 'https:' || !parsed.hostname) throw new Error('只能使用HTTPS来源')
    return { id: source.id, title: source.title, url: parsed.href }
  })
}

function pause(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = globalThis.setTimeout(() => {
      signal.removeEventListener('abort', abort)
      resolve()
    }, ms)
    function abort() {
      globalThis.clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

// 不调用真实网络：Ky 自己完成 Request、Response、HTTP 错误、retry 与取消逻辑。
// 仅自有 .invalid 域名可以进入 fixture，未知路径全部拒绝。
export function createFixtureTransport() {
  const attempts = new Map()
  const mockFetch = async (input, init) => {
    const request = new Request(input, init)
    const url = new URL(request.url)
    if (url.origin !== 'https://lab.invalid') throw new Error('fixture 拒绝外部网络请求')
    const key = `${request.method}:${url.pathname}`
    const next = (attempts.get(key) ?? 0) + 1
    attempts.set(key, next)
    if (url.pathname === '/sources' && request.method === 'GET') {
      const query = url.searchParams.get('q') ?? ''
      await pause(query === 'slow' ? 460 : 45, request.signal)
      return Response.json(
        sources.filter((source) =>
          (source.title + source.id)
            .toLowerCase()
            .includes(
              query === 'fast' ? 'frontend' : query === 'slow' ? 'security' : query.toLowerCase(),
            ),
        ),
      )
    }
    if (url.pathname === '/timeout') {
      await pause(200, request.signal)
      return Response.json({ ok: true })
    }
    if (url.pathname === '/invalid')
      return Response.json([{ id: 'bad', title: '不可信来源', url: 'javascript:alert(1)' }])
    if (url.pathname === '/transient' && request.method === 'GET') {
      return next === 1
        ? new Response('暂时不可用', { status: 503 })
        : Response.json({ ok: true, attempts: next })
    }
    if (url.pathname === '/follow' && request.method === 'POST')
      return Response.json({ code: 'STALE_VERSION', message: '请刷新服务端版本' }, { status: 409 })
    if (url.pathname === '/huge' && request.method === 'GET')
      return new Response('x'.repeat(1024), { headers: { 'content-type': 'text/plain' } })
    if (url.pathname === '/removed' && request.method === 'DELETE')
      return new Response(null, { status: 204 })
    return Response.json({ message: 'not found' }, { status: 404 })
  }
  return { fetch: mockFetch, attempts, resetTransient: () => attempts.delete('GET:/transient') }
}
