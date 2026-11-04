import { useEffect, useState } from 'react'
import type { Level } from '../lib/types'
import {
  beginWorkerObservation,
  failWorkerObservation,
  observeWorkerReply,
  serializeWorkerObservation,
  type WorkerObservation,
} from '../lib/worker-observation.mjs'
import { parseWorkerReply, workerStartMessage } from '../lib/worker-protocol.mjs'

type Props = {
  createWorker: () => Worker
  level: Level
  entryId: string
  demoId: string
  sourceFingerprint: string
}
const OUTCOMES: Record<WorkerObservation['outcome'], string> = {
  running: '正在执行',
  'worker-reported-result': 'Worker 报告执行结束（未经 SDK 验证）',
  'worker-reported-error': 'Worker 报告执行失败',
  'host-error': '宿主检测到运行错误',
  timeout: '超时，Worker 已终止',
}

/** No Service Worker or global listener. Observations stay local until explicitly copied. */
export default function WorkerHost({
  createWorker,
  level,
  entryId,
  demoId,
  sourceFingerprint,
}: Props) {
  const [report, setReport] = useState<WorkerObservation | null>(null)
  const [copyState, setCopyState] = useState('')
  useEffect(() => {
    let live = true
    let finished = false
    let worker: Worker | undefined
    const runId =
      globalThis.crypto?.randomUUID?.() ??
      `lab-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    setReport(
      beginWorkerObservation({
        runId,
        entryId,
        demoId,
        level,
        sourceFingerprint,
        startedAt: Date.now(),
      }),
    )
    setCopyState('')
    let timer: ReturnType<typeof setTimeout> | undefined
    const close = () => {
      if (timer !== undefined) clearTimeout(timer)
      timer = undefined
      if (worker) {
        worker.onmessage = null
        worker.onerror = null
        worker.onmessageerror = null
        worker.terminate()
        worker = undefined
      }
    }
    const fail = (message: string, kind: 'host-error' | 'timeout' = 'host-error') => {
      if (!live || finished) return
      finished = true
      setReport((old) =>
        old?.runId === runId ? failWorkerObservation(old, message, Date.now(), kind) : old,
      )
      close()
    }
    try {
      worker = createWorker()
      worker.onmessage = (event) => {
        if (!live || finished) return
        const reply = parseWorkerReply(event.data, runId)
        if (!reply) return
        setReport((old) =>
          old?.runId === runId ? observeWorkerReply(old, reply, Date.now()) : old,
        )
        if (reply.type === 'result' || reply.type === 'error') {
          finished = true
          close()
        }
      }
      worker.onerror = (event) => fail(`Worker error: ${event.message || '未知异常'}`)
      worker.onmessageerror = () => fail('Worker 返回了无法反序列化的消息')
      timer = setTimeout(() => fail('示例超过45秒执行限额，Worker 已终止', 'timeout'), 45_000)
      worker.postMessage(workerStartMessage(level, runId))
    } catch (error) {
      fail(String(error))
    }
    return () => {
      live = false
      finished = true
      close()
    }
  }, [createWorker, level, entryId, demoId, sourceFingerprint])

  const copyReport = async () => {
    if (!report || report.outcome === 'running') return
    try {
      await navigator.clipboard.writeText(serializeWorkerObservation(report))
      setCopyState('观察报告已复制')
    } catch {
      setCopyState('复制失败，请检查剪贴板权限')
    }
  }
  return (
    <section aria-label="隔离 Worker 示例">
      <h3>独立 Web Worker</h3>
      <p>
        示例在专用 Worker 中运行；关闭、切换或重置会终止该 Worker。Worker 不是不可信代码的安全沙箱。
      </p>
      <p role="status">{report ? OUTCOMES[report.outcome] : '正在启动'}</p>
      <pre role="log" aria-label="Worker 运行日志">
        <code>{report?.log.join('\n')}</code>
      </pre>
      {report && (
        <div className="demo-controls">
          <small>
            记录 {report.runId} · {report.log.length} 条 · 当前源码指纹已关联
          </small>
          <button
            type="button"
            disabled={report.outcome === 'running'}
            onClick={() => void copyReport()}
          >
            复制本次 Worker 观察报告
          </button>
          <span role="status">{copyState}</span>
        </div>
      )}
      <p className="notice">
        复制报告只记录浏览器观察到的消息、运行阶段和当前目录源码指纹；Worker 自述的成功不等于
        SDK、构建或浏览器验收 PASS，也不会更新 verification.json。
      </p>
    </section>
  )
}
