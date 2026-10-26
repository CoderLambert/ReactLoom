import {useEffect, useMemo, useRef, useState} from 'react'
import {Document, Page, pdfjs} from 'react-pdf'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import 'react-pdf/dist/Page/TextLayer.css'
import {createSamplePdf} from './fixture'

type Level = 'basic' | 'business' | 'advanced'
// Worker binding must be in the SAME module as the <Document>/<Page> render path.
// PLATFORM must pin a pdfjs-dist version matching react-pdf@11's embedded PDF.js API.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
const MAX_BYTES = 3 * 1024 * 1024

export default function ReactPdfExample({level}: {level: Level}) {
  const builtIn = useMemo(() => createSamplePdf(), [])
  const [bytes,setBytes] = useState<Uint8Array>(builtIn)
  const [page,setPage] = useState(1)
  const [pageCount,setPageCount] = useState(0)
  const [zoom,setZoom] = useState(1)
  const [documentGeneration,setGeneration] = useState(0)
  const [notice,setNotice] = useState('原始PDF由本地源码生成，不请求CDN/上传服务。')
  const readTurn=useRef(0)
  useEffect(()=>()=>{readTurn.current++},[])

  async function onFile(file?: File){
    if(!file)return
    if(file.size>MAX_BYTES){setNotice('文件超过3MiB，拒绝读取');return}
    if(!file.name.toLowerCase().endsWith('.pdf')){setNotice('这里只处理 .pdf 文件名，内容仍需由PDF解析器校验');return}
    const turn=++readTurn.current
    setNotice('正在读取本地文件…')
    try{
      const content = new Uint8Array(await file.arrayBuffer())
      if(turn!==readTurn.current)return
      setBytes(content);setPage(1);setPageCount(0);setGeneration(n=>n+1)
    }catch(error){if(turn===readTurn.current)setNotice(`读取失败：${String(error)}`)}
  }
  function reset(){
    readTurn.current++;setBytes(builtIn);setPage(1);setPageCount(0);setZoom(1);setGeneration(n=>n+1)
    setNotice('已恢复原创PDF，离开该Tab将卸载Document')
  }
  return <section aria-label="react-pdf 文档预览">
    <h2>{level==='basic'?'入门：React PDF组件':level==='business'?'业务：分页与文字层':'进阶：本地文件与损坏文档'}</h2>
    <p>真正调用 react-pdf 的 Document/Page，使用与依赖兼容的本地 worker chunk；不使用假截图。</p>
    {level!=='basic'&&<div className="demo-controls">
      <button type="button" disabled={page<=1} onClick={()=>setPage(n=>Math.max(1,n-1))}>上一页</button>
      <span role="status">第 {page} / {pageCount||'…'} 页</span>
      <button type="button" disabled={!pageCount||page>=pageCount} onClick={()=>setPage(n=>Math.min(pageCount,n+1))}>下一页</button>
    </div>}
    {level==='advanced'&&<div className="demo-controls">
      <label>缩放<select value={zoom} onChange={e=>setZoom(Number(e.target.value))}>
        {[0.75,1,1.25,1.5].map(v=><option key={v} value={v}>{Math.round(v*100)}%</option>)}
      </select></label>
      <label>打开本地 PDF <input type="file" accept=".pdf,application/pdf" onChange={e=>{const input=e.currentTarget;void onFile(input.files?.[0]);input.value=''}} /></label>
      <button type="button" onClick={()=>{readTurn.current++;setBytes(new Uint8Array([1,2,3,4,5]));setPageCount(0);setGeneration(n=>n+1)}}>载入损坏字节</button>
      <button type="button" onClick={reset}>恢复样例</button>
    </div>}
    <div style={{overflow:'auto',maxWidth:'100%',background:'#fff',padding:12,border:'1px solid #d5dfd5',borderRadius:9}}>
      <Document key={documentGeneration} file={bytes} loading={<p role="status">正在解析PDF…</p>}
        onLoadSuccess={result=>{setPageCount(result.numPages);setNotice(`解析成功，共${result.numPages}页`)}}
        onLoadError={error=>{setPageCount(0);setNotice(`PDF解析失败：${error.message}`)}}
        error={<p role="alert">PDF 无法解析。可恢复原创文档继续演示。</p>}>
        <Page pageNumber={page} scale={zoom} renderTextLayer={level!=='basic'} renderAnnotationLayer={false}
          loading={<p role="status">正在渲染页面…</p>} />
      </Document>
    </div>
    <p role="status" data-testid="react-pdf-status">{notice}</p>
    <small>文件选择不是服务端上传。对于复杂字体/CMaps/WASM，需在业务打包时明确资源路径、跨域/CSP、渲染预算和 Worker 版本。</small>
  </section>
}
