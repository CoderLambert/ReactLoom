import {useEffect,useState} from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {safeLink} from '../lib/catalog.mjs';
function Copy({text}:{text:string}){const [notice,setNotice]=useState('');return <><button type="button" onClick={()=>{if(!navigator.clipboard){setNotice('当前环境不支持剪贴板，请手动选择');return;}navigator.clipboard.writeText(text).then(()=>setNotice('已复制')).catch(()=>setNotice('复制失败，请手动选择'));}}>复制原文</button><span role="status">{notice}</span></>;}
export default function Document({entryId,kind,available}:{entryId:string;kind:'guide'|'agent';available:boolean}){
 const [text,setText]=useState('');const [error,setError]=useState('');const [loading,setLoading]=useState(true);
 const url=`${import.meta.env.BASE_URL}raw/${entryId}/${kind}.md`;
 useEffect(()=>{const controller=new AbortController();setText('');setError('');setLoading(true);if(!available){setLoading(false);return()=>controller.abort();}fetch(url,{signal:controller.signal}).then(r=>{if(!r.ok||r.headers.get('content-type')?.includes('text/html'))throw new Error('原文不存在或服务器错误地返回了 SPA 页面');return r.text();}).then(data=>{setText(data);setLoading(false);}).catch(e=>{if(!controller.signal.aborted){setError(String(e));setLoading(false);}});return()=>controller.abort();},[url,available]);
 if(!available)return <div className="empty"><h2>这份说明正在接入</h2><p>尚未导入的原始资料不会被占位内容冒充。本条目保留在开发队列中。</p></div>;
 if(loading)return <p role="status">正在按需读取文档…</p>;
 if(error)return <p role="alert">{error}</p>;
 return <><div className="document-tools"><a href={url} target="_blank" rel="noreferrer">读取 Markdown 原文 ↗</a><Copy text={text}/></div><article className="prose"><Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]} skipHtml urlTransform={safeLink} components={{a:({href,children})=><a href={href} target={href?.startsWith('#')?undefined:'_blank'} rel="noopener noreferrer">{children}</a>,img:({alt})=><span className="notice">[图片未自动加载：{alt||'外部资源'}]</span>,h2:({node,children})=><h2 id={`section-${node?.position?.start.line}`}>{children}</h2>,h3:({node,children})=><h3 id={`section-${node?.position?.start.line}`}>{children}</h3>}}>{text}</Markdown></article></>;
}
