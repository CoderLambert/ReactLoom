import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import {
  $getRoot,
  type EditorState,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { assertLexicalSnapshot } from './snapshot-policy.mjs'
import { resetDocument, restoreSnapshot } from './state-operations'
import './styles.css'

type Level = 'basic' | 'business' | 'advanced'
type Props = { level: Level }
const KEY = 'reactloom:library-lab:E03:article:v1'
function Actions({ level }: Props) {
  const [editor] = useLexicalComposerContext()
  const [notice, setNotice] = useState('草稿仅在本示例内编辑')
  const [documentText, setDocumentText] = useState('')
  const composing = useRef(false)
  useEffect(
    () =>
      editor.registerRootListener((root) => {
        composing.current = false
        if (!root) return
        const start = () => {
          composing.current = true
        }
        const end = () => {
          composing.current = false
        }
        root.addEventListener('compositionstart', start)
        root.addEventListener('compositionend', end)
        return () => {
          root.removeEventListener('compositionstart', start)
          root.removeEventListener('compositionend', end)
          composing.current = false
        }
      }),
    [editor],
  )
  const onChange = useCallback((state: EditorState) => {
    state.read(() => setDocumentText($getRoot().getTextContent()))
  }, [])
  function blocked() {
    if (!composing.current && !editor.isComposing()) return false
    setNotice('请先完成输入法组合，未修改文档或草稿')
    return true
  }
  function save() {
    if (blocked()) return
    try {
      const json = assertLexicalSnapshot(JSON.stringify(editor.getEditorState().toJSON()))
      sessionStorage.setItem(KEY, json)
      setNotice('结构化 JSON 已保存到当前标签页；没有上传数据')
    } catch (error) {
      setNotice(`存储/内容失败，未覆盖草稿：${String(error)}`)
    }
  }
  function restore() {
    if (blocked()) return
    try {
      const json = sessionStorage.getItem(KEY)
      if (!json) {
        setNotice('没有已保存的草稿')
        return
      }
      restoreSnapshot(editor, json)
      setNotice('已恢复 Lexical JSON 文档（未注入 HTML）')
    } catch (error) {
      setNotice(`恢复失败，请保留当前内容并检查草稿：${String(error)}`)
    }
  }
  return (
    <>
      <OnChangePlugin ignoreSelectionChange onChange={onChange} />
      <div className="demo-controls">
        <button
          type="button"
          onClick={() => {
            if (!blocked()) {
              resetDocument(editor)
              setNotice('已重置本文，未清空Storage')
            }
          }}
        >
          重置本文
        </button>
        {level !== 'basic' && (
          <>
            <button type="button" onClick={save}>
              保存 JSON 草稿
            </button>
            <button type="button" onClick={restore}>
              恢复 JSON 草稿
            </button>
          </>
        )}
        {level === 'advanced' && (
          <>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!blocked()) {
                  editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')
                  setNotice('已派发加粗命令；空选区只改变后续输入格式')
                }
              }}
            >
              加粗所选文字
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!blocked()) editor.dispatchCommand(UNDO_COMMAND, undefined)
              }}
            >
              撤销
            </button>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                if (!blocked()) editor.dispatchCommand(REDO_COMMAND, undefined)
              }}
            >
              重做
            </button>
          </>
        )}
      </div>
      <p>
        文档文本长度：<output data-testid="lexical-length">{documentText.length}</output>
      </p>
      <p role="status" aria-label="Lexical操作结果">
        {notice}
      </p>
      <p>组合输入期间不保存/恢复/重置/派发格式或历史命令；真实系统输入法仍需人工验收。</p>
    </>
  )
}
export default function LexicalExample({ level }: Props) {
  // 0.52 legacy Composer reads configuration once; key controls a fresh document instance.
  const config = useMemo(
    () => ({
      namespace: 'reactloom-library-lab-E03',
      theme: { text: { bold: 'lexical-example-bold' }, paragraph: 'lexical-example-paragraph' },
      onError(error: Error) {
        throw error
      },
    }),
    [],
  )
  return (
    <section aria-label="Lexical 真实编辑器" className="lexical-example">
      <h2>
        {level === 'basic'
          ? 'EditorState 与文本观察'
          : level === 'business'
            ? '结构化 JSON 草稿协议'
            : '选区格式与撤销历史'}
      </h2>
      <p>真实 lexical / @lexical/react 0.52.0；本地编辑，无服务器或上传。</p>
      <LexicalComposer key={level} initialConfig={config}>
        <div style={{ position: 'relative', marginBlock: 16 }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-label="Lexical 文档编辑区"
                style={{
                  border: '1px solid #bbcabc',
                  borderRadius: 8,
                  padding: 14,
                  minHeight: 140,
                }}
              />
            }
            placeholder={
              <p style={{ position: 'absolute', top: 14, left: 14, pointerEvents: 'none' }}>
                输入新闻摘要…
              </p>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <Actions level={level} />
      </LexicalComposer>
    </section>
  )
}
