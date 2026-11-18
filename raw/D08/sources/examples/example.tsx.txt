import ky, { isHTTPError, isResponseSizeError, isTimeoutError } from 'ky'
import { useEffect, useMemo, useRef, useState } from 'react'

type Level = 'basic' | 'business' | 'advanced'

import { createFixtureTransport, type Source, validateSources } from './transport.mjs'

function describeError(error: unknown): string {
  if (isTimeoutError(error)) return '超时：单次请求超过 30 ms 预算；未重试'
  if (isHTTPError(error))
    return `HTTP ${error.response.status}：应用层需处理失败，不展示私密请求数据`
  if (isResponseSizeError(error)) return '响应体超出限制，停止解析'
  if (error instanceof Error && error.name === 'AbortError') return '已取消旧请求'
  return `请求失败：${error instanceof Error ? error.message : '未知错误'}`
}

export default function KyWorkshop({ level }: { level: Level }) {
  const fixture = useMemo(createFixtureTransport, [])
  const client = useMemo(
    () =>
      ky.create({
        fetch: fixture.fetch,
        timeout: 1200,
        totalTimeout: 2500,
        retry: { limit: 1, methods: ['get'], statusCodes: [503], backoffLimit: 400 },
      }),
    [fixture],
  )
  const [draft, setDraft] = useState('')
  const composing = useRef(false)
  const [data, setData] = useState<Source[]>([])
  const [state, setState] = useState('本地网络 fixture 待执行；不会发出真实 HTTP')
  const [advancedResult, setAdvancedResult] = useState('')
  const generation = useRef(0)
  const current = useRef<AbortController | null>(null)
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      generation.current++
      current.current?.abort()
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  async function search(query: string) {
    if (timer.current !== null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    current.current?.abort()
    const controller = new AbortController()
    current.current = controller
    const ticket = ++generation.current
    setState(`正在获取 ${query || '全部'} …`)
    try {
      const raw = await client
        .get('https://lab.invalid/sources', {
          searchParams: { q: query },
          signal: controller.signal,
        })
        .json<unknown>()
      const parsed = validateSources(raw)
      if (ticket !== generation.current || controller.signal.aborted) return
      setData(parsed)
      setState(
        '只接受最新第 ' +
          ticket +
          ' 次查询结果：' +
          parsed.length +
          ' 条；关键词：' +
          (query || '全部'),
      )
    } catch (error) {
      if (ticket === generation.current) setState(describeError(error))
    }
  }

  async function advanced(kind: 'retry' | 'conflict' | 'huge' | 'empty' | 'timeout' | 'invalid') {
    current.current?.abort()
    const controller = new AbortController()
    current.current = controller
    const ticket = ++generation.current
    setAdvancedResult('正在执行真实 Ky 请求处理…')
    try {
      let result: string
      if (kind === 'retry') {
        // Each click must demonstrate a NEW first-attempt 503, not reuse last click's success.
        fixture.resetTransient()
        const payload = await client
          .get('https://lab.invalid/transient', { signal: controller.signal })
          .json<{ ok: boolean; attempts: number }>()
        result = `503 后最终成功，实际请求次数：${payload.attempts}`
      } else if (kind === 'conflict') {
        await client.post('https://lab.invalid/follow', {
          json: { id: 'frontend', version: 1 },
          retry: { limit: 0 },
          signal: controller.signal,
        })
        result = '意外成功'
      } else if (kind === 'huge') {
        await client
          .get('https://lab.invalid/huge', {
            maxResponseSize: 100,
            retry: { limit: 0 },
            signal: controller.signal,
          })
          .text()
        result = '响应尺寸限制未触发（需要核对目标版本）'
      } else if (kind === 'timeout') {
        await client
          .get('https://lab.invalid/timeout', {
            timeout: 30,
            retry: { limit: 0 },
            signal: controller.signal,
          })
          .json()
        result = '意外成功'
      } else if (kind === 'invalid') {
        validateSources(
          await client
            .get('https://lab.invalid/invalid', { signal: controller.signal })
            .json<unknown>(),
        )
        result = '意外成功'
      } else {
        const response = await client.delete('https://lab.invalid/removed', {
          retry: { limit: 0 },
          signal: controller.signal,
        })
        result = `DELETE ${response.status}：204 不应调用 json()`
      }
      if (ticket === generation.current) setAdvancedResult(result)
    } catch (error) {
      if (ticket === generation.current) setAdvancedResult(describeError(error))
    }
  }

  return (
    <section aria-label="Ky HTTP 客户端演示">
      <h2>
        {level === 'basic'
          ? '原生 Fetch 之上的 HTTP 客户端'
          : level === 'business'
            ? 'RSS 搜索：取消与结果版本'
            : '503/409/响应体上限/204 协议边界'}
      </h2>
      <p>
        调用真实 ky@2.2 的请求、重试与超时实现；fetch 传入严格限定的本地虚构 Response
        适配器，绝不连接外网。
      </p>
      {level !== 'advanced' ? (
        <>
          {level === 'business' && (
            <form
              className="demo-controls"
              onSubmit={(event) => {
                event.preventDefault()
                if (!composing.current) void search(draft.trim())
              }}
            >
              <label>
                来源关键词{' '}
                <input
                  aria-label="来源关键词"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onCompositionStart={() => {
                    composing.current = true
                  }}
                  onCompositionEnd={() => {
                    composing.current = false
                  }}
                />
              </label>
              <button type="submit">搜索来源</button>
            </form>
          )}
          <div className="demo-controls">
            <button type="button" onClick={() => void search('')}>
              GET 来源列表
            </button>
            {level === 'business' && (
              <button
                type="button"
                onClick={() => {
                  void search('slow')
                  if (timer.current !== null) window.clearTimeout(timer.current)
                  timer.current = window.setTimeout(() => void search('fast'), 45)
                }}
              >
                模拟先慢后快的搜索
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (timer.current !== null) {
                  window.clearTimeout(timer.current)
                  timer.current = null
                }
                current.current?.abort()
              }}
            >
              取消当前请求
            </button>
          </div>
          <p role="status">{state}</p>
          <ul>
            {data.map((item) => (
              <li key={item.id}>
                {item.title} / {item.url}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <div className="demo-controls">
            <button type="button" onClick={() => void advanced('retry')}>
              GET 503 → 有限重试
            </button>
            <button type="button" onClick={() => void advanced('conflict')}>
              POST 409 → 不重试
            </button>
            <button type="button" onClick={() => void advanced('huge')}>
              响应体 1 KiB → 100 B 上限
            </button>
            <button type="button" onClick={() => void advanced('timeout')}>
              200 ms 响应 → 30 ms 超时
            </button>
            <button type="button" onClick={() => void advanced('invalid')}>
              200 JSON → 自建 schema 拒绝
            </button>
            <button type="button" onClick={() => void advanced('empty')}>
              DELETE 204 空正文
            </button>
          </div>
          <p role="status">{advancedResult}</p>
          <p>
            v2 使用 prefix 而非旧 prefixUrl；HTTPError.data 已读取错误正文，不能再次使用
            response.json()。这里不输出请求凭据。
          </p>
        </>
      )}
    </section>
  )
}
