import {useState} from 'react'

export type Tone = 'neutral' | 'success' | 'blocked'
export interface StatusCardProps {
  title: string
  tone: Tone
  onArchive?: () => void
}

export function StatusCard({title,tone,onArchive}: StatusCardProps) {
  const [archived,setArchived] = useState(false)
  return <article aria-label={`${title} 状态卡`} style={{
    border:'1px solid #cbd8cc',borderRadius:10,padding:20,maxWidth:410,background:'#f7faf7',
  }}>
    <h2>{title}</h2>
    <p role="status">
      {tone==='blocked'?'等待审核':tone==='success'?'任务成功':'待处理'}
      {archived?' · 已归档':''}
    </p>
    <button type="button" disabled={tone==='blocked'||archived} onClick={()=>{
      setArchived(true);onArchive?.()
    }}>{archived?'已归档':'归档当前项'}</button>
  </article>
}
