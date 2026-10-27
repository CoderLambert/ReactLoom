import {useMemo, useState} from 'react'
import {$createParagraphNode, $createTextNode, $getRoot, FORMAT_TEXT_COMMAND} from 'lexical'
import {LexicalComposer} from '@lexical/react/LexicalComposer'
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin'
import {ContentEditable} from '@lexical/react/LexicalContentEditable'
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin'
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin'
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary'
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext'
import {assertLexicalSnapshot, MAX_SNAPSHOT} from './snapshot-policy.mjs'

type Level = 'basic' | 'business' | 'advanced'
type Props = {level: Level}
const KEY = 'reactloom:library-lab:E03:article:v1'

/** The JSON is Lexical's authoritative document, not innerHTML. */
function Actions({level}: Props) {
  const [editor] = useLexicalComposerContext()
  const [notice, setNotice] = useState('草稿仅在本示例内编辑')
  const [documentText, setDocumentText] = useState('')

  function save() {
    const json = JSON.stringify(editor.getEditorState().toJSON())
    if (json.length > MAX_SNAPSHOT) {
      setNotice('草稿超出本地演示上限，未保存')
      return
    }
    try {
      sessionStorage.setItem(KEY, json)
      setNotice('结构化 JSON 已保存到当前标签页；没有上传数据')
    } catch {
      setNotice('浏览器禁止 sessionStorage，仍可继续编辑')
    }
  }

  function restore() {
    try {
      const json = sessionStorage.getItem(KEY)
      if (!json) return setNotice('没有已保存的草稿')
      if (json.length > MAX_SNAPSHOT) return setNotice('草稿超出大小限制，拒绝恢复')
      const restored = editor.parseEditorState(assertLexicalSnapshot(json))
      if (restored.isEmpty()) throw new Error('空文档不可应用')
      editor.setEditorState(restored)
      setNotice('已恢复 Lexical JSON 文档（未注入 HTML）')
    } catch {
      setNotice('草稿已损坏或与当前节点协议不兼容，未覆盖编辑内容')
    }
  }

  function reset() {
    editor.update(() => {
      const root = $getRoot()
      root.clear()
      root.append($createParagraphNode().append($createTextNode('新的编辑草稿')))
    })
    setNotice('已重置当前编辑器，未清空其他页面存储')
  }

  return <>
    <OnChangePlugin ignoreSelectionChange onChange={(state) => {
      state.read(() => setDocumentText($getRoot().getTextContent()))
    }} />
    <div className="demo-controls">
      <button type="button" onClick={reset}>重置本文</button>
      {level !== 'basic' && <>
        <button type="button" onClick={save}>保存 JSON 草稿</button>
        <button type="button" onClick={restore}>恢复 JSON 草稿</button>
      </>}
      {level === 'advanced' && <button type="button"
        onMouseDown={e => e.preventDefault()}
        onClick={() => {editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'); setNotice('对选中文字切换加粗；空选区可能只更新下次输入格式')}}>
          加粗所选文字
        </button>}
    </div>
    <p>文档文本长度：<output data-testid="lexical-length">{documentText.length}</output></p>
    <p role="status">{notice}</p>
    {level === 'advanced' && <p>选中文本后试用加粗；再用中文输入法、撤销、粘贴验证选区与组合输入。保存的是结构化 JSON，不是未经净化的 HTML。</p>}
  </>
}

export default function LexicalExample({level}: Props) {
  // Composer owns the editor lifecycle. Never recreate its config for each keystroke.
  const config = useMemo(() => ({
    namespace: 'reactloom-library-lab-E03',
    theme: {text: {bold: 'font-bold'}, paragraph: 'lexical-paragraph'},
    onError(error: Error) { throw error },
  }), [])
  return <section aria-label="Lexical 真实编辑器">
    <h2>{level === 'basic' ? '编辑器状态与文本' : level === 'business' ? '新闻文章本地 JSON 草稿' : '格式命令与状态恢复边界'}</h2>
    <p>使用真实 lexical / @lexical/react。请在编辑框内输入文字，内容不会发送到服务器。</p>
    <LexicalComposer key={level} initialConfig={config}>
      <div style={{position: 'relative', marginBlock: '16px'}}>
        <RichTextPlugin
          contentEditable={<ContentEditable aria-label="Lexical 文档编辑区" style={{border: '1px solid #bbcabc', borderRadius: 8, padding: 14, minHeight: 140}} />}
          placeholder={<p style={{position: 'absolute', top: 14, left: 14, color: '#7b837b', pointerEvents: 'none'}}>输入新闻摘要…</p>}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      <HistoryPlugin />
      <Actions level={level} />
    </LexicalComposer>
  </section>
}
