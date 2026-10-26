import {useEffect, useState} from 'react'
import {EditorContent, useEditor} from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

type Level = 'basic' | 'business' | 'advanced'
const KEY = 'reactloom.lab.E01.tiptap.draft.v1'
const MAX_CHARS = 20_000
const START = '<h2>工程笔记</h2><p>编辑 <strong>Tiptap</strong> 示例，观察结构化文档。</p>'

export default function TiptapExample({level}: {level: Level}) {
  const [notice, setNotice] = useState('仅在当前浏览器本地处理内容。')
  const [chars, setChars] = useState(0)
  const [jsonPreview, setJsonPreview] = useState('')
  const editor = useEditor({
    extensions: [StarterKit],
    content: START,
    immediatelyRender: false,
    // React 组件卸载时由 useEditor 销毁 editor；不要跨页面缓存同一个实例。
  })

  useEffect(() => {
    if (!editor) return
    const update = () => setChars(editor.getText().length)
    editor.on('update', update)
    update()
    return () => editor.off('update', update)
  }, [editor])

  function save() {
    if (!editor) return
    const raw = JSON.stringify(editor.getJSON())
    if (raw.length > MAX_CHARS) {
      setNotice(`草稿有 ${raw.length} 字符，超过本实验 ${MAX_CHARS} 字符限制。`)
      return
    }
    try {
      sessionStorage.setItem(KEY, raw)
      setNotice('已保存 JSON 草稿到本标签页 sessionStorage；没有请求外网。')
    } catch (error) {
      setNotice(`浏览器存储不可用：${String(error)}`)
    }
  }

  function restore() {
    if (!editor) return
    try {
      const raw = sessionStorage.getItem(KEY)
      if (!raw) {setNotice('没有保存过草稿。'); return}
      if (raw.length > MAX_CHARS) throw new Error('草稿超过最大可恢复长度')
      const parsed: unknown = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || (parsed as {type?: string}).type !== 'doc') {
        throw new Error('不是合法的 Tiptap 文档顶层结构')
      }
      editor.commands.setContent(parsed as Parameters<typeof editor.commands.setContent>[0])
      setNotice('已恢复文档；没有将JSON当HTML插入页面。')
    } catch (error) {setNotice(`草稿恢复失败，当前文档未被主动清空：${String(error)}`)}
  }

  function exportJson() {
    if (!editor) return
    const raw = JSON.stringify(editor.getJSON(), null, 2)
    setJsonPreview(raw.slice(0, 2400))
    setNotice(raw.length > 2400 ? '结构预览已截断；真实输出未上传。' : '显示完整结构预览。')
  }

  return <section aria-label="Tiptap 编辑器实验">
    <h2>{level === 'basic' ? '入门：Headless 富文本' : level === 'business' ? '业务：结构化草稿' : '进阶：JSON 边界与恢复'}</h2>
    <p>真实 @tiptap/react + StarterKit。仅加载本示例时创建编辑器；字体、菜单与持久化由产品自行设计。</p>
    <div className="demo-controls" role="toolbar" aria-label="编辑格式">
      <button type="button" disabled={!editor} onClick={() => editor?.chain().focus().toggleBold().run()}>加粗</button>
      <button type="button" disabled={!editor} onClick={() => editor?.chain().focus().toggleItalic().run()}>斜体</button>
      <button type="button" disabled={!editor} onClick={() => editor?.chain().focus().toggleBulletList().run()}>列表</button>
      <button type="button" disabled={!editor} onClick={() => editor?.chain().focus().undo().run()}>撤销</button>
    </div>
    <div style={{border:'1px solid #b6cbbd',borderRadius:8,minHeight:160,padding:14}}>
      <EditorContent editor={editor} aria-label="富文本正文"/>
    </div>
    <p>纯文本字符数：<output data-testid="tiptap-count">{chars}</output></p>
    {level !== 'basic' && <div className="demo-controls">
      <button type="button" disabled={!editor} onClick={save}>保存草稿</button>
      <button type="button" disabled={!editor} onClick={restore}>恢复草稿</button>
    </div>}
    {level === 'advanced' && <div className="demo-controls">
      <button type="button" disabled={!editor} onClick={exportJson}>查看 JSON 结构</button>
      <button type="button" disabled={!editor} onClick={() => {editor?.commands.setContent(START);setNotice('仅重置当前编辑器内容。')}}>重置示例</button>
    </div>}
    {level === 'advanced' && <pre style={{maxHeight:240,overflow:'auto'}}>{jsonPreview || '尚未导出结构'}</pre>}
    <p role="status">{notice}</p>
    <small>不要把未净化的 HTML 渲染到另一个宿主；生产端需版本化校验 JSON Schema、输入尺寸和服务端授权。</small>
  </section>
}
