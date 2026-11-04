import { lazy, Suspense, useEffect, useMemo, useState } from 'react'

const WorkerHost = lazy(() => import('./worker-host'))
const IsolatedMswPanel = lazy(() => import('./isolated-msw-panel'))
const IsolatedGanttPanel = lazy(() => import('./isolated-gantt-panel'))

import { ErrorBoundary } from 'react-error-boundary'
import { demoLoaders } from '../generated/loaders'
import { workerFactories } from '../generated/worker-loaders'
import { JSON_RESPONSE_LIMITS, readLimitedJsonResponse } from '../lib/bounded-json.mjs'
import { CAPABILITY_DESCRIPTIONS, demoRunPolicy } from '../lib/demo-policy.mjs'
import { isRegisteredGanttDemo } from '../lib/gantt-frame-session.mjs'
import { packageInstallCommand } from '../lib/package-source.mjs'
import { reproductionCommand } from '../lib/reproduction.mjs'
import { requestGeneratedResource } from '../lib/resource-fetch.mjs'
import {
  readBoundedSourceResponse,
  sourceTextPath,
  validateSourceIndex,
  verifySourceIndexDigest,
} from '../lib/source-integrity.mjs'
import { sourceLanguage } from '../lib/source-language.mjs'
import type { Demo, Entry, SourceMetadata } from '../lib/types'
import HighlightCode from './highlight-code'

