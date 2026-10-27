import {useEffect, useRef, useState, type ChangeEvent} from 'react'
import {reportCSV} from './report.mjs'
import type {Report} from './report.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}
const fixtures: Record<Level, string> = {
  basic: 'title,url,note\n"React, Loom",https://example.org/feeds,"带引号 ""文本"" 和\n下一行"',
  business: 'title,url,note\n技术新闻,https://example.org/rss,官方来源\n复制,https://example.org/rss,重复源\n不可信,ftp://example.org/x,非HTTPS',
  advanced: 'title,url,note\n=2+3,https://example.org/rss,危险公式\n正常,https://example.org/other,合法\n"坏行",https://example.org/rss,too,many,cells',
}

export default function PapaParseExample({level}: Props) {
  const [text, setText] = useState(fixtures[level])
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const generation = useRef(0)
  useEffect(() => () => {generation.current++}, [])

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    // Clear immediately: an oversized file must be selectable again.
    input.value = ''
    const revision = ++generation.current
    setReport(null)
    if (file.size > 256_000) {setError('当前演示仅处理 ≤256KB CSV；大文件必须用 step/chunk + Worker 设计');return}
    try {
      const next = await file.text()
      if (generation.current !== revision) return
      setText(next);setError('')
    } catch (e) {
      if (generation.current === revision) setError('文件读取失败：' + String(e))
    }
  }
  function parse() {
    generation.current++ // A pending File.text() must not overwrite a manual parse.
    try {setReport(reportCSV(text));setError('')} catch (e) {setError(String(e));setReport(null)}
  }
  return <section aria-label="Papa Parse 真实 CSV 实验">
    <h2>{level === 'basic' ? '引号与跨行 CSV' : level === 'business' ? '本地 RSS CSV 导入' : 'CSV 错误与注入边界'}</h2>
    <p>实际使用 Papa.parse / Papa.unparse；预览数据只在页面内存在，不上传、不联网。</p>
    <label>CSV 原文<textarea rows={7} value={text} maxLength={15_000}
      aria-label="CSV 输入" onChange={e => {generation.current++;setText(e.target.value);setReport(null);setError('')}}
      style={{display:'block',width:'100%',padding:12}}/></label>
    {level !== 'basic'&&<label>或读取本地 CSV<input type="file" accept=".csv,text/csv" onChange={event => {void chooseFile(event)}}/></label>}
    <div className="demo-controls"><button type="button" onClick={parse}>解析并校验</button>
      <button type="button" onClick={()=>{generation.current++;setText(fixtures[level]);setReport(null);setError('')}}>重置案例</button></div>
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
