import {useEffect, useState} from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import {safeMarkdownURL, markdownComponents} from './render-policy.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}
const samples: Record<Level, string> = {
  basic: '# ReactLoom Markdown\n\n**加粗**、行内 \`code\`，以及 [官方文档](https://github.com/remarkjs/react-markdown)。',
  business: '# 接口验收报告\n\n| 场景 | 状态 |\n| --- | --- |\n| 请求成功 | PASS |\n| 超时取消 | NOT_RUN |\n\n- [x] 模型校验\n- [ ] 浏览器复查\n',
  advanced: '# 不可信内容\n\n[伪造链接](javascript:alert(1))\n\n<img src=x onerror=alert(1)>\n\n<script>alert(1)</script>\n\n![远程图片](https://example.com/track.png)',
}

export default function MarkdownExample({level}: Props) {
  const [source, setSource] = useState(samples[level])
  // Also work correctly when a consuming project reuses this component without remounting.
  useEffect(() => {setSource(samples[level])}, [level])
  return <section aria-label="react-markdown 真实渲染实验">
    <h2>可编辑 Markdown</h2>
    <p>从左侧原文实时渲染；原文不会被当作可执行 JSX 或脚本。</p>
    <label htmlFor="md-source">Markdown 输入</label>
    <textarea id="md-source" aria-label="Markdown 输入" rows={10}
      style={{width: '100%', padding: 12, display: 'block', marginBottom: 16}}
      value={source}
      maxLength={12000}
      onChange={event => setSource(event.target.value)}
    />
    <button type="button" onClick={() => setSource(samples[level])}>重置样例</button>
    <section data-testid="markdown-preview" aria-label="安全渲染预览" style={{border: '1px solid #cad7c9', padding: 18, marginTop: 16, borderRadius: 8}}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        skipHtml
        urlTransform={safeMarkdownURL}
        components={markdownComponents}
      >{source}</Markdown>
    </section>
    {level === 'advanced' && <p role="status">尝试插入 script、事件属性、javascript: URL 或远程跟踪图，确认没有任何代码执行。</p>}
  </section>
}
