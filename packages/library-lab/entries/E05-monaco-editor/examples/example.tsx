import * as monaco from 'monaco-editor'
import { useEffect, useRef, useState } from 'react'
import type { DraftSnapshot } from './draft-store.mjs'
import { clearDraft, loadDraft, saveDraft } from './draft-store.mjs'
import type { OwnedResourceSlots } from './resource-cleanup.mjs'
import { createOwnedResourceCleanup } from './resource-cleanup.mjs'
import { installMonacoWorkers } from './workers'
import './workshop.css'

type Level = 'basic' | 'business' | 'advanced'
type Props = { level: Level }

const snippets: Record<Level, string> = {
  basic: `function greet(name: string): string {
  return 'Hello, ' + name
}
`,
  business: `type Article = { id: string; title: string }

export function summarize(article: Article): string {
  return article.title.trim()
}
`,
  advanced: `{
  "name": "ReactLoom",
  "features": ["edit", "diagnostics",]
}
`,
}
const validJson = `{
  "name": "ReactLoom",
  "features": ["edit", "diagnostics"]
}
`
const titles: Record<Level, string> = {
  basic: '文本模型与编辑操作',
  business: '显式保存与恢复函数草稿',
  advanced: 'JSON 语言服务诊断与修复',
}
const severityNames: Record<number, string> = {
  [monaco.MarkerSeverity.Error]: '错误',
  [monaco.MarkerSeverity.Warning]: '警告',
  [monaco.MarkerSeverity.Info]: '信息',
  [monaco.MarkerSeverity.Hint]: '提示',
}

