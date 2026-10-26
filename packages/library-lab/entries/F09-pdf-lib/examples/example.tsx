import {useEffect,useRef,useState} from 'react';
import {PDFDocument} from 'pdf-lib';
import {combineNotes,createNote,stampOwnPdf} from './document';

type Level='basic'|'business'|'advanced';
export default function PdfLibExample({level}:{level:Level}){
  const [state,setState]=useState('尚未生成');
  const [download,setDownload]=useState('');
  const [pages,setPages]=useState(0);
  const [busy,setBusy]=useState(false);
  const url=useRef('');const epoch=useRef(0);
  useEffect(()=>()=>{epoch.current++;if(url.current)URL.revokeObjectURL(url.current);},[]);
  async function run(input?:File){
    const n=++epoch.current;setBusy(true);setState('正在处理本地PDF');
    try{
      let bytes:Uint8Array;
      if(level==='basic')bytes=await createNote('Getting started');
      else if(level==='business')bytes=await combineNotes();
      else if(input){
        if(input.size>2*1024*1024)throw new Error('文件超过2MiB');
        bytes=await stampOwnPdf(new Uint8Array(await input.arrayBuffer()));
      }else{
        bytes=await stampOwnPdf(await createNote('Safe local annotation'));
      }
      const parsed=await PDFDocument.load(bytes);
      if(epoch.current!==n)return;
      if(url.current)URL.revokeObjectURL(url.current);
      url.current=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/pdf'}));
      setDownload(url.current);setPages(parsed.getPageCount());
      setState('已生成 '+bytes.byteLength+' 字节；真实PDF页数 '+parsed.getPageCount());
    }catch(error){if(epoch.current===n){setState('处理失败：'+String(error));setPages(0);setDownload('');if(url.current){URL.revokeObjectURL(url.current);url.current='';}}}
    finally{if(epoch.current===n)setBusy(false);}
  }
  return <section aria-label="pdf-lib 本地PDF实验"><h2>{level==='basic'?'创建PDF':level==='business'?'合并两份原创PDF':'加载、校验并标注'}</h2>
    <p>真正调用 PDFDocument.create/load/copyPages/save，仅处理本地生成或主动选择的文件。默认 Helvetica 只适合拉丁文本。</p>
    <div className="demo-controls"><button type="button" disabled={busy} onClick={()=>void run()}>{busy?'处理中…':'执行PDF操作'}</button>
    {level==='advanced'&&<label>选择本地PDF (≤2MiB)<input type="file" accept=".pdf,application/pdf" disabled={busy} onChange={e=>{const file=e.currentTarget.files?.[0];if(file)void run(file);e.currentTarget.value='';}}/></label>}
    </div><p role="status">{state}</p>{pages>0&&<p>真实页数：{pages}</p>}
    {download&&<a href={download} download="reactloom-pdf-lib.pdf">下载刚刚生成的PDF</a>}
    {level==='advanced'&&<p>文件头验证不能取代恶意PDF沙箱审查；产品中应对更大文件、附件和加密另加安全限制。</p>}
  </section>;
}
