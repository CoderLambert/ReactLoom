import {useEffect, useRef, useState} from 'react'
import * as monaco from 'monaco-editor'
import {installMonacoWorkers} from './workers'
import {createOwnedResourceCleanup} from './resource-cleanup.mjs'
import type {OwnedResourceSlots} from './resource-cleanup.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}

const snippets: Record<Level, string> = {
  basic: 'const greeting: string = "Hello ReactLoom"\nconsole.log(greeting)\n',
  business: 'type Article = {id: string; title: string}\n\nexport function summarize(article: Article): string {\n  return article.title.trim()\n}\n',
  advanced: '{\n  "name": "ReactLoom",\n  "features": [true, false,]\n  "missing": true\n}\n',
}

export default function MonacoExample({level}: Props) {
  const holder = useRef<HTMLDivElement>(null)
  const active = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [code, setCode] = useState(snippets[level])
  const [saved, setSaved] = useState('')
  const [problemCount, setProblemCount] = useState(0)
  const [message, setMessage] = useState('等待 Monaco 编辑器装载')

  useEffect(() => {
    const container = holder.current
    if (!container) return
    let releaseWorkers: () => void
    try {
      releaseWorkers = installMonacoWorkers()
    } catch (error) {
      setMessage('Monaco Worker 配置冲突：' + String(error))
      return
    }
    const json = level === 'advanced'
    const language = json ? 'json' : 'typescript'
    // A failed dispose must not prevent later disposals or leak the Worker mapping.
    const owned: OwnedResourceSlots = {releaseWorkers}
    const cleanup = createOwnedResourceCleanup(owned, failures => {
      console.warn('Monaco资源清理出现异常（后续资源已继续释放）', failures)
    })
    try {
      const model = monaco.editor.createModel(
        snippets[level],
        language,
        monaco.Uri.parse('inmemory://reactloom-library/e05/' + crypto.randomUUID() + (json ? '.json' : '.ts')),
      )
      owned.model = model
      const editor = monaco.editor.create(container, {
        model,
        theme: 'vs-light',
        ariaLabel: 'Monaco 代码编辑区域',
        minimap: {enabled: false},
        scrollBeyondLastLine: false,
        automaticLayout: false,
        wordWrap: 'on',
      })
      owned.editor = editor
      active.current = editor
      setCode(model.getValue())
      setProblemCount(0)
      setSaved('')
      setMessage('编辑器已创建；Worker 是否启动需要浏览器实际验证')
      owned.contentListener = editor.onDidChangeModelContent(() => setCode(editor.getValue()))
      owned.markerListener = monaco.editor.onDidChangeMarkers((resources) => {
        if (resources.some(uri => uri.toString() === model.uri.toString())) {
          setProblemCount(monaco.editor.getModelMarkers({resource: model.uri}).length)
        }
      })
      const observer = new ResizeObserver(() => {
        if (active.current === editor) editor.layout()
      })
      owned.observer = observer
      observer.observe(container)
      editor.layout()
    } catch (error) {
      cleanup()
      active.current = null
      setMessage('编辑器创建、监听或布局初始化失败：' + String(error))
      return
    }
    return () => {
      cleanup()
      active.current = null
    }

  }, [level])

  return <section aria-label="Monaco Editor 真实运行示例">
    <h2>{level === 'basic' ? '可编辑 TypeScript' : level === 'business' ? '新闻处理函数草稿' : 'JSON 语言服务诊断'}</h2>
    <p>{message}</p>
    <div ref={holder} data-testid="monaco-editor-root" style={{height: 300, border: '1px solid #cbd5c8', minWidth: 0}} />
    <p role="status">当前 {code.length} 字符{level === 'advanced' ? ` · ${problemCount} 个 Monaco 诊断标记（异步更新）` : ''}</p>
    {level === 'business' && <><button type="button" onClick={() => {
      setSaved(active.current?.getValue() ?? '')
    }}>保存草稿快照</button>
      <p>保存的是当前示例内的状态，不会发送到服务器。</p>
      {saved && <pre data-testid="monaco-saved-draft">{saved}</pre>}
    </>}
    {level === 'advanced' && <p>请修改有意设置的 JSON 语法错误，再观察语言服务标记。Web Worker 的真实启动状态只通过独立浏览器测试认定。</p>}
  </section>
}
