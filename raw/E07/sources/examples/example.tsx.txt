import { useEffect, useState } from 'react'
import { type Level, MAX_UI_UNITS, samples, transformMarkdown } from './workshop.mjs'

type Props = { level: Level }
export default function RemarkExample({ level }: Props) {
  const [source, setSource] = useState(samples[level])
  const [result, setResult] = useState<ReturnType<typeof transformMarkdown> | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    setSource(samples[level])
    setResult(null)
    setError('')
  }, [level])
  function execute() {
    try {
      setError('')
      setResult(transformMarkdown(source))
    } catch (error) {
      setError(String(error))
      setResult(null)
    }
  }
  return (
    <section aria-label="remark 真实处理实验">
      <h2>
        {level === 'basic'
          ? '解析 Markdown 结构'
          : level === 'business'
            ? 'GFM 验收报告'
            : '危险链接与 raw HTML'}
      </h2>
      <p>
        按钮触发真实remark+remark-gfm；同一棵mdast只读审计再stringify，不执行transform插件或HTML。
      </p>
      <label>
        原文
        <textarea
          aria-label="remark Markdown 原文"
          rows={9}
          maxLength={MAX_UI_UNITS}
          value={source}
          onChange={(event) => setSource(event.target.value)}
          style={{ width: '100%', display: 'block', padding: 12 }}
        />
      </label>
      <p>输入框上限12,000个UTF-16单元；处理上限24,000个UTF-8字节。中文/emoji可先触发字节错误。</p>
      <div className="demo-controls">
        <button type="button" onClick={execute}>
          解析与规范化
        </button>
        <button
          type="button"
          onClick={() => {
            setSource(samples[level])
            setResult(null)
            setError('')
          }}
        >
          恢复案例
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <p role="status">
            mdast共{result.audit.nodes}个节点；标题{result.audit.headings.length}个；raw HTML{' '}
            {result.audit.rawHtmlNodes}个
          </p>
          <h3>文档结构</h3>
          <pre data-testid="remark-audit">{JSON.stringify(result.audit, null, 2)}</pre>
          <h3>重新序列化的 Markdown</h3>
          <pre data-testid="remark-output">{result.normalized}</pre>
          {level === 'advanced' && (
            <p>
              safe只是本例URL语法信号，不是浏览器安全或sanitizer结论；危险URL和HTML仍在输出文本中。
            </p>
          )}
        </>
      )}
    </section>
  )
}
