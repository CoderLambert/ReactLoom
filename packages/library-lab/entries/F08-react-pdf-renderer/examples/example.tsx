import { pdf } from '@react-pdf/renderer'
import { useEffect, useRef, useState } from 'react'
import { type FeedRow, ReportDocument, validatedRows } from './report'

type Level = 'basic' | 'business' | 'advanced'
const baseRows: FeedRow[] = [
  { id: 'react', name: 'React Notes', articles: 18 },
  { id: 'devops', name: 'DevOps Weekly', articles: 26 },
  { id: 'security', name: 'Security Updates', articles: 11 },
]
export default function PdfRendererExample({ level }: { level: Level }) {
  return <PdfRendererSession key={level} level={level} />
}
function PdfRendererSession({ level }: { level: Level }) {
  const epoch = useRef(0),
    liveURL = useRef(''),
    running = useRef(false)
  const [state, setState] = useState('尚未生成')
  const [busy, setBusy] = useState(false),
    [url, setUrl] = useState(''),
    [bytes, setBytes] = useState(0)
  function releaseURL() {
    const old = liveURL.current
    liveURL.current = ''
    if (old) URL.revokeObjectURL(old)
  }
  useEffect(
    () => () => {
      epoch.current++
      const old = liveURL.current
      liveURL.current = ''
      if (old) URL.revokeObjectURL(old)
    },
    [],
  )
  async function generate(invalid = false) {
    if (running.current) return // immediate guard before React flushes disabled={busy}
    running.current = true
    const n = ++epoch.current
    setState('布局与PDF序列化进行中')
    setBusy(true)
    try {
      const rows =
        level === 'basic'
          ? baseRows.slice(0, 1)
          : level === 'business'
            ? baseRows
            : Array.from({ length: 100 }, (_, i) => ({
                id: `source-${i}`,
                name: `Local Feed ${i + 1}`,
                articles: (i * 7) % 50,
              }))
      const safe = validatedRows(
        invalid
          ? Array.from({ length: 141 }, (_, i) => ({
              id: `invalid-${i}`,
              name: 'Invalid count fixture',
              articles: 0,
            }))
          : rows,
      )
      const blob = await pdf(<ReportDocument title="ReactLoom Feed Report" rows={safe} />).toBlob()
      if (n !== epoch.current) return
      if (blob.type !== 'application/pdf' || blob.size < 100) throw new Error('Expected PDF Blob')
      const nextURL = URL.createObjectURL(blob)
      releaseURL()
      liveURL.current = nextURL
      setUrl(liveURL.current)
      setBytes(blob.size)
      setState(`由真实renderer生成 ${safe.length} 行报表`)
    } catch (error) {
      if (n === epoch.current) {
        setState(`生成失败：${String(error)}`)
        setUrl('')
        setBytes(0)
        releaseURL()
      }
    } finally {
      if (n === epoch.current) {
        running.current = false
        setBusy(false)
      }
    }
  }
  return (
    <section aria-label="React-PDF Renderer生成实验">
      <h2>
        {level === 'basic'
          ? '一条来源报告'
          : level === 'business'
            ? '日报摘要PDF'
            : '100行自动跨页'}
      </h2>
      <p>
        仅点击后生成，不预先下载PDF或字体资源。当前原生标准字体仅使用英文示例，避免无许可中文字体。
      </p>
      <button type="button" disabled={busy} onClick={() => void generate()}>
        {busy ? '生成中…' : '创建 PDF'}
      </button>
      {level === 'advanced' && (
        <button type="button" disabled={busy} onClick={() => void generate(true)}>
          测试141行输入拒绝
        </button>
      )}
      <p role="status">{state}</p>
      {url && (
        <p>
          <a href={url} download="reactloom-report.pdf">
            下载PDF（{bytes}字节）
          </a>
        </p>
      )}
      {level === 'advanced' && (
        <p>每行禁用拆分、页脚固定、最多140行；字体子集、分页性能和中文字体需要独立实测。</p>
      )}
    </section>
  )
}
