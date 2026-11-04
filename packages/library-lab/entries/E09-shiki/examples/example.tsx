import {useEffect, useState} from 'react'
import {codeToTokens} from 'shiki/bundle/web'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}
type Lang = 'typescript' | 'json' | 'html'
type Token = {content: string; color?: string; fontStyle?: number}
const examples: Record<Level, string> = {
  basic: 'const count: number = 2;\nconsole.log(count * 2);',
  business: 'interface Article { title: string; read: boolean }\nconst article: Article = {title: "ReactLoom", read: false};',
  advanced: '<img src=x onerror=alert(1)>\n<script>location.href="https://attacker.invalid"</script>',
}

export default function ShikiExample({level}: Props) {
  const [code, setCode] = useState(examples[level])
  const [lang, setLang] = useState<Lang>(level === 'advanced' ? 'html' : 'typescript')
  const [rows, setRows] = useState<Token[][]>([])
  const [state, setState] = useState('等待代码输入')
  // A level change may reuse this component instance: discard previous code/tokens.
  useEffect(() => {
    setCode(examples[level]); setLang(level === 'advanced' ? 'html' : 'typescript')
    setRows([]); setState('等待代码输入')
  }, [level])
  useEffect(() => {
    let live = true
    setState('正在解析 token…')
    setRows([])
    const timer = setTimeout(() => {
      // This module is only downloaded when the user explicitly starts the demo.
      codeToTokens(code, {lang, theme: 'github-light'})
        .then(result => {
          if (!live) return
          setRows(result.tokens.map(line => line.map(t => ({
            content: t.content, color: t.color, fontStyle: t.fontStyle,
          }))))
          setState('真实 Shiki token 化完成')
        })
        .catch(error => {if (live) {setRows([]); setState('高亮失败：' + String(error))}})
    }, 160)
    return () => {live = false; clearTimeout(timer)}
  }, [code, lang])

  return <section aria-label="Shiki 真实 token 示例">
    <h2>{level === 'basic' ? '只读代码高亮' : level === 'business' ? '技术文章代码块' : '安全展示不可信源代码'}</h2>
    <p>直接使用 Shiki codeToTokens；React 文本节点渲染，无 dangerouslySetInnerHTML。着色并不等于编译或执行。</p>
    <label>源代码文本
      <textarea aria-label="Shiki 源代码" value={code} maxLength={3000}
        rows={level === 'advanced' ? 5 : 4} onChange={e => setCode(e.target.value)}
        style={{display:'block',width:'100%',padding:10}}/>
    </label>
    {level !== 'basic' && <label>语言
      <select aria-label="高亮语言" value={lang} onChange={e => setLang(e.target.value as Lang)}>
        <option value="typescript">TypeScript</option><option value="json">JSON</option><option value="html">HTML</option>
      </select>
    </label>}
    <p role="status">{state}</p>
    <pre data-testid="shiki-token-output" style={{whiteSpace:'pre',overflowX:'auto',background:'#fff',padding:16,border:'1px solid #d2decf'}}>
      <code>{rows.map((line, i) => <span key={i}>{line.map((token, j) =>
        <span key={j} style={{color: token.color}}>{token.content}</span>)}{i < rows.length - 1 ? '\n' : ''}</span>)}</code>
    </pre>
    <p>行数 {rows.length}，token 数 {rows.reduce((total, line) => total + line.length, 0)}</p>
    {level === 'advanced' && <p>插入 `script`、`onerror` 只会成为文字；这里完全不注入未经净化的 HTML。切换库后旧异步结果会被丢弃。</p>}
  </section>
}
