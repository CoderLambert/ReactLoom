import { useCallback, useEffect, useRef, useState } from 'react'
import { createReplicaRuntime, empty, type View } from './runtime'

type Level = 'basic' | 'business' | 'advanced'
type Props = { level: Level }
export default function YjsExample({ level }: Props) {
  const pair = useRef<ReturnType<typeof createReplicaRuntime> | null>(null)

  const [view, setView] = useState<View>(empty)
  const [stats, setStats] = useState({ transactions: 0, pending: 0 })
  const refresh = useCallback((current: ReturnType<typeof createReplicaRuntime>) => {
    const next = current.inspect()
    setView(next)
    setStats(next)
  }, [])
  const [log, setLog] = useState('两份 Y.Doc 尚未交换任何二进制更新')
  useEffect(() => {
    const local = createReplicaRuntime()
    pair.current = local
    refresh(local)
    return () => {
      if (pair.current === local) pair.current = null
      local.destroy()
    }
  }, [refresh])
  function change(which: 'left' | 'right') {
    const current = pair.current
    if (!current) return
    current.add(which)
    refresh(current)
    setLog(`${which} 离线写入，另一副本尚未更新`)
  }
  function conflict() {
    const current = pair.current
    if (!current) return
    current.conflict()
    refresh(current)
    setLog('两个副本在相同键上独立修改，胜出者不由本Demo预设')
  }
  function synchronize(replay = false) {
    const current = pair.current
    if (!current) return
    try {
      const result = current.sync(replay)
      refresh(current)
      setLog(
        `同步完成：A→B ${result.bytesToRight} 字节；B→A ${result.bytesToLeft} 字节；逆序本地更新 ${result.replayedUpdates} 条`,
      )
    } catch (e) {
      setLog(`已拒绝合并：${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return (
    <section aria-label="Yjs 双副本 CRDT 真实演示">
      <h2>
        {level === 'basic'
          ? 'Y.Map 和事务'
          : level === 'business'
            ? '断网双端独立编辑及合并'
            : '相同键并发冲突的收敛'}
      </h2>
      <p>下面是两份真实 Y.Doc，所有更改只发生在内存中；没有网络、持久化、意识广播或登录权限。</p>
      <div className="demo-controls">
        <button type="button" onClick={() => change('left')}>
          A 添加 RSS
        </button>
        {level !== 'basic' && (
          <button type="button" onClick={() => change('right')}>
            B 离线添加
          </button>
        )}
        {level === 'advanced' && (
          <button type="button" onClick={conflict}>
            同时编辑 title
          </button>
        )}
        {level !== 'basic' && (
          <button type="button" onClick={() => synchronize()}>
            交换增量并合并
          </button>
        )}
        {level === 'advanced' && (
          <>
            <button type="button" onClick={() => synchronize(true)}>
              乱序+重复投递检验
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  pair.current?.rejectWrongScope()
                } catch (e) {
                  setLog(`已拒绝合并：${e instanceof Error ? e.message : String(e)}`)
                }
              }}
            >
              拒绝错误文档信封
            </button>
          </>
        )}
      </div>
      <p data-testid="yjs-stats">
        本地事务 {stats.transactions} · 待传更新 {stats.pending}
      </p>
      <p role="status">{log}</p>
      <div className="demo-jobs">
        <div className="demo-output">
          <h3>副本 A</h3>
          <pre data-testid="yjs-a">{JSON.stringify(view.left, null, 2)}</pre>
          {level === 'advanced' && <p data-testid="yjs-title-a">标题：{view.leftTitle}</p>}
        </div>
        {level !== 'basic' && (
          <div className="demo-output">
            <h3>副本 B</h3>
            <pre data-testid="yjs-b">{JSON.stringify(view.right, null, 2)}</pre>
            {level === 'advanced' && <p data-testid="yjs-title-b">标题：{view.rightTitle}</p>}
          </div>
        )}
      </div>
      {level === 'advanced' && (
        <p>
          相同更新重复投递仍应收敛；64 KiB
          演示上限和本地文档标识只防误操作，不代表联网鉴权。收敛不等于业务“最新”标题。
        </p>
      )}
    </section>
  )
}
