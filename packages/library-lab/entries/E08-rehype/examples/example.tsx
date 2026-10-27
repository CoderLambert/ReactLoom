import {useEffect,useState} from 'react'
import {strictHtmlSchema} from './sanitize-policy.mjs'
import {rehype} from 'rehype'
import rehypeSanitize from 'rehype-sanitize'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}
const samples: Record<Level, string> = {
  basic: '<h2>ReactLoom</h2><p>来自 <strong>可信 AST 管线</strong> 的文本。</p>',
  business: '<article><h2>今日阅读</h2><p>内容摘要与 <a href="https://example.org">原始来源</a></p><ul><li>字段审查</li></ul></article>',
  advanced: '<h2 onclick="alert(1)">攻击输入</h2><img src=x onerror=alert(2)><script>alert(3)</script><a href="javascript:alert(4)">伪装链接</a><iframe src="https://example.org"></iframe>',
}
const blockedCsp = "default-src 'none'; script-src 'none'; connect-src 'none'; img-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none';"
function sanitizeHtml(input: string) {
  if (new TextEncoder().encode(input).byteLength > 25_000) throw new Error('HTML 输入超出 25KiB 限额')
  // Unlike remark, this pipeline parses HTML to HAST and sanitizes BEFORE stringifying.
  return String(rehype().use(rehypeSanitize, strictHtmlSchema).processSync(input))
}

export default function RehypeExample({level}: Props) {
  const [source, setSource] = useState(samples[level])
  useEffect(() => {setSource(samples[level]);setOutput(null);setError('')}, [level])
  const [output, setOutput] = useState<string | null>(null)
  const [error, setError] = useState('')
  function run() {
    try {setOutput(sanitizeHtml(source));setError('')}
    catch(e) {setOutput(null);setError(String(e))}
  }
  return <section aria-label="rehype 实际 HTML 净化">
    <h2>{level === 'basic' ? 'HTML AST 解析' : level === 'business' ? '业务富文本净化' : '攻击输入的安全处理'}</h2>
    <p>真实 rehype → 严格允许列表 → stringify（移除所有可导航链接与远程媒体）。净化的 HTML 在无脚本、不同源的沙箱 iframe 中预览。</p>
    <label>输入 HTML<textarea aria-label="rehype HTML 输入" value={source} rows={6}
      maxLength={25_000} onChange={e=>setSource(e.target.value)}
      style={{display:'block',width:'100%',padding:12}}/></label>
    <div className="demo-controls"><button type="button" onClick={run}>运行安全处理器</button>
      <button type="button" onClick={()=>{setSource(samples[level]);setOutput(null);setError('')}}>重置</button></div>
    {error&&<p role="alert">{error}</p>}
    {output!==null&&<>
      <h3>净化后的 HTML 源码</h3><pre data-testid="rehype-output">{output}</pre>
      <h3>隔离预览</h3><iframe title="被限制的净化 HTML 预览" sandbox=""
        referrerPolicy="no-referrer"
        srcDoc={'<!doctype html><meta http-equiv="Content-Security-Policy" content="' + blockedCsp + '">' + output}
        style={{display:'block',height:220,width:'100%',border:'1px solid #ddd',background:'#fff'}}/>
      <p role="status">已生成净化 HTML；真实 XSS/网络验证仍须 Playwright 实测。</p>
    </>}
  </section>
}
