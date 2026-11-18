import * as Comlink from 'comlink'
import { useCallback, useEffect, useRef, useState } from 'react'
import { disposeSession } from './session-policy.mjs'
import type { WorkerAPI } from './worker-api'

type Props = { level: 'basic' | 'business' | 'advanced' }
type Session = { worker: Worker; remote: Comlink.Remote<WorkerAPI>; controller: AbortController }
export default function ComlinkWorkshop({ level }: Props) {
  const [input, setInput] = useState('react\nrss\nreact\n__proto__\nconstructor')
  const [invalid, setInvalid] = useState(true)
  const [result, setResult] = useState('Worker 尚未启动')
  const [lifecycle, setLifecycle] = useState('尚未创建')
  const [working, setWorking] = useState(false)
  const session = useRef<Session | null>(null)
  const epoch = useRef(0)

  const dispose = useCallback(() => {
    const active = session.current
    session.current = null
    return disposeSession(active)
  }, [])
  useEffect(
    () => () => {
      epoch.current++
      dispose()
    },
    [dispose],
  )

  async function execute() {
    if (session.current) return
    const current = ++epoch.current
    setWorking(true)
    setResult('启动单独的模块 Worker…')
    let worker: Worker
    try {
      worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    } catch (error) {
      setResult(`无法启动模块 Worker：${String(error)}`)
      setWorking(false)
      return
    }
    const remote = Comlink.wrap<WorkerAPI>(worker)
    const controller = new AbortController()
    session.current = { worker, remote, controller }
    setLifecycle('模块 Worker 已创建')
    let rejectFailure: (error: Error) => void = () => {}
    const failure = new Promise<never>((_, reject) => {
      rejectFailure = reject
    })
    const onError = (event: ErrorEvent) =>
      rejectFailure(new Error(`Worker 脚本异常：${event.message}`))
    const onMessageError = () => rejectFailure(new Error('Worker 消息无法反序列化'))
    const onAbort = () => rejectFailure(new DOMException('任务已取消', 'AbortError'))
    worker.addEventListener('error', onError)
    worker.addEventListener('messageerror', onMessageError)
    controller.signal.addEventListener('abort', onAbort, { once: true })
    const timeout = window.setTimeout(
      () => rejectFailure(new Error('RPC 超过 5 秒，终止本地 Worker')),
      5000,
    )
    try {
      let task: Promise<unknown>
      if (level === 'basic') {
        task = remote.summarize(input.split('\n'))
      } else if (level === 'business') {
        task = remote.summarize(invalid ? ['rss', 42] : ['rss', 'rss', 'worker'])
      } else {
        const bytes = new Uint8Array([5, 10, 15, 20, 25])
        task = remote.sumBytes(Comlink.transfer(bytes, [bytes.buffer])).then(async (sum) => {
          if (current !== epoch.current) throw new DOMException('旧会话', 'AbortError')
          const progress: number[] = []
          const done = await remote.progress(
            10,
            Comlink.proxy(async (step: number) => {
              if (current !== epoch.current) return
              progress.push(step)
              setResult(`Worker 已处理 ${step}/10`)
            }),
          )
          return {
            sum,
            detachedBytesOnMainThread: bytes.byteLength,
            progressEvents: progress,
            done,
          }
        })
      }
      const answer = await Promise.race([task, failure])
      if (current === epoch.current) setResult(JSON.stringify(answer, null, 2))
    } catch (error) {
      if (current === epoch.current) setResult(`Worker失败：${String(error)}`)
    } finally {
      window.clearTimeout(timeout)
      worker.removeEventListener('error', onError)
      worker.removeEventListener('messageerror', onMessageError)
      controller.signal.removeEventListener('abort', onAbort)
      if (current === epoch.current) {
        setLifecycle(dispose())
        setWorking(false)
      }
    }
  }
  function cancel() {
    epoch.current++
    setLifecycle(dispose())
    setWorking(false)
    setResult('Worker 已终止，旧异步结果不会回写')
  }
  return (
    <section aria-label="Comlink真实Worker示例">
      <h2>
        {level === 'basic'
          ? '真实 RPC：输入词频'
          : level === 'business'
            ? '远端校验错误与恢复'
            : 'Transferable、回调与取消'}
      </h2>
      <p>
        真实模块 Worker 计算，Comlink 负责 RPC；输入与 90ms 进度间隔是本地 fixture，不是性能基准。
      </p>
      {level === 'basic' && (
        <label>
          每行一个词
          <textarea
            value={input}
            disabled={working}
            onChange={(event) => setInput(event.target.value)}
          />
        </label>
      )}
      {level === 'business' && (
        <label>
          <input
            type="checkbox"
            checked={invalid}
            disabled={working}
            onChange={(event) => setInvalid(event.target.checked)}
          />
          发送含数字的非法数组
        </label>
      )}
      <div className="demo-controls">
        <button type="button" disabled={working} onClick={() => void execute()}>
          启动 Worker 任务
        </button>
        <button type="button" disabled={!working} onClick={cancel}>
          终止 Worker
        </button>
      </div>
      <output className="demo-output" aria-live="polite" data-testid="comlink-output">
        {result}
      </output>
      <p data-testid="comlink-lifecycle">{lifecycle}</p>
      <p>
        每批完成/失败/取消都会请求 releaseProxy 并 terminate；release 请求不是对端确认。未响应 RPC
        最多等待5秒。
      </p>
    </section>
  )
}
