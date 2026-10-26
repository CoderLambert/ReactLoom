import {useEffect, useRef, useState, type ChangeEvent} from 'react'
import Papa from 'papaparse'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}
type Feed = {title: string; url: string; note: string}
type Report = {accepted: Feed[]; rejected: string[]; parserErrors: string[]; escapedCsv: string; total: number}
const fixtures: Record<Level, string> = {
  basic: 'title,url,note\n"React, Loom",https://example.org/feeds,"带引号 ""文本"" 和\n下一行"',
  business: 'title,url,note\n技术新闻,https://example.org/rss,官方来源\n复制,https://example.org/rss,重复源\n不可信,ftp://example.org/x,非HTTPS',
  advanced: 'title,url,note\n"=HYPERLINK(\"https://bad.invalid\")",https://example.org/rss,外部表格公式\n正常,https://example.org/other,合法\n"坏行",https://example.org/rss,too,many,cells',
}
function reportCSV(source: string): Report {
  const result = Papa.parse<Feed>(source.replace(/^\uFEFF/, ''), {
    header: true, skipEmptyLines: 'greedy', dynamicTyping: false,
  })
  const accepted: Feed[] = []
  const rejected: string[] = []
  const seen = new Set<string>()
  result.data.forEach((raw, index) => {
    const line = index + 2
    const title = typeof raw.title === 'string' ? raw.title.trim() : ''
    const url = typeof raw.url === 'string' ? raw.url.trim() : ''
    const note = typeof raw.note === 'string' ? raw.note.trim() : ''
    if (!title || !url) {rejected.push('第 ' + line + ' 行：缺少名称或 URL'); return}
    try {
      const normalized = new URL(url)
      if (normalized.protocol !== 'https:' || normalized.username || normalized.password)
        throw new Error('只接受无凭据的 HTTPS URL')
      normalized.hash = ''
      if (seen.has(normalized.href)) {rejected.push('第 ' + line + ' 行：重复 URL'); return}
      seen.add(normalized.href)
      accepted.push({title, url: normalized.href, note})
    } catch {
      rejected.push('第 ' + line + ' 行：URL 无效或不符合 HTTPS 策略')
    }
  })
  const escapedCsv = Papa.unparse(accepted, {
    columns: ['title', 'url', 'note'], header: true, escapeFormulae: true,
  })
  return {
    accepted, rejected, total: result.data.length, escapedCsv,
    parserErrors: result.errors.map(error => '行 ' + (error.row ?? '?') + ': ' + error.code + ' / ' + error.message),
  }
}
export default function PapaParseExample({level}: Props) {
  const [text, setText] = useState(fixtures[level])
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const generation = useRef(0)
  useEffect(() => () => {generation.current++}, [])

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    const revision = ++generation.current
    setReport(null)
    if (file.size > 256_000) {setError('当前演示仅处理 ≤256KB CSV；大文件必须用 step/chunk + Worker 设计');return}
    try {
      const next = await file.text()
      if (generation.current !== revision) return
      setText(next);setError('')
    } catch (e) {
      if (generation.current === revision) setError('文件读取失败：' + String(e))
    } finally {event.currentTarget.value = ''}
  }
  function parse() {
    try {setReport(reportCSV(text));setError('')} catch (e) {setError(String(e));setReport(null)}
  }
  return <section aria-label="Papa Parse 真实 CSV 实验">
    <h2>{level === 'basic' ? '引号与跨行 CSV' : level === 'business' ? '本地 RSS CSV 导入' : 'CSV 错误与注入边界'}</h2>
    <p>实际使用 Papa.parse / Papa.unparse；预览数据只在页面内存在，不上传、不联网。</p>
    <label>CSV 原文<textarea rows={7} value={text} maxLength={15_000}
      aria-label="CSV 输入" onChange={e => {setText(e.target.value);setReport(null)}}
      style={{display:'block',width:'100%',padding:12}}/></label>
    {level !== 'basic'&&<label>或读取本地 CSV<input type="file" accept=".csv,text/csv" onChange={event => {void chooseFile(event)}}/></label>}
    <div className="demo-controls"><button type="button" onClick={parse}>解析并校验</button>
      <button type="button" onClick={()=>{setText(fixtures[level]);setReport(null);setError('')}}>重置案例</button></div>
    {error&&<p role="alert">{error}</p>}
    {report&&<>
      <p role="status">行数 {report.total}，通过 {report.accepted.length}，拒绝 {report.rejected.length}，解析错误 {report.parserErrors.length}</p>
      <h3>经过字段校验的记录</h3>
      <pre data-testid="papa-records">{JSON.stringify(report.accepted,null,2)}</pre>
      {!!report.rejected.length&&<><h3>业务拒绝</h3><pre>{report.rejected.join('\n')}</pre></>}
      {!!report.parserErrors.length&&<><h3>Papa Parse 解析错误</h3><pre role="alert">{report.parserErrors.join('\n')}</pre></>}
      <h3>启用 escapeFormulae 的导出 CSV</h3><pre data-testid="papa-export">{report.escapedCsv}</pre>
    </>}
    {level === 'advanced'&&<p>CSV 公式防护是导出阶段的独立责任；HTML 转义不能代替它。不能把 CSV 当成 Excel 工作簿；大文件需专门流式方案。</p>}
  </section>
}
