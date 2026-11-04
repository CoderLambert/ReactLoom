import { useEffect, useRef, useState } from 'react'
import { createGanttFrameSession, type GanttFrameEvent } from '../lib/gantt-frame-session.mjs'
import type { Demo } from '../lib/types'

export default function IsolatedGanttPanel({ level }: { level: Demo['level'] }) {
  const container = useRef<HTMLDivElement>(null)
  const [event, setEvent] = useState<GanttFrameEvent>({ type: 'loading' })
  useEffect(() => {
    if (!container.current) return
    let alive = true
    try {
      const session = createGanttFrameSession({
        container: container.current,
        level,
        onEvent: (next) => {
          if (alive) setEvent(next)
        },
      })
      return () => {
        alive = false
        session.dispose()
      }
    } catch (error) {
      setEvent({ type: 'error', message: String(error) })
    }
    return () => {
      alive = false
    }
  }, [level])
  return (
    <section aria-label="Frappe Gantt 独立运行环境">
      <p role="status">
        {event.type === 'running'
          ? '甘特图已在独立文档中运行'
          : event.type === 'error'
            ? '隔离示例运行失败'
            : '正在加载独立甘特图示例…'}
      </p>
      {event.type === 'error' && <p role="alert">{event.message}</p>}
      <div ref={container} />
    </section>
  )
}
