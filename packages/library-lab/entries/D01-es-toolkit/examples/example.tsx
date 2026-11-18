import { useState } from 'react'
import { makeDigest, seed } from './pipeline.mjs'

export default function ToolkitExample() {
  const [pageSize, setPageSize] = useState(2)
  const [injectBad, setInjectBad] = useState(false)
  const [input, setInput] = useState(JSON.stringify(seed, null, 2))
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  function run() {
    try {
      const parsed: unknown = JSON.parse(input)
      if (!Array.isArray(parsed)) throw new Error('输入必须是 JSON 数组')
      const raw: unknown[] = injectBad
        ? [
            ...parsed,
            { url: 'javascript:alert(1)', title: 'invalid', publishedAt: '2026-10-26T00:00:00Z' },
            { foo: 1 },
          ]
        : parsed
      const digest = makeDigest(raw, pageSize)
      setOutput(
        JSON.stringify(
          {
            inputCount: raw.length,
            normalized: digest.accepted,
            sorted: digest.newestFirst,
            unique: digest.articles,
            groupSizes: Object.fromEntries(
              Object.entries(digest.bySource).map(([key, rows]) => [key, rows.length]),
            ),
            pages: digest.pages,
            rejected: digest.rejected,
          },
          null,
          2,
        ),
      )
      setError('')
    } catch (caught) {
      setOutput('')
      setError(caught instanceof Error ? caught.message : '处理失败')
    }
  }
  return (
    <section aria-label="es-toolkit SDK 实战">
      <h2>RSS 数据处理流水线</h2>
      <p>
        编辑输入，观察规范化 → 排序 → 去重 → 分组 → 分页。SDK 真实运行，RSS 数据为本地 fixture。
      </p>
      <label>
        文章 JSON
        <textarea
          aria-label="文章 JSON"
          rows={12}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
      </label>
      <div className="demo-controls">
        <label>
          每页文章数
          <select
            aria-label="每页文章数"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            {[1, 2, 3, 5].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={injectBad}
            onChange={(event) => setInjectBad(event.target.checked)}
          />
          包含两个坏输入
        </label>
        <button type="button" onClick={run}>
          运行真实工具函数
        </button>
        <button
          type="button"
          onClick={() => {
            setInput(JSON.stringify(seed, null, 2))
            setInjectBad(false)
            setOutput('')
            setError('')
          }}
        >
          恢复示例输入
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {output && <pre data-testid="toolkit-output">{output}</pre>}
      <p>规范化保留业务 ID，排序后去重留下最新文章；坏行单独隔离，JSON 整体格式错误需先修复。</p>
    </section>
  )
}
