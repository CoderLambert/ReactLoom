import { useCallback, useEffect, useRef, useState } from 'react'

type Token = { offset: number; content: string; color?: string }
type TokenLine = { offset: number; tokens: Token[] }
type HighlightSnapshot = { source: string; language: string; tokens: TokenLine[] }
type Props = { code: string; language: string; showCopy?: boolean }

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

export default function HighlightCode(props: Props) {
  const normalized = ALIASES[props.language] ?? props.language
  // A source owns its highlighting request, notice, and loading state.
  return <HighlightCodeSession key={JSON.stringify([props.code, normalized])} {...props} />
}

function HighlightCodeSession({ code, language, showCopy = true }: Props) {
  const [snapshot, setSnapshot] = useState<HighlightSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const request = useRef(0)
  const normalized = ALIASES[language] ?? language
  const supported = SUPPORTED.find((candidate) => candidate === normalized)
  // Only display syntax tokens produced from the currently visible file.
  // Otherwise fast file switching can show stale highlighted code.
  const tokens =
    snapshot?.source === code && snapshot.language === normalized ? snapshot.tokens : null
  const highlight = useCallback(async () => {
    if (!supported) return
    const run = ++request.current
    setLoading(true)
    setNotice('')
    try {
      // Shiki shorthand caches grammars and themes; never parse source as HTML.
      const { codeToTokens } = await import('shiki')
      const output = await codeToTokens(code, { lang: supported, theme: 'github-dark' })
      if (run !== request.current) return
      let lineOffset = 0
      setSnapshot({
        source: code,
        language: normalized,
        tokens: output.tokens.map((line) => {
          // Identify source ranges, including blank lines and CRLF line endings.
          const offset = lineOffset
          const newline = code.indexOf('\n', lineOffset)
          lineOffset = newline === -1 ? code.length : newline + 1
          return {
            offset,
            tokens: line.map((token) => ({
              offset: token.offset,
              content: token.content,
              color: token.color,
            })),
          }
        }),
      })
    } catch (error) {
      if (run === request.current) setNotice(`高亮不可用，已保留原始源码：${String(error)}`)
    } finally {
      if (run === request.current) setLoading(false)
    }
  }, [code, normalized, supported])
  useEffect(() => {
    if (!supported) return
    void highlight()
    return () => {
      request.current += 1
    }
  }, [highlight, supported])
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
        {supported && notice.startsWith('高亮不可用') && (
          <button type="button" disabled={loading} onClick={() => void highlight()}>
            重试高亮
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
            ? tokens.map((line) => (
                <span key={line.offset} className="code-line">
                  {line.tokens.map((token) => (
                    <span
                      key={token.offset}
                      style={token.color ? { color: token.color } : undefined}
                    >
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
        {loading ? '正在高亮…' : notice}
      </small>
    </section>
  )
}
