import {useEffect, useState} from 'react'
import {useCreateBlockNote} from '@blocknote/react'
import {BlockNoteView} from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import '@blocknote/core/fonts/inter.css'

type Level = 'basic' | 'business' | 'advanced'
const KEY = 'reactloom.lab.E02.blocknote.blocks.v1'
const MAX_SNAPSHOT = 60_000

export default function BlockNoteExample({level}: {level: Level}) {
  const editor = useCreateBlockNote({initialContent:[
    {type:'heading',props:{level:2},content:'阅读笔记'},
    {type:'paragraph',content:'在这里编辑本地块文档，并使用列表和斜杠菜单。'},
  ]})
  const [count,setCount] = useState(editor.document.length)
  const [notice,setNotice] = useState('这里只保留本地草稿，不执行文件上传。')

  useEffect(() => {
    // onChange 返回取消订阅函数，离开 Tab 时解除外部观察者。
    return editor.onChange(() => setCount(editor.document.length))
  },[editor])

  function save() {
    const raw = JSON.stringify(editor.document)
    if(raw.length > MAX_SNAPSHOT){setNotice('草稿超过 60KB 限额，未保存');return}
    try{sessionStorage.setItem(KEY,raw);setNotice('块 JSON 已保存到本标签页。')}
    catch(error){setNotice(`存储失败：${String(error)}`)}
  }
  function restore(){
    const raw = sessionStorage.getItem(KEY)
    if(!raw){setNotice('没有本地草稿');return}
    if(raw.length > MAX_SNAPSHOT){setNotice('已有草稿超过限额，已拒绝');return}
    try{
      const blocks: unknown = JSON.parse(raw)
      if(!Array.isArray(blocks)||blocks.length===0||blocks.length>100||
        blocks.some(item=>!item||typeof item!=='object'||typeof item.type!=='string')) {
        throw new Error('块结构或数量不合法')
      }
      // 传给库自己的 schema 验证；失败不会在这里覆盖正确的已存文档。
      editor.replaceBlocks(editor.document,blocks as Parameters<typeof editor.replaceBlocks>[1])
      setNotice('恢复完成；只替换本例文档块。')
    }catch(error){setNotice(`无法恢复该版本草稿：${String(error)}`)}
  }
  function insertReview(){
    const previous = editor.document[editor.document.length-1]
    if(!previous) return
    editor.insertBlocks([{type:'paragraph',content:'待办：检查实际项目的内容授权与输出安全。'}],previous,'after')
    setNotice('真实 insertBlocks 已追加一段。')
  }
  return <section aria-label="BlockNote 块编辑实验">
    <h2>{level==='basic'?'入门：开箱块编辑':level==='business'?'业务：块文档会话草稿':'进阶：结构变更与回退'}</h2>
    <p>真实 BlockNote React/Mantine。每个挂载拥有自己的实例，关闭示例由 React 与官方 hook 回收实例。</p>
    <div style={{border:'1px solid #d7dfd3',borderRadius:8,padding:'14px 5px',background:'#fff'}}>
      <BlockNoteView editor={editor} />
    </div>
    <p>当前顶层块数：<output data-testid="blocknote-count">{count}</output></p>
    {level!=='basic'&&<div className="demo-controls">
      <button type="button" onClick={save}>保存会话草稿</button>
      <button type="button" onClick={restore}>恢复会话草稿</button>
    </div>}
    {level==='advanced'&&<div className="demo-controls">
      <button type="button" onClick={insertReview}>插入审核段落块</button>
      <button type="button" onClick={()=>{try{sessionStorage.removeItem(KEY);setNotice('已清除本例草稿')}catch(error){setNotice(String(error))}}}>清除本例草稿</button>
    </div>}
    <p role="status">{notice}</p>
    {level==='advanced'&&<small>此实验不引入商业 XL 扩展。变更回调、IME、Mantine全局样式和跨文档schema迁移必须在真实浏览器验收。</small>}
  </section>
}