export default function MonacoExample({ level }: Props) {
  const holder = useRef<HTMLDivElement>(null)
  const active = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [code, setCode] = useState(snippets[level])
  const [saved, setSaved] = useState<DraftSnapshot | null>(null)
  const [markers, setMarkers] = useState<monaco.editor.IMarker[] | null>(null)
  const [modelUri, setModelUri] = useState('')
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [draftMessage, setDraftMessage] = useState('尚未保存草稿')

  useEffect(() => {
    const container = holder.current
    if (!container) return
    setReady(false)
    setError('')
    setModelUri('')
    setSaved(null)
    setMarkers(null)
    const owned: OwnedResourceSlots = {}
    const cleanup = createOwnedResourceCleanup(owned, (failures) => {
      console.warn('Monaco 资源清理出现异常，后续资源已继续释放', failures)
    })
    try {
      owned.releaseWorkers = installMonacoWorkers()
      const json = level === 'advanced'
      const model = monaco.editor.createModel(
        snippets[level],
        json ? 'json' : 'typescript',
        monaco.Uri.parse(
          `inmemory://reactloom-library/e05/${crypto.randomUUID()}${json ? '.json' : '.ts'}`,
        ),
      )
      owned.model = model
      const editor = monaco.editor.create(container, {
        model,
        theme: 'vs-light',
        ariaLabel: json ? 'Monaco JSON 编辑区域' : 'Monaco TypeScript 编辑区域',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: false,
        wordWrap: 'on',
      })
      owned.editor = editor
      active.current = editor
      setCode(model.getValue())
      setModelUri(model.uri.toString())
      owned.contentListener = model.onDidChangeContent(() => {
        setCode(model.getValue())
        // Marker events report changes, not every completed validation.
        // Keep the last snapshot: valid JSON -> valid JSON may emit no event.
      })
      owned.markerListener = monaco.editor.onDidChangeMarkers((resources) => {
        if (resources.some((uri) => uri.toString() === model.uri.toString())) {
          setMarkers(monaco.editor.getModelMarkers({ resource: model.uri }))
        }
      })
      const observer = new ResizeObserver(() => {
        if (active.current === editor) editor.layout()
      })
      owned.observer = observer
      observer.observe(container)
      editor.layout()
      setReady(true)
      if (level === 'business') {
        try {
          const snapshot = loadDraft(window.sessionStorage)
          setSaved(snapshot)
          setDraftMessage(
            snapshot ? '发现本标签页草稿，点击恢复后才会替换编辑内容' : '尚未保存草稿',
          )
        } catch (cause) {
          setDraftMessage(`读取草稿失败：${String(cause)}`)
        }
      }
    } catch (cause) {
      cleanup()
      active.current = null
      setError(`编辑器或 Worker 配置初始化失败：${String(cause)}`)
      return
    }
    return () => {
      active.current = null
      cleanup()
    }
  }, [level])

  // Apply a real model edit; unlike setValue, this retains an undo boundary.
  const replaceText = (text: string) => {
    const editor = active.current
    const model = editor?.getModel()
    if (!editor || !model) return
    editor.pushUndoStop()
    editor.executeEdits('e05-workshop', [{ range: model.getFullModelRange(), text }])
    editor.pushUndoStop()
  }

  const save = () => {
    const editor = active.current
    if (!editor) return
    try {
      // Read the authoritative model at click time, not a possibly older React render.
      const snapshot = saveDraft(window.sessionStorage, editor.getValue())
      setSaved(snapshot)
      setDraftMessage('草稿已保存到本标签页；刷新或重新进入后可手动恢复')
    } catch (cause) {
      setDraftMessage(`保存失败，草稿未更新：${String(cause)}`)
    }
  }

  const restore = () => {
    try {
      const snapshot = loadDraft(window.sessionStorage)
      setSaved(snapshot)
      if (!snapshot) {
        setDraftMessage('没有可恢复的本例草稿')
        return
      }
      replaceText(snapshot.code)
      setDraftMessage('已恢复本标签页草稿；可撤销本次替换')
    } catch (cause) {
      setDraftMessage(`恢复失败，编辑内容保留：${String(cause)}`)
    }
  }

  return (
    <section className="e05-workshop" aria-label="Monaco Editor 真实运行示例">
      <h2>{titles[level]}</h2>
      <p>
        {level === 'basic'
          ? '修改函数或插入调用，观察模型文本；再撤销这次编辑。这里不执行 TypeScript。'
          : level === 'business'
            ? '编辑新闻摘要函数，保存后继续修改，再恢复对照。保存不触发网络请求。'
            : '初始 JSON 有尾逗号。等待真实语言服务返回位置和消息，再手动删除逗号或载入合法 JSON。'}
      </p>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <p>{ready ? '编辑器已创建；可以开始编辑' : '正在创建编辑器…'}</p>
      )}
      <div className="e05-actions">
        {level === 'basic' && (
          <button
            type="button"
            disabled={!ready}
            onClick={() => replaceText(`${snippets.basic}\nconsole.log(greet('Ada'))\n`)}
          >
            插入问候调用
          </button>
        )}
        {level === 'advanced' && (
          <button type="button" disabled={!ready} onClick={() => replaceText(validJson)}>
            载入合法 JSON
          </button>
        )}
        <button
          type="button"
          disabled={!ready}
          onClick={() => active.current?.trigger('e05-workshop', 'undo', null)}
        >
          撤销
        </button>
        <button type="button" disabled={!ready} onClick={() => replaceText(snippets[level])}>
          重置示例文本
        </button>
      </div>
      <div
        ref={holder}
        data-testid="monaco-editor-root"
        data-model-uri={modelUri}
        className="e05-editor"
      />
      <p role="status" data-testid="monaco-model-status">
        当前 {code.length} 字符 · {level === 'advanced' ? 'JSON' : 'TypeScript'} 模型
        {level === 'business' &&
          saved &&
          ` · ${code === saved.code ? '与已存草稿一致' : '有未保存改动'}`}
      </p>
      <details>
        <summary>当前模型身份</summary>
        <code>{modelUri || '尚未创建'}</code>
      </details>
      {level === 'advanced' ? (
        <section aria-label="JSON 诊断结果" className="e05-output">
          <h3>Monaco 诊断</h3>
          <p role="status" data-testid="monaco-diagnostics">
            {markers === null
              ? '尚未收到 JSON 诊断快照'
              : `${markers.length} 个 Monaco 诊断标记（最近收到的快照）`}
          </p>
          {markers && markers.length > 0 && (
            <ul>
              {markers.map((marker) => (
                <li key={`${marker.startLineNumber}:${marker.startColumn}:${marker.message}`}>
                  <button
                    type="button"
                    onClick={() => {
                      active.current?.setPosition({
                        lineNumber: marker.startLineNumber,
                        column: marker.startColumn,
                      })
                      active.current?.revealLineInCenter(marker.startLineNumber)
                      active.current?.focus()
                    }}
                  >
                    第 {marker.startLineNumber} 行，第 {marker.startColumn} 列
                  </button>{' '}
                  {severityNames[marker.severity]}：{marker.message}
                </li>
              ))}
            </ul>
          )}
          <p>
            显示最近收到的诊断快照；修改文本后可能暂时保留旧结果。标记变化事件不代表每次验证完成，0
            个标记也不证明当前文本版本或业务字段已通过校验。
          </p>
        </section>
      ) : (
        <section className="e05-output" aria-label="模型文本预览">
          <h3>模型文本</h3>
          <pre data-testid="monaco-model-text">{code}</pre>
        </section>
      )}
      {level === 'business' && (
        <section className="e05-output" aria-label="本地草稿">
          <h3>本标签页草稿</h3>
          <div className="e05-actions">
            <button type="button" disabled={!ready} onClick={save}>
              保存本地草稿
            </button>
            <button type="button" disabled={!ready || !saved} onClick={restore}>
              恢复本地草稿
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  clearDraft(window.sessionStorage)
                  setSaved(null)
                  setDraftMessage('已清除本例草稿，当前编辑内容保留')
                } catch (cause) {
                  setDraftMessage(`清除失败：${String(cause)}`)
                }
              }}
            >
              清除本例草稿
            </button>
          </div>
          <p role="status" data-testid="monaco-draft-status">
            {draftMessage}
          </p>
          <p>使用 sessionStorage；当前标签页刷新后保留，关闭标签页后结束。不上传，不自动保存。</p>
          {saved && (
            <>
              <p>保存时间：{saved.savedAt}</p>
              <pre data-testid="monaco-saved-draft">{saved.code || '（空文档）'}</pre>
            </>
          )}
        </section>
      )}
    </section>
  )
}
