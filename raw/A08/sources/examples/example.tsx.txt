import mermaid from 'mermaid'
import { useEffect, useState } from 'react'
import {
  flowDefinition,
  invalidDefinition,
  sequenceDefinition,
  stateDefinition,
} from './diagram-source'
import { queueMermaidRender } from './render-queue'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
let nextRenderId = 0
let initialized = false
function prepareMermaid() {
  if (initialized) return
  // One configuration owned by this viewer; never merge visitor configuration.
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'neutral',
    suppressErrorRendering: true,
  })
  initialized = true
}

export default function MermaidExample({ level }: { level: Level }) {
  const [deduplicate, setDeduplicate] = useState(false)
  const [useCache, setUseCache] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')
  const diagram =
    level === 'basic'
      ? flowDefinition(deduplicate)
      : level === 'business'
        ? sequenceDefinition(useCache)
        : invalid
          ? invalidDefinition
          : stateDefinition

  useEffect(() => {
    let active = true
    setSvg('')
    setError('')
    void queueMermaidRender(
      () => active,
      async () => {
        prepareMermaid()
        const parsed = await mermaid.parse(diagram, { suppressErrors: true })
        if (!parsed) throw new Error('DSL 语法校验未通过')
        const result = await mermaid.render(`rl-mermaid-${++nextRenderId}`, diagram)
        return result.svg
      },
      (result) => setSvg(result),
      (reason) => setError(`图形无法渲染：${String(reason)}`),
    )
    // Already running layout continues; its result no longer owns this component.
    return () => {
      active = false
    }
  }, [diagram])

  return (
    <section className="a08-workshop" aria-label="Mermaid 预设DSL图示">
      <h2>
        {level === 'basic'
          ? '可维护的流程图'
          : level === 'business'
            ? 'NewsHub 请求时序'
            : '状态机 DSL 与错误恢复'}
      </h2>
      <p>本地业务开关选择可信 DSL，Mermaid 负责解析、布局与 SVG；没有调用新闻 API。</p>
      {level === 'basic' && (
        <label>
          <input
            type="checkbox"
            checked={deduplicate}
            onChange={(event) => setDeduplicate(event.target.checked)}
          />
          显示去重分支
        </label>
      )}
      {level === 'business' && (
        <label>
          <input
            type="checkbox"
            checked={useCache}
            onChange={(event) => setUseCache(event.target.checked)}
          />
          使用缓存命中路径
        </label>
      )}
      {level === 'advanced' && (
        <button type="button" onClick={() => setInvalid((old) => !old)}>
          {invalid ? '恢复合法状态图' : '尝试无效语法'}
        </button>
      )}
      <p role="status">{error || (!svg ? '正在编译 Mermaid…' : 'Mermaid 图已生成')}</p>
      {svg && !error && (
        <iframe
          title="沙箱 Mermaid SVG 预览"
          sandbox=""
          referrerPolicy="no-referrer"
          srcDoc={`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#fff;}body{overflow:auto}svg{max-width:100%;height:auto}</style></head><body>${svg}</body></html>`}
        />
      )}
      <h3>可复制的 DSL 源</h3>
      <pre data-testid="a08-source">
        <code>{diagram}</code>
      </pre>
      <p>
        文本替代：
        {level === 'basic'
          ? deduplicate
            ? 'RSS源进入抓取；重复文章跳过入库，其余进入索引。'
            : 'RSS源进入抓取，再进入索引。'
          : level === 'business'
            ? useCache
              ? '浏览器请求API，API直接返回缓存摘要。'
              : '浏览器请求API，API与Worker协作返回摘要。'
            : 'Idle发起Loading；Loading可到Success/Failed，失败可重试。'}
      </p>
      {level === 'advanced' && (
        <p>失败时移除旧图，修复后重新编译。卸载只丢弃过期结果，不中断已经运行的布局。</p>
      )}
    </section>
  )
}
