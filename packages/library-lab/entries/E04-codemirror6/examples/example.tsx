import {useEffect, useRef, useState} from 'react'
import {basicSetup, EditorView} from 'codemirror'
import {Compartment, EditorState} from '@codemirror/state'
import {javascript} from '@codemirror/lang-javascript'
import {assertDraftText} from './draft-policy.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}
const SESSION_KEY = 'reactloom:library-lab:E04:config-draft:v1'
const defaults: Record<Level, string> = {
  basic: 'const greeting = "你好，CodeMirror";\nconsole.log(greeting);\n',
  business: 'export const settings = {\n  language: "zh-CN",\n  maxConcurrentTasks: 3,\n  saveLocally: true,\n};\n',
  advanced: '// 试试中文输入法、撤销和只读切换\nfunction sum(a: number, b: number) {\n  return a + b;\n}\n',
}

export default function CodeMirrorExample({level}: Props) {
  const mount = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const readOnlyCompartment = useRef(new Compartment())
  const [readOnly, setReadOnly] = useState(false)
  const [length, setLength] = useState(0)
  const [notice, setNotice] = useState('')

  // Never recreate EditorView for each React keystroke. One view owns one DOM host.
  useEffect(() => {
    if (!mount.current) return
    let initial = defaults[level]
    let ignoredDraft = false
    if (level === 'business') {
      try {
        const saved = sessionStorage.getItem(SESSION_KEY)
        if (saved !== null) initial = assertDraftText(saved)
      } catch {
        // A malformed, oversized or inaccessible stored draft cannot poison EditorView.
        ignoredDraft = true
      }
    }
    const view = new EditorView({
      state: EditorState.create({
        doc: initial,
        extensions: [
          basicSetup,
          javascript({typescript: true}),
          EditorState.tabSize.of(2),
          readOnlyCompartment.current.of(EditorState.readOnly.of(false)),
          EditorView.updateListener.of(update => {
            if (update.docChanged) setLength(update.state.doc.length)
          }),
          EditorView.theme({
            '&': {height: '260px', border: '1px solid #d8ddd4', borderRadius: '8px'},
            '.cm-scroller': {overflow: 'auto', fontFamily: 'ui-monospace, Consolas, monospace'},
            '.cm-content': {padding: '12px'},
          }),
        ],
      }),
      parent: mount.current,
    })
    viewRef.current = view
    setLength(view.state.doc.length)
    setReadOnly(false)
    setNotice(ignoredDraft ? '草稿不可用或超过限额；已加载默认文档' : '已创建独立 EditorView；可输入或粘贴文本')
    return () => {
      if (viewRef.current === view) viewRef.current = null
      view.destroy()
    }
  }, [level])

  useEffect(() => {
    const view = viewRef.current
    if (view) view.dispatch({
      effects: readOnlyCompartment.current.reconfigure(EditorState.readOnly.of(readOnly)),
    })
  }, [readOnly])

  function resetDocument() {
    const view = viewRef.current
    if (!view) return
    view.dispatch({changes: {from: 0, to: view.state.doc.length, insert: defaults[level]}})
    view.focus()
    setNotice('仅重置当前编辑器；其他页面和持久化草稿未受影响')
  }

  function saveDraft() {
    const value = viewRef.current?.state.doc.toString()
    if (value === undefined) return
    try {
      sessionStorage.setItem(SESSION_KEY, assertDraftText(value))
      setNotice('已保存有界草稿到当前标签页 sessionStorage（无远程上传）')
    } catch (error) {
      setNotice(`草稿未保存：${String(error)}`)
    }
  }

  function restoreDraft() {
    const view = viewRef.current
    if (!view) return
    try {
      const value = sessionStorage.getItem(SESSION_KEY)
      if (value === null) return setNotice('没有已保存的草稿')
      const valid = assertDraftText(value)
      view.dispatch({changes: {from: 0, to: view.state.doc.length, insert: valid}})
      setNotice('已从当前标签页恢复有界草稿')
    } catch (error) {
      setNotice(`草稿恢复失败，当前文本保持不变：${String(error)}`)
    }
  }

  return <section aria-label="CodeMirror 6 实际编辑器">
    <h2>{level === 'basic' ? '可编辑代码' : level === 'business' ? '本地配置草稿' : '动态只读与生命周期'}</h2>
    <p>真正挂载 CodeMirror 6；文档变更不重建视图，卸载时显式 view.destroy()。</p>
    <div ref={mount} data-testid="codemirror-mount" aria-label="CodeMirror 编辑区域"/>
    <div className="demo-controls">
      <button type="button" onClick={resetDocument}>重置当前代码</button>
      {level === 'business' && <>
        <button type="button" onClick={saveDraft}>保存会话草稿</button>
        <button type="button" onClick={restoreDraft}>恢复草稿</button>
      </>}
      {level === 'advanced' && <label><input type="checkbox" checked={readOnly}
        onChange={event => setReadOnly(event.target.checked)}/>只读模式</label>}
    </div>
    <p>UTF-16 文档长度：<output data-testid="document-length">{length}</output></p>
    <p role="status">{notice}</p>
    {level === 'advanced' && <p>只读状态通过 Compartment 重配置，不更换整个 EditorView。中文 IME/移动软键盘、焦点、辅助技术兼容需要真实设备单独验收。</p>}
  </section>
}