function SourceViewer({
  entryId,
  demo,
  indexDigest,
}: {
  entryId: string
  demo: Demo
  indexDigest: string
}) {
  const [files, setFiles] = useState<SourceMetadata[]>([])
  const [selected, setSelected] = useState('')
  const [content, setContent] = useState('')
  const [loadedKey, setLoadedKey] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)
  const [copyState, setCopyState] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    setFiles([])
    setSelected('')
    setError('')
    requestGeneratedResource(
      import.meta.env.BASE_URL + 'raw/' + entryId + '/source-index.json',
      (response) => readLimitedJsonResponse(response, JSON_RESPONSE_LIMITS.sourceIndex),
      { signal: controller.signal },
    )
      .then(async (items: unknown) => {
        if (controller.signal.aborted) return
        const relevant = validateSourceIndex(items, demo.sourceFiles)
        await verifySourceIndexDigest(items, indexDigest)
        if (controller.signal.aborted) return
        setFiles(relevant)
        setSelected(relevant[0]?.path ?? '')
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(String(cause))
      })
    return () => controller.abort()
  }, [entryId, demo, indexDigest])
  const current = files.find((file) => file.path === selected)
  const currentKey = current ? `${entryId}/${current.path}/${current.sha256}` : ''
  // Never show or copy a previous file while a newly selected file is loading.
  const ready = Boolean(current && loadedKey === currentKey && !loading && !error)
  useEffect(() => {
    if (!current) {
      setContent('')
      setLoadedKey('')
      setVerified(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setContent('')
    setLoadedKey('')
    setVerified(false)
    setCopyState('')
    const encoded = sourceTextPath(current.path).split('/').map(encodeURIComponent).join('/')
    requestGeneratedResource(
      import.meta.env.BASE_URL + 'raw/' + entryId + '/sources/' + encoded,
      async (response) => {
        const source = await readBoundedSourceResponse(response, current.bytes)
        if (globalThis.crypto?.subtle) {
          const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source))
          const hash = Array.from(new Uint8Array(digest), (byte) =>
            byte.toString(16).padStart(2, '0'),
          ).join('')
          if (hash !== current.sha256)
            throw new Error('源码与生成索引的 SHA-256 不一致，请重新构建')
          if (!controller.signal.aborted) setVerified(true)
        }
        if (!controller.signal.aborted) {
          setContent(source)
          setLoadedKey(`${entryId}/${current.path}/${current.sha256}`)
        }
      },
      { signal: controller.signal },
    )
      .catch((cause) => {
        if (!controller.signal.aborted) setError(String(cause))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [entryId, current])
  const copy = async () => {
    if (!ready || !verified) return
    try {
      await navigator.clipboard.writeText(content)
      setCopyState('源码已复制')
    } catch {
      setCopyState('复制失败，请手动选择源码')
    }
  }
  return (
    <section className="source-viewer">
      <h3>真实源码</h3>
      <p>每个源码文件独立按需下载，文件内容来自运行示例；浏览器支持时校验 SHA-256。</p>
      {files.length > 0 && (
        <div className="demo-controls">
          <label>
            文件{' '}
            <select
              aria-label="查看源码文件"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {files.map((file) => (
                <option key={file.path} value={file.path}>
                  {file.path}
                </option>
              ))}
            </select>
          </label>
          <button type="button" disabled={!ready || !verified} onClick={() => void copy()}>
            复制源码
          </button>
          <span role="status">{copyState}</span>
        </div>
      )}
      {loading && <p role="status">正在按需读取当前文件…</p>}
      {error && <p role="alert">{error}</p>}
      {current && ready && (
        <>
          <HighlightCode code={content} language={sourceLanguage(current.path)} showCopy={false} />
          <small className="hash">
            SHA-256 {current.sha256} · {verified ? '已校验' : '未校验'} · {current.bytes} 字节
          </small>
        </>
      )}
      {!current && !error && <p className="notice">当前示例未列出可查看的源码文件。</p>}
    </section>
  )
}
function Reproduction({ entry, demo }: { entry: Entry; demo: Demo }) {
  const [feedback, setFeedback] = useState('')
  const command = reproductionCommand(entry, demo)
  return (
    <section className="cli-repro">
      <h3>{command ? '真实可复现的本地命令' : '隔离运行模式'}</h3>
      {command ? (
        <>
          <p>
            在 <code>packages/library-lab</code> 目录安装依赖后执行下方命令。Node.js 与 Vitest
            分别使用真实运行器；网页只展示命令，不执行任意 shell。
          </p>
          <pre>
            <code>{command}</code>
          </pre>
          <button
            type="button"
            onClick={() =>
              void navigator.clipboard
                .writeText(command)
                .then(() => setFeedback('命令已复制'))
                .catch(() => setFeedback('复制失败，请手动选择'))
            }
          >
            复制运行命令
          </button>
          <p role="status">{feedback}</p>
        </>
      ) : (
        <p>
          当前示例需要专用 Worker 或隔离
          origin。未建立经过检查的宿主时仅显示源码和环境要求，不在主应用中隐式注册 Service Worker。
        </p>
      )}
      <p className="notice">
        执行和验证状态以本条目的 verification.json
        和有命令/日志的证据为准。请勿将网页展示等同于执行成功。
      </p>
    </section>
  )
}
export default function DemoHost({
  entry,
  demoId,
  onSelect,
}: {
  entry: Entry
  demoId?: string
  onSelect: (id: string) => void
}) {
  const demo = entry.demos.find((d) => d.demoId === demoId) ?? entry.demos[0]
  const key = `${entry.entryId}/${demo?.demoId ?? ''}`
  const [startedKey, setStartedKey] = useState<string | null>(null)
  const [attempt, setAttempt] = useState({ key, reset: 0 })
  // A scenario change must not inherit authorization from a previously started demo.
  const started = startedKey === key
  const loader = demoLoaders[key]
  const workerFactory = workerFactories[key]
  const policy = demoRunPolicy(demo)
  const gantt = isRegisteredGanttDemo(entry.entryId, demo)
  const run = useMemo(
    () => ({ ...attempt, Component: policy.mode === 'react' && loader ? lazy(loader) : null }),
    [loader, policy.mode, attempt],
  )
  const { Component } = run
  const canStart = Boolean(
    gantt || (policy.mode === 'react' && Component) || (policy.mode === 'worker' && workerFactory),
  )
  useEffect(() => {
    setStartedKey(null)
    setAttempt({ key, reset: 0 })
  }, [key])
  if (!demo)
    return (
      <div className="empty">
        <h2>真实示例正在接入</h2>
        <p>可以先阅读文档与 Agent 指南。当前条目未标记为已完成，也不会用模拟画面代替目标库。</p>
      </div>
    )
  return (
    <>
      <div className="demo-toolbar">
        <label>
          学习场景{' '}
          <select value={demo.demoId} onChange={(e) => onSelect(e.target.value)}>
            {entry.demos.map((d) => (
              <option key={d.demoId} value={d.demoId}>
                {{ basic: '入门', business: '业务', advanced: '边界' }[d.level]} · {d.title}
              </option>
            ))}
          </select>
        </label>
        <span className="badge">{demo.executionKind}</span>
      </div>
      <p>{demo.description}</p>
      {Boolean(demo.capabilities?.length) && (
        <section className="tags" aria-label="运行环境能力">
          {demo.capabilities?.map((cap) => (
            <span className="badge" key={cap}>
              {CAPABILITY_DESCRIPTIONS[cap] ?? cap}
            </span>
          ))}
        </section>
      )}
      <div className="install">
        <span>安装依赖</span>
        <code>{packageInstallCommand(entry.packages)}</code>
      </div>
      <div className="notice">
        示例源码已接入不等于真实运行验证通过。请核对页面上方的构建、SDK 与浏览器状态。
      </div>
      <div className="demo-stage">
        {canStart ? (
          started ? (
            <ErrorBoundary
              key={`${run.key}:${run.reset}`}
              fallbackRender={({ error, resetErrorBoundary }) => (
                <div role="alert">
                  <h3>这个示例加载失败</h3>
                  <p>{String(error)}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setAttempt((previous) => ({ key, reset: previous.reset + 1 }))
                      resetErrorBoundary()
                    }}
                  >
                    重新加载示例
                  </button>
                </div>
              )}
            >
              <Suspense fallback={<p role="status">正在加载当前示例…</p>}>
                {gantt ? (
                  <IsolatedGanttPanel level={demo.level} />
                ) : Component ? (
                  <Component level={demo.level} />
                ) : workerFactory ? (
                  <WorkerHost
                    createWorker={workerFactory}
                    level={demo.level}
                    entryId={entry.entryId}
                    demoId={demo.demoId}
                    sourceFingerprint={entry.sourceFingerprint}
                  />
                ) : null}
              </Suspense>
            </ErrorBoundary>
          ) : (
            <div className="start-demo">
              <span className="play-symbol" aria-hidden="true">
                ▷
              </span>
              <h3>按需启动，不占用其他页面资源</h3>
              <button className="primary" type="button" onClick={() => setStartedKey(key)}>
                运行当前示例
              </button>
            </div>
          )
        ) : policy.mode === 'reproduction' ? (
          <Reproduction entry={entry} demo={demo} />
        ) : (
          <section role="note" className="notice">
            {policy.mode === 'react' ? '当前示例尚未生成可加载的代码入口。' : policy.reason}
          </section>
        )}
      </div>
      {started && (
        <div className="demo-actions">
          <button
            type="button"
            onClick={() => setAttempt((previous) => ({ key, reset: previous.reset + 1 }))}
          >
            重置此示例
          </button>
          <button type="button" onClick={() => setStartedKey(null)}>
            停止并卸载
          </button>
        </div>
      )}
      {entry.entryId === 'F11' && (
        <Suspense fallback={<p role="status">正在加载浏览器运行面板…</p>}>
          <IsolatedMswPanel key={key} level={demo.level} />
        </Suspense>
      )}
      <SourceViewer entryId={entry.entryId} demo={demo} indexDigest={entry.sourceIndexSha256} />
    </>
  )
}
