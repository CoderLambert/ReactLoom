import {useEffect,useRef,useState} from 'react'

export type Tone = 'neutral' | 'success' | 'blocked'
export interface StatusCardProps {
  title: string
  tone: Tone
  onArchive?: () => void | Promise<void>
}

type ArchiveState = 'idle' | 'saving' | 'done' | 'error'

export function StatusCard({title,tone,onArchive}: StatusCardProps) {
  const [state,setState] = useState<ArchiveState>('idle')
  const generation = useRef(0)
  const inFlight = useRef(false)

  useEffect(() => () => {generation.current++}, [])
  useEffect(() => {
    // Story args may change while a previous async callback is unresolved.
    generation.current++
    inFlight.current = false
    setState('idle')
  }, [title,tone])

  async function archive() {
    if (tone === 'blocked' || inFlight.current || state === 'done') return
    const token = ++generation.current
    inFlight.current = true
    setState('saving')
    try {
      await onArchive?.()
      if (token === generation.current) setState('done')
    } catch {
      if (token === generation.current) setState('error')
    } finally {
      if (token === generation.current) inFlight.current = false
    }
  }

  const blocked = tone === 'blocked'
  const disabled = blocked || state === 'saving' || state === 'done'
  const message = blocked ? '等待审核' :
    state === 'saving' ? '正在归档' :
    state === 'error' ? '归档失败，可重试' :
    state === 'done' ? '已归档' :
    tone === 'success' ? '任务成功' : '待处理'

  return <article aria-label={`${title} 状态卡`} aria-busy={state === 'saving'} style={{
    border:'1px solid #cbd8cc',borderRadius:10,padding:20,maxWidth:410,background:'#f7faf7',
  }}>
    <h2>{title}</h2>
    <p role="status">{message}</p>
    <button type="button" disabled={disabled} onClick={()=>void archive()}>
      {state === 'saving' ? '归档中…' : state === 'done' ? '已归档' : '归档当前项'}
    </button>
  </article>
}
