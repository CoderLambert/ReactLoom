import {useEffect,useState} from 'react'
import {remark} from 'remark'
import remarkGfm from 'remark-gfm'
import {auditMarkdownTree} from './audit-policy.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}
const samples: Record<Level, string> = {
  basic: '# ReactLoom Note\n\nA **typed** Markdown document.\n\n## Getting started\n\n- one\n- two',
  business: '# RSS 订阅验收\n\n| 场景 | 状态 |\n| --- | --- |\n| 导入完成 | PASS |\n| 取消请求 | NOT_RUN |\n\n- [x] 记录失败\n- [ ] 检查原始来源',
  advanced: '# 不可信文章\n\n[安全来源](https://example.org)\n\n[危险操作](javascript:alert(1))\n\n<script>alert("not executed by remark")</script>\n\n![远程图片](https://tracking.invalid/1.gif)',
}
function transform(source: string) {
  if (new TextEncoder().encode(source).byteLength > 24_000) throw new Error('Markdown 输入超过24KiB');
  const processor = remark().use(remarkGfm)
  const ast = processor.parse(source)
  // One parsed AST for audit and serialization: no second parse pass.
  return {normalized: String(processor.stringify(ast)), audit: auditMarkdownTree(ast)}
}
export default function RemarkExample({level}: Props) {
  const [source, setSource] = useState(samples[level])
  useEffect(() => {setSource(samples[level]);setResult(null);setError('')}, [level])
  const [result, setResult] = useState<ReturnType<typeof transform> | null>(null)
  const [error, setError] = useState('')
  function execute() {
    try {setError('');setResult(transform(source))} catch (e) {setError(String(e));setResult(null)}
  }
  return <section aria-label="remark 真实处理实验">
    <h2>{level === 'basic' ? '解析 Markdown 结构' : level === 'business' ? 'GFM 验收报告' : '危险链接与 raw HTML'}</h2>
    <p>真实 remark 处理器 + remark-gfm；输出是 Markdown 字符串而不是可执行 HTML。</p>
    <label>原文 <textarea aria-label="remark Markdown 原文" rows={9}
      maxLength={12_000} value={source} onChange={e => setSource(e.target.value)}
      style={{width:'100%',display:'block',padding:12}}/></label>
    <div className="demo-controls"><button type="button" onClick={execute}>解析与规范化</button>
      <button type="button" onClick={() => {setSource(samples[level]);setResult(null);setError('')}}>恢复案例</button></div>
    {error && <p role="alert">{error}</p>}
    {result && <>
      <p role="status">mdast 共 {result.audit.nodes} 个节点；标题 {result.audit.headings.length} 个</p>
      <h3>文档结构</h3><pre data-testid="remark-audit">{JSON.stringify(result.audit,null,2)}</pre>
      <h3>重新序列化的 Markdown</h3><pre data-testid="remark-output">{result.normalized}</pre>
      {level === 'advanced' && <p>检测到危险 URL 只是审计信号；remark 不是 sanitizer，实际 HTML 输出需经过 E08/E10 的净化和 URL 策略。</p>}
    </>}
  </section>
}
