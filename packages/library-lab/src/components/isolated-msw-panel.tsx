import { useEffect, useRef, useState } from 'react'
import {
  APP_ORIGIN,
  createMswFrameSession,
  type FrameSession,
  type RunnerRequest,
} from '../lib/frame-session.mjs'
import type { Demo } from '../lib/types'

export default function IsolatedMswPanel({ level }: { level: Demo['level'] }) {
  const session = useRef<FrameSession | null>(null)
  const alive = useRef(true)
  const generation = useRef(0)
  const [phase, setPhase] = useState('idle')
  const [requests, setRequests] = useState<RunnerRequest[]>([])
  const [error, setError] = useState('')
  const [scope, setScope] = useState('')
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      generation.current++
      void session.current?.dispose()
      session.current = null
    }
  }, [])
  const start = () => {
    if (session.current) return
    const current = ++generation.current
    setError('')
    setRequests([])
    setPhase('loading')
    try {
      session.current = createMswFrameSession({
        level,
        onEvent: (event) => {
          if (!alive.current || current !== generation.current) return
          setPhase(event.type)
          if (event.scope) setScope(event.scope)
          if (event.requests) setRequests(event.requests)
          if (event.type === 'error') setError(event.message ?? '隔离运行器失败')
          if (event.type === 'cleanup-unconfirmed')
            setError('执行页面已关闭，但没有收到完整清理确认；本次不能计为卸载验收通过。')
          if (event.type === 'stopped' || event.type === 'cleanup-unconfirmed')
            session.current = null
        },
      })
    } catch (cause) {
      setError(String(cause))
      setPhase('error')
    }
  }
  const stop = () => {
    if (session.current) {
      setPhase('stopping')
      void session.current.dispose()
    }
  }
  const busy = ['loading', 'running', 'stopping'].includes(phase) || session.current !== null
  return (
    <section className="cli-repro" aria-label="MSW 隔离浏览器场景">
      <h3>真实浏览器请求拦截</h3>
      <p>
        复用本条目的 MSW handlers，在独立端口执行。每次会话使用独立 Service Worker
        作用域，停止时只注销本次注册。
      </p>
      {window.location.origin !== APP_ORIGIN ? (
        <p role="alert">本地运行器仅允许 {APP_ORIGIN}。请从该地址打开 Library Lab。</p>
      ) : (
        <div className="demo-controls">
          <button type="button" disabled={busy} onClick={start}>
            运行 MSW 浏览器场景
          </button>
          <button type="button" disabled={!session.current || phase === 'stopping'} onClick={stop}>
            停止 MSW 并清理
          </button>
        </div>
      )}
      <p role="status">
        {
          (
            {
              idle: '尚未启动',
              loading: '正在加载独立运行器',
              running: '正在执行真实请求',
              result: '已收到浏览器请求结果',
              stopping: '正在停止并注销本次 Worker',
              stopped: '已停止，本次作用域已清理',
              'cleanup-unconfirmed': '清理未确认',
              error: '运行失败',
            } as Record<string, string>
          )[phase]
        }
      </p>
      {error && <p role="alert">{error}</p>}
      {requests.length > 0 && (
        <table>
          <caption>当前会话的实际响应</caption>
          <thead>
            <tr>
              <th>方法</th>
              <th>HTTP 状态</th>
              <th>响应内容</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={JSON.stringify([request.method, request.url, request.status, request.body])}>
                <td>{request.method}</td>
                <td>{request.status}</td>
                <td>
                  <code>{request.body}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {scope && (
        <details>
          <summary>查看隔离作用域</summary>
          <code>{scope}</code>
        </details>
      )}
      <p>
        页面观察不会自动写入 SDK PASS；正式验收需要记录器生成的日志与收据。浏览器运行器源码位于{' '}
        <code>runners/msw/main.mjs</code>，Node 示例命令仍保留在上方。
      </p>
    </section>
  )
}
