import {useEffect, useMemo, useState, isValidElement, type ReactNode} from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import HighlightCode from './highlight-code';
import {extractDocumentHeadings,resolveDocumentUrl} from '../lib/document-utils.mjs';

type Props={entryId:string; kind:'guide'|'agent'; available:boolean};

function CopyOriginal({text}:{text:string}) {
  const [notice,setNotice]=useState('');
  const copy=async()=>{
    try {await navigator.clipboard.writeText(text);setNotice('已复制完整原文');}
    catch {setNotice('复制失败，请手动选择文本');}
  };
  return <><button type="button" onClick={()=>void copy()}>复制原文</button><span role="status">{notice}</span></>;
}

function CodeBlock({children}:{children?:ReactNode}) {
  if (!isValidElement<{className?:string;children?:ReactNode}>(children)) {
    return <pre><code>{children}</code></pre>;
  }
  const language=children.props.className?.match(/language-([\w+-]+)/u)?.[1]??'';
  const content=children.props.children;
  const code=typeof content==='string'?content:String(content??'');
  return <HighlightCode code={code.replace(/\n$/u,'')} language={language}/>;
}

export default function Document({entryId,kind,available}:Props){
  const [text,setText]=useState('');const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [retry,setRetry]=useState(0);
  const url=`${import.meta.env.BASE_URL}raw/${entryId}/${kind}.md`;
  const toc=useMemo(()=>extractDocumentHeadings(text),[text]);
  useEffect(()=>{
    const controller=new AbortController();
    setText('');setError('');setLoading(true);
    if(!available){setLoading(false);return()=>controller.abort();}
    fetch(url,{signal:controller.signal}).then(async response=>{
      if(!response.ok || response.headers.get('content-type')?.includes('text/html'))
        throw new Error('Markdown 原文未生成，或服务器错误地返回了 SPA 页面');
      return response.text();
    }).then(body=>{if(!controller.signal.aborted){setText(body);setLoading(false);}})
      .catch(caught=>{if(!controller.signal.aborted){setError(String(caught));setLoading(false);}});
    return()=>controller.abort();
  },[url,available,retry]);
  if(!available)return <div className="empty"><h2>这份说明正在接入</h2><p>尚未导入的资料不会使用占位文案冒充完整内容。</p></div>;
  if(loading)return <p role="status">正在按需读取文档…</p>;
  if(error)return <section role="alert"><p>{error}</p><button type="button" onClick={()=>setRetry(n=>n+1)}>重新读取文档</button></section>;
  const urlTransform=(value:string)=>resolveDocumentUrl(value,entryId,import.meta.env.BASE_URL);
  const assetPrefix=`${import.meta.env.BASE_URL}raw/${entryId}/assets/`;
  return <>
    <div className="document-tools"><a href={url} target="_blank" rel="noopener noreferrer">读取 Markdown 原文 ↗</a><CopyOriginal text={text}/></div>
    <div className="document-layout"><article className="prose">
      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} skipHtml urlTransform={urlTransform}
        components={{
          pre:({children})=><CodeBlock>{children}</CodeBlock>,
          a:({href,children})=><a href={href} rel="noopener noreferrer" target={href?.startsWith('#')?undefined:'_blank'}>{children}</a>,
          img:({src,alt})=>src?.startsWith(assetPrefix)&&/\.(?:png|jpe?g|webp|gif)$/iu.test(src.split('#')[0])?
            <img src={src} alt={alt??''} loading="lazy" decoding="async" referrerPolicy="no-referrer"/>:
            <span className="notice">[外部或未审核的图片未自动加载：{alt||'图片'}]</span>,
          h1:({node,children})=><h1 id={`section-${node?.position?.start.line}`}>{children}</h1>,
          h2:({node,children})=><h2 id={`section-${node?.position?.start.line}`}>{children}</h2>,
          h3:({node,children})=><h3 id={`section-${node?.position?.start.line}`}>{children}</h3>,
        }}>{text}</Markdown>
    </article>{toc.length>2&&<nav className="document-toc" aria-label="当前文档目录"><strong>本页目录</strong>
      <ol>{toc.filter(h=>h.depth>1).map(item=><li key={item.id} data-depth={item.depth}>
        <a href={`#${item.id}`}>{item.title}</a>
      </li>)}</ol></nav>}</div>
  </>;
}
