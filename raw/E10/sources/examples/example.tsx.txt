import createDOMPurify from 'dompurify'
import { useEffect, useId, useMemo, useState } from 'react'
import { MAX_INPUT_UNITS, sanitizePreview } from './sanitize-preview.mjs'

type Level = 'basic' | 'business' | 'advanced'
const samples: Record<Level, string> = {
  basic: '<p>欢迎阅读 <strong>ReactLoom</strong> 技术笔记。</p>',
  business:
    '<section><h3>公告</h3><p>请参考 <a href="https://github.com/cure53/DOMPurify" title="官方资料" target="_blank" data-track="no" aria-label="来源">官方资料</a>。</p><p><em>所有富文本都必须核对内容来源。</em></p></section>',
  advanced:
    '<h3 onclick="window.__purifyExecuted=true">危险输入</h3><script>window.__purifyExecuted=true</script><img src="https://purify-probe.invalid/pixel" onerror="window.__purifyExecuted=true"><a href="javascript:window.__purifyExecuted=true">注入链接</a><svg onload="window.__purifyExecuted=true"></svg><p style="position:fixed">正常文案</p>',
}
export default function DOMPurifyExample({ level }: { level: Level }) {
  const [dirty, setDirty] = useState(samples[level])
  const id = useId()
  useEffect(() => {
    setDirty(samples[level])
  }, [level])
  // Per-mount instance: unrelated consumers cannot setConfig/addHook on this instance.
  const purifier = useMemo(() => createDOMPurify(window), [])
  const result = useMemo(() => sanitizePreview(dirty, purifier), [dirty, purifier])
  return (
    <section aria-label="DOMPurify 安全净化实验">
      <h2>
        {level === 'basic'
          ? '保留合法标记'
          : level === 'business'
            ? '公告与受限链接'
            : '攻击输入与安全边界'}
      </h2>
      <p>
        真实DOMPurify在本次浏览器DOM上按固定窄策略净化；唯一HTML预览只接收净化结果，原文从不直接插入。
      </p>
      <label htmlFor={id}>输入 HTML 字符串</label>
      <textarea
        id={id}
        rows={7}
        maxLength={MAX_INPUT_UNITS}
        value={dirty}
        onChange={(event) => setDirty(event.target.value)}
        style={{ display: 'block', width: '100%', padding: 12, marginBottom: 12 }}
      />
      <p>输入上限12,000个UTF-16单元，不是字节/节点/耗时限制。data-*、aria-*也明确禁止。</p>
      <button type="button" onClick={() => setDirty(samples[level])}>
        恢复场景
      </button>
      {result.error && <p role="alert">{result.error}</p>}
      <h3>净化后的可视预览</h3>
      <div
        data-testid="purified-preview"
        style={{ padding: 16, border: '1px solid #d4ded2', borderRadius: 8 }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Only private DOMPurify output reaches this sink; failure paths return empty HTML.
        dangerouslySetInnerHTML={{ __html: result.html }}
      />
      <h3>净化后的 HTML 文本</h3>
      <pre
        data-testid="purified-output"
        style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}
      >
        {result.html}
      </pre>
      {level === 'advanced' && (
        <p role="status">
          样例只用无害执行标记，不以目视检查代替浏览器证据。链接仍可导航；不点击不可信链接。
        </p>
      )}
    </section>
  )
}
