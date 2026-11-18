import { useEffect, useReducer, useRef, useState } from 'react'
import { Streamdown } from 'streamdown'
import { fixtures } from './fixtures.mjs'
import { markdownPolicy } from './markdown-policy.mjs'
import type { SessionAction } from './stream-session.mjs'
import { initialSession, transitionSession } from './stream-session.mjs'
import 'streamdown/styles.css'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'

const stateLabels = {
  ready: '等待输入',
  playing: '正在接收',
  paused: '已暂停',
  completed: '接收完成',
  ended: '已提前结束',
}

function StreamingWorkshop({ level }: { level: 'basic' | 'business' }) {
  const fixture = fixtures[level]
  const [session, dispatch] = useReducer(
    (state: typeof initialSession, action: SessionAction) =>
      transitionSession(state, action, fixture.chunks),
    initialSession,
  )
  const [repairIncomplete, setRepairIncomplete] = useState(true)
  const timerRef = useRef<number | null>(null)
  const playing = session.status === 'playing'
  const finished = session.status === 'completed' || session.status === 'ended'
  const nextDelta = fixture.chunks[session.received]

  function stopTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function stop(action: 'pause' | 'end' | 'reset') {
    stopTimer()
    dispatch({ type: action })
  }

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => dispatch({ type: 'tick' }), 700)
    timerRef.current = timer
    return () => {
      window.clearInterval(timer)
      if (timerRef.current === timer) timerRef.current = null
    }
  }, [playing])

  return (
    <section
      className="e11-workshop"
      aria-label="Streamdown 累计正文实验"
      data-testid="e11-workshop"
      data-state={session.status}
    >
      <h2>{fixture.title}</h2>
      <p>{fixture.objective}</p>
      <p className="e11-fixture-note">
        输入为本地固定 Markdown，共 {fixture.chunks.length} 段；真实 Streamdown 2.6.0
        负责渲染。这里没有模型、网络传输或服务端会话。
      </p>

      <div className="e11-controls">
        <button
          type="button"
          disabled={playing || finished}
          onClick={() => dispatch({ type: 'start' })}
        >
          {session.received ? '继续自动追加' : '开始自动追加'}
        </button>
        <button type="button" disabled={!playing} onClick={() => stop('pause')}>
          暂停
        </button>
        <button
          type="button"
          disabled={playing || finished}
          onClick={() => dispatch({ type: 'next' })}
        >
          追加下一段
        </button>
        <button type="button" disabled={!session.received || finished} onClick={() => stop('end')}>
          提前结束
        </button>
        <button type="button" onClick={() => stop('reset')}>
          重置
        </button>
      </div>

      {level === 'basic' && (
        <label className="e11-toggle">
          <input
            type="checkbox"
            checked={repairIncomplete}
            onChange={(event) => setRepairIncomplete(event.target.checked)}
          />
          修复未闭合语法
        </label>
      )}

      <p role="status" data-testid="e11-status">
        {stateLabels[session.status]} · 已接收 {session.received} / {fixture.chunks.length} 段 ·
        累计 {Array.from(session.markdown).length} 字符 · 自动追加：
        {playing ? '运行中' : '已停止'}
      </p>
      <progress
        aria-label="接收进度"
        data-testid="e11-progress"
        max={fixture.chunks.length}
        value={session.received}
      />
      {session.status === 'ended' && <p>保留已接收的正文，不补齐剩余输入。重置后可开始新一轮。</p>}

      <div className="e11-data-flow">
        <section aria-label="输入分段">
          <h3>1. 下一段输入 delta</h3>
          <p>自动追加每 700ms 接收一段；手动追加便于停在未闭合语法处。</p>
          <pre data-testid="e11-next-delta">
            {finished ? '本轮已结束' : JSON.stringify(nextDelta)}
          </pre>
        </section>
        <section aria-label="累计 Markdown">
          <h3>2. 传给 children 的累计正文</h3>
          <pre data-testid="e11-markdown-source">{session.markdown || '（空）'}</pre>
        </section>
      </div>

      <section aria-label="实际 Markdown 渲染">
        <h3>3. Streamdown 的实际输出</h3>
        <div className="e11-rendered" data-testid="e11-rendered">
          {session.markdown ? (
            <Streamdown
              // 2.6.0's memo comparator omits parseIncompleteMarkdown. Recreate only
              // the renderer when this option changes; retain the input session.
              key={repairIncomplete ? 'repair-enabled' : 'repair-disabled'}
              {...markdownPolicy}
              mode="streaming"
              parseIncompleteMarkdown={repairIncomplete}
              isAnimating={playing}
            >
              {session.markdown}
            </Streamdown>
          ) : (
            <p>开始或追加下一段，观察真实输出。</p>
          )}
        </div>
      </section>
      <p className="e11-fixture-note">
        {level === 'business'
          ? '本例自建输出策略：只开放 streamdown.ai 的 HTTPS 链接；其他链接转为文字；图片转为占位说明；skipHtml 忽略原始 HTML。默认插件保持启用。'
          : '停在第 2 段切换修复开关：累计源文保持原样，只有渲染结果变化。isAnimating 表示接收阶段，不会自行请求模型或生成文字动画。'}
      </p>
    </section>
  )
}

export default function StreamingMarkdownExample({ level }: { level: Level }) {
  const selected = level === 'business' ? 'business' : 'basic'
  return <StreamingWorkshop key={selected} level={selected} />
}
