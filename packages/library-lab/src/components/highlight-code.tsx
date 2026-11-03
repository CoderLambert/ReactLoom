import { useEffect, useRef, useState } from 'react'

type Token = { content: string; color?: string }
type HighlightSnapshot = { source: string; language: string; tokens: Token[][] }

const ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  md: 'markdown',
}
const SUPPORTED = [
  'javascript',
  'jsx',
  'typescript',
  'tsx',
  'bash',
  'json',
  'html',
  'css',
  'yaml',
  'markdown',
  'python',
  'go',
  'rust',
] as const

export default function HighlightCode({
  code,
  language,
  showCopy = true,
}: {
  code: string
  language: string
  showCopy?: boolean
}) {
  const [snapshot, setSnapshot] = useState<HighlightSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const request = useRef(0)
  useEffect(
    () => () => {
      request.current++
    },
    [],
  )

  const normalized = ALIASES[language] ?? language
  const supported = SUPPORTED.find((candidate) => candidate === normalized)
  // Only display syntax tokens produced from the currently visible file.
  // Otherwise fast file switching can show stale highlighted code.
  const tokens =
    snapshot?.source === code && snapshot.language === normalized ? snapshot.tokens : null
  useEffect(() => {
    request.current++
    setLoading(false)
    setNotice('')
  }, [code, normalized])
  const highlight = async () => {
    if (!supported) return
    const run = ++request.current
    setLoading(true)
    setNotice('')
    try {
      // Shiki shorthand caches grammars and themes; never parse source as HTML.
      const { codeToTokens } = await import('shiki')
      const output = await codeToTokens(code, { lang: supported, theme: 'github-dark' })
      if (run !== request.current) return
      setSnapshot({
        source: code,
        language: normalized,
        tokens: output.tokens.map((line) =>
          line.map((token) => ({ content: token.content, color: token.color })),
        ),
      })
    } catch (error) {
      if (run === request.current) setNotice(`高亮不可用，已保留原始源码：${String(error)}`)
    } finally {
      if (run === request.current) setLoading(false)
    }
  }
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setNotice('源码已复制')
    } catch {
      setNotice('复制失败，请手动选择源码')
    }
  }
  return (
    <section className="code-block" aria-label={`${language || '纯文本'} 代码段`}>
      <div className="code-actions">
        <span>{language || 'text'}</span>
        {supported && !tokens && (
          <button type="button" disabled={loading} onClick={() => void highlight()}>
            {loading ? '高亮加载中…' : '启用高亮'}
          </button>
        )}
        {showCopy && (
          <button type="button" onClick={() => void copy()}>
            复制代码
          </button>
        )}
      </div>
      <pre>
        <code>
          {tokens
            ? tokens.map((line, index) => (
                <span key={index} className="code-line">
                  {line.map((token, i) => (
                    <span key={i} style={token.color ? { color: token.color } : undefined}>
                      {token.content}
                    </span>
                  ))}
                  {'\n'}
                </span>
              ))
            : code}
        </code>
      </pre>
      <small role="status" className="code-status">
        {notice}
      </small>
    </section>
  )
}
