import {useMemo, useState} from 'react'
import DOMPurify from 'dompurify'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}

const samples: Record<Level, string> = {
  basic: '<p>欢迎阅读 <strong>ReactLoom</strong> 技术笔记。</p>',
  business: '<section><h3>公告</h3><p>请参考 <a href="https://github.com/cure53/DOMPurify">官方资料</a>。</p><p><em>所有富文本都必须核对内容来源。</em></p></section>',
  advanced: '<h3 onclick="alert(1)">危险输入</h3><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">注入链接</a><svg onload="alert(1)"></svg><p style="position:fixed">正常文案</p>',
}

const htmlPolicy = {
  USE_PROFILES: {html: true},
  FORBID_TAGS: ['iframe', 'form', 'style', 'img'],
  FORBID_ATTR: ['style'],
}

export default function DOMPurifyExample({level}: Props) {
  const [dirty, setDirty] = useState(samples[level])
  const clean = useMemo(() => DOMPurify.sanitize(dirty, htmlPolicy), [dirty])
  return <section aria-label="DOMPurify 安全净化实验">
    <h2>{level === 'basic' ? '保留合法标记' : level === 'business' ? '公告与链接净化' : '恶意 HTML 输入防护'}</h2>
    <p>下方预览通过真实 DOMPurify 处理 HTML。普通 React 文本无需开启此能力；仅当确需显示受限富文本时使用。</p>
    <label htmlFor="purify-input">输入 HTML 字符串</label>
    <textarea id="purify-input" rows={7} maxLength={12000} value={dirty}
      onChange={event => setDirty(event.target.value)}
      style={{display:'block', width:'100%', padding:12, marginBottom: 12}}
    />
    <button type="button" onClick={() => setDirty(samples[level])}>恢复场景</button>
    <h3>净化后的可视预览</h3>
    <div data-testid="purified-preview" style={{padding:16, border:'1px solid #d4ded2', borderRadius:8}}
      dangerouslySetInnerHTML={{__html:clean}} />
    <h3>净化后的 HTML 文本</h3>
    <pre data-testid="purified-output" style={{whiteSpace:'pre-wrap', overflowWrap:'anywhere'}}>{clean}</pre>
    {level === 'advanced' && <p role="status">检查生成 DOM 里没有 script/svg/onclick/onerror 和 javascript: href。这里的危险字符串是纯本地示例，不能把组件当作安全审计的完整替代。</p>}
  </section>
}
