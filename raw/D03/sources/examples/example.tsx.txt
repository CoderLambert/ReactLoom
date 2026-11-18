import pLimit from 'p-limit'
import { useEffect, useRef, useState } from 'react'
import { cancelUnsettledJobs, transitionJob } from './job-policy.mjs'
import './workshop.css'

type Props = { level: 'basic' | 'business' | 'advanced' }
type JobState = 'queued' | 'running' | 'done' | 'error' | 'cancelled'
type Job = { id: number; state: JobState }
type Batch = { controller: AbortController; clearQueue: () => void }

function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('已取消', 'AbortError'))
      return
    }
    const finish = () => {
      signal.removeEventListener('abort', cancel)
      resolve()
    }
    const timer = window.setTimeout(finish, ms)
    const cancel = () => {
      window.clearTimeout(timer)
      signal.removeEventListener('abort', cancel)
      reject(new DOMException('已取消', 'AbortError'))
    }
    signal.addEventListener('abort', cancel, { once: true })
  })
}

export default function ConcurrencyExample({ level }: Props) {
  const [concurrency, setConcurrency] = useState(2)
  const [jobs, setJobs] = useState<Job[]>([])
  const [running, setRunning] = useState(false)
  const [counts, setCounts] = useState({ active: 0, pending: 0 })
  const [peak, setPeak] = useState(0)
  const [status, setStatus] = useState('尚未运行')
  const generation = useRef(0)
  const current = useRef<Batch | null>(null)

  useEffect(
    () => () => {
      generation.current++
      current.current?.controller.abort()
      current.current?.clearQueue()
      current.current = null
    },
    [],
  )

  // Switching demo levels is a new ownership epoch, not a continuation of old jobs.
  const previousLevel = useRef(level)
  useEffect(() => {
    if (previousLevel.current === level) return
    previousLevel.current = level
    generation.current++
    current.current?.controller.abort()
    current.current?.clearQueue()
    current.current = null
    setJobs([])
    setRunning(false)
    setCounts({ active: 0, pending: 0 })
    setPeak(0)
    setStatus('已切换演示层级，旧批次终止')
  }, [level])

  function cancel() {
    if (!current.current) return
    // 先中止正在运行的任务，再让队列上未开始的 Promise 以 AbortError 结算。
    current.current.controller.abort()
    current.current.clearQueue()
    setJobs(cancelUnsettledJobs)
    setStatus('正在取消批次…')
  }

  async function run() {
    current.current?.controller.abort()
    current.current?.clearQueue()
    const token = ++generation.current
    const controller = new AbortController()
    // p-limit v7.3.3：rejectOnClear=true 保证 clearQueue 不留下永不结算的 Promise。
    const limit = pLimit({ concurrency, rejectOnClear: true })
    let activeWork = 0
    let measuredPeak = 0
    current.current = { controller, clearQueue: () => limit.clearQueue() }
    const total = level === 'basic' ? 6 : 10
    setJobs(Array.from({ length: total }, (_, index) => ({ id: index + 1, state: 'queued' })))
    setRunning(true)
    setPeak(0)
    setStatus('正在执行真实 p-limit 批次')

    function update(id: number, state: JobState) {
      if (token !== generation.current) return
      setJobs((old) => transitionJob(old, id, state))
      setCounts({ active: limit.activeCount, pending: limit.pendingCount })
    }

    const tasks = Array.from({ length: total }, (_, index) =>
      limit(async () => {
        const jobId = index + 1
        if (controller.signal.aborted) {
          update(jobId, 'cancelled')
          return
        }
        activeWork++
        measuredPeak = Math.max(measuredPeak, activeWork)
        if (token === generation.current) setPeak(measuredPeak)
        update(jobId, 'running')
        try {
          // 只有本地延迟，不发出真实 HTTP/API 请求。
          await pause(220 + (index % 3) * 110, controller.signal)
          if (controller.signal.aborted) {
            update(jobId, 'cancelled')
            return
          }
          if (level === 'advanced' && jobId === 4) {
            throw new Error('本地 fixture：任务 4 失败')
          }
          update(jobId, 'done')
        } catch (error) {
          if (controller.signal.aborted) {
            update(jobId, 'cancelled')
            return
          }
          update(jobId, 'error')
          throw error
        } finally {
          activeWork--
        }
      }),
    )

    // Read actual SDK values after enqueueing, rather than inventing a pending count.
    setCounts({ active: limit.activeCount, pending: limit.pendingCount })
    const outcomes = await Promise.allSettled(tasks)
    if (token !== generation.current) return
    // 被 clearQueue 拒绝的任务尚未运行，需在 UI 中补齐 cancelled 标记。
    if (controller.signal.aborted) {
      setJobs(cancelUnsettledJobs)
    }
    setCounts({ active: limit.activeCount, pending: limit.pendingCount })
    setRunning(false)
    setStatus(
      controller.signal.aborted
        ? '已取消：运行中任务中断，排队任务被拒绝并结算'
        : `执行结束：${outcomes.filter((outcome) => outcome.status === 'rejected').length} 个失败，其他任务继续完成`,
    )
    current.current = null
  }

  return (
    <section className="d03-workshop" aria-label="p-limit 真实并发调度">
      <h2>
        {level === 'basic'
          ? '同时最多 N 个任务'
          : level === 'business'
            ? '新闻摘要批处理'
            : '取消与失败隔离'}
      </h2>
      <p>真实 p-limit 负责调度，工作负载为本地延时 fixture；没有外部网络或收费请求。</p>
      <p>
        {level === 'basic'
          ? '先选并发 1 或 4 运行同一批6个任务，对照运行、排队、完成与回调实测峰值。'
          : level === 'advanced'
            ? '这批10个任务中，4号会抛出本地错误，其它继续；也可以中途取消，区分清队列与中止已运行工作。'
            : '兼容旧业务入口：10个本地任务均可完成，调度和取消方式与基础场景相同。'}
      </p>
      <div className="demo-controls">
        <label>
          并发数{' '}
          <select
            value={concurrency}
            disabled={running}
            onChange={(event) => setConcurrency(Number(event.target.value))}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button type="button" disabled={running} onClick={() => void run()}>
          运行批处理
        </button>
        <button type="button" disabled={!running} onClick={cancel}>
          取消任务
        </button>
      </div>
      <p role="status">{status}</p>
      <p data-testid="d03-sdk-counts">
        SDK最近一次观察：activeCount {counts.active} / pendingCount {counts.pending}
      </p>
      <dl className="d03-metrics" data-testid="d03-metrics">
        <div>
          <dt>运行中</dt>
          <dd>{jobs.filter((job) => job.state === 'running').length}</dd>
        </div>
        <div>
          <dt>排队中</dt>
          <dd>{jobs.filter((job) => job.state === 'queued').length}</dd>
        </div>
        <div>
          <dt>完成</dt>
          <dd>{jobs.filter((job) => job.state === 'done').length}</dd>
        </div>
        <div>
          <dt>失败</dt>
          <dd>{jobs.filter((job) => job.state === 'error').length}</dd>
        </div>
        <div>
          <dt>已取消</dt>
          <dd>{jobs.filter((job) => job.state === 'cancelled').length}</dd>
        </div>
        <div>
          <dt>实测峰值</dt>
          <dd data-testid="d03-peak">{peak}</dd>
        </div>
      </dl>
      <div className="demo-jobs">
        {jobs.map((job) => (
          <div key={job.id} className="demo-job" data-state={job.state}>
            任务 {job.id}
            <strong>{job.state}</strong>
          </div>
        ))}
      </div>
      <p>
        并发上限 ≠ 每秒速率。运行中任务通过 AbortSignal 终止； 未启动队列通过 rejectOnClear=true +
        clearQueue 拒绝。
      </p>
      <p>
        峰值在每个真实limit回调开始时计数、finally归还；任务计数来自同一批卡片状态。
        SDK读数是事件时的快照，内部交接可能短暂不同，不当作第二份任务状态。重新运行会清零峰值。
      </p>
    </section>
  )
}
