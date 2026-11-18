import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Toaster, toast } from 'sonner'
import { LatestRunGuard } from './latest-run'
import './sonner-demo.css'

type Level = 'basic' | 'business' | 'advanced'
const NOTICE_MS = 3500
const TASK_MS = 900

export default function SonnerExample({ level }: { level: Level }) {
  const instanceId = useId()
  const toasterId = `b20-${instanceId}`
  const [saved, setSaved] = useState(false)
  const [result, setResult] = useState('未执行')
  const [failure, setFailure] = useState(false)
  const [lastToastId, setLastToastId] = useState<string | number | null>(null)
  const owned = useRef<Set<string | number>>(new Set())
  const timers = useRef<Set<number>>(new Set())
  const latestRun = useRef(new LatestRunGuard())
  const runningToast = useRef<string | number | null>(null)
  const saveOwner = useRef(new LatestRunGuard())
  const savedToast = useRef<string | number | null>(null)

  const clearPending = useCallback(() => {
    for (const timer of timers.current) window.clearTimeout(timer)
    timers.current.clear()
    if (runningToast.current !== null) {
      toast.dismiss(runningToast.current)
      owned.current.delete(runningToast.current)
      runningToast.current = null
    }
  }, [])

  const clearOwn = useCallback(() => {
    latestRun.current.invalidate()
    saveOwner.current.invalidate()
    savedToast.current = null
    clearPending()
    // IDs are from this instance only; never dismiss the whole application.
    for (const id of owned.current) toast.dismiss(id)
    owned.current.clear()
  }, [clearPending])

  // biome-ignore lint/correctness/useExhaustiveDependencies: level changes intentionally reset this instance's draft and cancel its previous work.
  useEffect(() => {
    // A public level change starts a fresh local workshop, just like a new mount.
    setSaved(false)
    setFailure(false)
    setResult('未执行')
    setLastToastId(null)
    return clearOwn
  }, [level, clearOwn])

  function remember(id: string | number) {
    owned.current.add(id)
    setLastToastId(id)
  }

  function notifyBasic() {
    remember(
      toast('已订阅：前端工程', {
        toasterId,
        duration: NOTICE_MS,
        testId: `${toasterId}-notice`,
        description: '操作成功，短通知不会阻断后续工作。',
      }),
    )
    setResult('已触发基本通知')
  }

  function saveNews() {
    const token = saveOwner.current.start()
    if (savedToast.current !== null) {
      toast.dismiss(savedToast.current)
      owned.current.delete(savedToast.current)
    }
    setSaved(true)
    setResult('新闻已加入稍后阅读')
    const id = toast.success('已加入稍后阅读', {
      toasterId,
      duration: NOTICE_MS,
      description: '只有最新一次保存拥有撤销权；关闭通知不撤销保存。',
      action: {
        label: '撤销',
        onClick: () => {
          if (!saveOwner.current.isCurrent(token)) return
          saveOwner.current.invalidate()
          savedToast.current = null
          setSaved(false)
          setResult('已撤销最近一次保存')
        },
      },
    })
    savedToast.current = id
    remember(id)
  }

  function simulateTask() {
    const token = latestRun.current.start()
    clearPending()
    const shouldFail = failure
    const id = toast.loading('正在处理本地演示任务…', {
      toasterId,
      duration: Infinity,
      testId: `${toasterId}-task-${token}`,
    })
    remember(id)
    runningToast.current = id
    setResult('任务进行中')
    const timer = window.setTimeout(() => {
      timers.current.delete(timer)
      if (!latestRun.current.isCurrent(token)) return
      runningToast.current = null
      // SDK updates merge old options: explicitly replace loading's Infinity.
      if (shouldFail) {
        toast.error('处理失败，请稍后重试', {
          id,
          toasterId,
          duration: NOTICE_MS,
          description: '只是可控的本地演示失败，不是后端错误。',
        })
        setResult('任务失败')
      } else {
        toast.success('任务处理完成', {
          id,
          toasterId,
          duration: NOTICE_MS,
          description: '通过相同 toast id 更新，而非堆叠新通知。',
        })
        setResult('任务成功')
      }
    }, TASK_MS)
    timers.current.add(timer)
  }

  function cancelOwn() {
    clearOwn()
    setResult('已停止并清理此演示通知')
  }

  return (
    <section
      aria-label="Sonner 通知真实示例"
      className="b20-workshop"
      data-testid="b20-workshop"
      data-level={level}
    >
      <h2>
        {level === 'basic'
          ? '通知与业务反馈分开'
          : level === 'business'
            ? '最新保存的一次撤销'
            : '同 id 更新、失败与取消'}
      </h2>
      <p>
        通知由真实 Sonner 渲染；业务状态保存在本地 React 中。本例没有外部请求，900ms 任务只是本地
        fixture。
      </p>
      <div className="b20-controls">
        {level === 'basic' && (
          <button type="button" onClick={notifyBasic}>
            触发订阅成功提示
          </button>
        )}
        {level === 'business' && (
          <button type="button" onClick={saveNews}>
            保存新闻并显示撤销
          </button>
        )}
        {level === 'advanced' && (
          <>
            <label>
              <input
                type="checkbox"
                checked={failure}
                onChange={(event) => setFailure(event.currentTarget.checked)}
              />
              模拟业务失败
            </label>
            <button type="button" onClick={simulateTask}>
              运行异步反馈
            </button>
            <button type="button" onClick={cancelOwn}>
              取消并清理本演示
            </button>
          </>
        )}
      </div>
      {level === 'business' && (
        <p>
          稍后阅读状态：<strong data-testid="b20-saved">{saved ? '已保存' : '未保存'}</strong>
        </p>
      )}
      <p role="status" data-testid="b20-result">
        业务状态：{result}
      </p>
      <p className="b20-note">
        最近创建的真实 toast id：
        <output data-testid="b20-toast-id">{lastToastId ?? '尚未创建'}</output>
        。这是历史读数，通知关闭后不会清空业务结果。
      </p>
      <p className="b20-note">
        普通通知和任务终态在 3.5 秒后自动关闭；悬停、交互或页面隐藏会暂停 SDK
        倒计时。取消只清理本实例创建的通知和900ms计时器；关闭或超时不会撤销业务。离开此示例也会清理。
      </p>
      <Toaster
        id={toasterId}
        position="bottom-right"
        theme="light"
        richColors
        closeButton
        duration={NOTICE_MS}
        visibleToasts={3}
        hotkey={[]}
        customAriaLabel="本演示通知"
        toastOptions={{ closeButtonAriaLabel: '关闭通知' }}
      />
    </section>
  )
}
