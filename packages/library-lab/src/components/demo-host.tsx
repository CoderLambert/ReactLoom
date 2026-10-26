import {lazy,Suspense,useMemo,useState,useEffect} from 'react';
import {ErrorBoundary} from 'react-error-boundary';
import type {Entry,Demo,SourceFile} from '../lib/types';
import {demoLoaders} from '../generated/loaders';
function SourceViewer({entryId,demo}:{entryId:string;demo:Demo}){
 const [files,setFiles]=useState<SourceFile[]>([]);const [error,setError]=useState('');const [selected,setSelected]=useState('');
 useEffect(()=>{const controller=new AbortController();setFiles([]);setSelected('');setError('');fetch(`${import.meta.env.BASE_URL}raw/${entryId}/sources.json`,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('无法读取源码清单');return r.json();}).then((all:SourceFile[])=>{const relevant=all.filter(f=>demo.sourceFiles.includes(f.path));setFiles(relevant);setSelected(relevant[0]?.path??'');}).catch(e=>{if(!controller.signal.aborted)setError(String(e));});return()=>controller.abort();},[entryId,demo]);
 const file=files.find(f=>f.path===selected);return <section className="source-viewer"><h3>运行源码</h3><p>以下内容从实际示例文件生成，并附 SHA-256；不是另写的展示代码。</p>{error?<p role="alert">{error}</p>:<><label>文件 <select value={selected} onChange={e=>setSelected(e.target.value)}>{files.map(f=><option key={f.path}>{f.path}</option>)}</select></label>{file&&<><pre><code>{file.content}</code></pre><small className="hash">SHA-256 {file.sha256}</small></>}</>}</section>;
}
export default function DemoHost({entry,demoId,onSelect}:{entry:Entry;demoId?:string;onSelect:(id:string)=>void}){
 const demo=entry.demos.find(d=>d.demoId===demoId)??entry.demos[0];
 const [started,setStarted]=useState(false);const [reset,setReset]=useState(0);
 const key=`${entry.entryId}/${demo?.demoId??''}`;
 const loader=demoLoaders[key];
 const Component=useMemo(()=>loader?lazy(loader):null,[loader]);
 useEffect(()=>{setStarted(false);setReset(0);},[key]);
 if(!demo)return <div className="empty"><h2>真实示例正在接入</h2><p>可以先阅读文档与 Agent 指南。当前条目未标记为已完成，也不会用模拟画面代替目标库。</p></div>;
 return <><div className="demo-toolbar"><label>学习场景 <select value={demo.demoId} onChange={e=>onSelect(e.target.value)}>{entry.demos.map(d=><option key={d.demoId} value={d.demoId}>{({basic:'入门',business:'业务',advanced:'边界'})[d.level]} · {d.title}</option>)}</select></label><span className="badge">{demo.executionKind}</span></div><p>{demo.description}</p><div className="install"><span>安装依赖</span><code>pnpm add {entry.packages.map(p=>`${p.name}${p.version?`@${p.version}`:''}`).join(' ')}</code></div><div className="notice">示例源码已接入不等于真实运行验证通过。请核对页面上方的构建、SDK 与浏览器状态。</div><div className="demo-stage">{Component&&demo.executionKind==='react'?started?<ErrorBoundary key={`${key}:${reset}`} fallbackRender={({error,resetErrorBoundary})=><div role="alert"><h3>这个示例加载失败</h3><p>{String(error)}</p><button type="button" onClick={resetErrorBoundary}>重试</button></div>}><Suspense fallback={<p role="status">正在加载当前示例…</p>}><Component level={demo.level}/></Suspense></ErrorBoundary>:<div className="start-demo"><span className="play-symbol" aria-hidden="true">▷</span><h3>按需启动，不占用其他页面资源</h3><button className="primary" type="button" onClick={()=>setStarted(true)}>运行当前示例</button></div>:<p>此运行类型尚未接线，先查阅源码和复现命令。不会在浏览器内执行任意 shell。</p>}</div>{started&&<div className="demo-actions"><button type="button" onClick={()=>setReset(n=>n+1)}>重置此示例</button><button type="button" onClick={()=>setStarted(false)}>停止并卸载</button></div>}<SourceViewer entryId={entry.entryId} demo={demo}/></>;
}
