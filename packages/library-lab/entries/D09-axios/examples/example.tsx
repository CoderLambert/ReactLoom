import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { boundedGetRetry, makeFixtureClient, validate } from './fixture-client'

type Level = 'basic' | 'business' | 'advanced'
export default function AxiosWorkshop({ level }: { level: Level }) {
  const [logs, setLogs] = useState<{ id: number; text: string }[]>([])
  const [result, setResult] = useState('')
  const [tenant, setTenant] = useState<'a' | 'b'>('a')
  const [draft, setDraft] = useState('')
  const composing = useRef(false)
  const generation = useRef(0)
  const active = useRef<AbortController | null>(null)
  const timer = useRef<number | null>(null)
  const logSequence = useRef(0)
  const [client] = useState(() =>
    makeFixtureClient((message) =>
      setLogs((history) => [...history.slice(-9), { id: ++logSequence.current, text: message }]),
    ),
  )
  useEffect(() => {
    client.install()
    return () => {
      generation.current++
      active.current?.abort()
      if (timer.current !== null) window.clearTimeout(timer.current)
      client.dispose()
    }
  }, [client])
  function cancelCurrent() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    active.current?.abort()
    generation.current++
    setResult('请求已取消')
  }
  function controller() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    active.current?.abort()
    active.current = new AbortController()
    generation.current++
    return { signal: active.current.signal, token: generation.current }
  }
  async function search(value: string, selected: 'a' | 'b', slow = false) {
    const { signal, token } = controller()
    setResult('请求进行中…')
    try {
      const response = await client.client.get<unknown>(slow ? '/slow' : '/feeds', {
        params: { q: value, tenant: selected },
        signal,
      })
      const data = validate(response.data)
      if (token === generation.current && !signal.aborted)
        setResult(JSON.stringify({ tenant: selected, data }, null, 2))
    } catch (e) {
      if (token === generation.current)
        setResult(axios.isCancel(e) || signal.aborted ? '请求已取消' : String(e))
    }
  }
  async function testFailure(kind: 'retry' | 'conflict') {
    const { signal, token } = controller()
    setResult('验证真实 Axios 适配与拦截器…')
    try {
      // A second button press is a second incident, so the fixture must start with 503 again.
      if (kind === 'retry') client.resetTransient()
      const response =
        kind === 'retry'
          ? await boundedGetRetry(client.client, signal)
          : await client.client.post('/conflict', { feed: 'a1', revision: 0 }, { signal })
      if (token === generation.current)
        setResult(`status ${response.status}: ${JSON.stringify(response.data)}`)
    } catch (e) {
      const message = axios.isAxiosError(e)
        ? `HTTP ${e.response?.status ?? 'no status'} ${e.message}`
        : String(e)
      if (token === generation.current) setResult(message)
    }
  }
  return (
    <section aria-label="Axios HTTP client workshop">
      <h2>
        {level === 'basic'
          ? 'Axios 实例与拦截器'
          : level === 'business'
            ? 'RSS 跨租户搜索与取消'
            : 'GET 503重试 / POST 409不重试'}
      </h2>
      <p>
        请求真正经过 Axios.create、请求/响应拦截器与 AxiosAdapter；业务后端由严格限定域名的内存
        adapter模拟，不触达外网。
      </p>
      {level !== 'advanced' && (
        <div className="demo-controls">
          <label>
            租户{' '}
            <select
              aria-label="租户"
              value={tenant}
              onChange={(e) => {
                const v = e.target.value as 'a' | 'b'
                setTenant(v)
                void search('', v)
              }}
            >
              <option value="a">技术团队A</option>
              <option value="b">业务团队B</option>
            </select>
          </label>
          {level === 'business' && (
            <label>
              RSS标题{' '}
              <input
                aria-label="RSS标题"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onCompositionStart={() => {
                  composing.current = true
                }}
                onCompositionEnd={() => {
                  composing.current = false
                }}
              />
            </label>
          )}
          <button
            type="button"
            onClick={() => {
              if (!composing.current) void search(draft.trim(), tenant)
            }}
          >
            GET 列表
          </button>
          {level === 'business' && (
            <button
              type="button"
              onClick={() => {
                void search('', tenant, true)
                timer.current = window.setTimeout(() => {
                  timer.current = null
                  void search('React', tenant)
                }, 40)
              }}
            >
              先慢后快竞态
            </button>
          )}
          <button type="button" onClick={cancelCurrent}>
            取消请求
          </button>
        </div>
      )}
      {level === 'advanced' && (
        <div className="demo-controls">
          <button type="button" onClick={() => void testFailure('retry')}>
            GET 503 限定重试
          </button>
          <button type="button" onClick={() => void testFailure('conflict')}>
            POST 409 不重试
          </button>
        </div>
      )}
      <pre data-testid="axios-result" role="status">
        {result || '等待操作'}
      </pre>
      <h3>实际适配器调用日志</h3>
      <ol>
        {logs.map((line) => (
          <li key={line.id}>{line.text}</li>
        ))}
      </ol>
      <p>
        生产环境需要统一可取消真实 adapter、明确请求鉴权和重试预算；HTTP状态由本 fixture
        适配器显式映射，不能当真实网络验证。
      </p>
    </section>
  )
}
