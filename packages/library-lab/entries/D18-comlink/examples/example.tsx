import {useEffect,useRef,useState} from 'react';
import * as Comlink from 'comlink';
import type {WorkerAPI} from './worker';
type Props={level:'basic'|'business'|'advanced'};
type Session={worker:Worker;remote:Comlink.Remote<WorkerAPI>;controller:AbortController};
export default function ComlinkWorkshop({level}:Props){
 const [result,setResult]=useState('Worker 尚未启动');
 const [working,setWorking]=useState(false);
 const session=useRef<Session|null>(null);
 const epoch=useRef(0);
 const dispose=()=>{const active=session.current;session.current=null;if(!active)return;
  active.controller.abort();void active.remote[Comlink.releaseProxy]();active.worker.terminate();};
 useEffect(()=>()=>{epoch.current++;dispose();},[]);
 async function execute(){
  dispose();const current=++epoch.current;
  setWorking(true);setResult('启动单独的模块 Worker…');
  const worker=new Worker(new URL('./worker.ts',import.meta.url),{type:'module'});
  const remote=Comlink.wrap<WorkerAPI>(worker);
  const controller=new AbortController();
  session.current={worker,remote,controller};
  try{
   let task:Promise<unknown>;
   if(level==='basic'){
    task=remote.summarize(['react','rss','react','worker','rss','react']);
   } else if(level==='business'){
    task=remote.summarize(Array.from({length:4000},(_,index)=>index%2===0?'tech':'business'));
   } else {
    // Explicit transferable: sender's ArrayBuffer becomes detached.
    const bytes=new Uint8Array([5,10,15,20,25]);
    task=remote.sumBytes(Comlink.transfer(bytes,[bytes.buffer])).then(async sum=>{
     const progress:number[]=[];
     const done=await remote.progress(5,Comlink.proxy((step:number)=>{
      if(current===epoch.current)setResult('Worker 已处理 '+step+'/5');
      progress.push(step);
     }));
     return {sum,detachedBytesOnMainThread:bytes.byteLength,progressEvents:progress,done};
    });
   }
   const cancelled=new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',
    ()=>reject(new DOMException('任务已取消','AbortError')),{once:true}));
   const answer=await Promise.race([task,cancelled]);
   if(current===epoch.current)setResult(JSON.stringify(answer,null,2));
  }catch(error){if(current===epoch.current)setResult('Worker失败：'+String(error));}
  finally{if(current===epoch.current){dispose();setWorking(false);}}
 }
 function cancel(){epoch.current++;dispose();setWorking(false);setResult('Worker 已终止，旧异步结果不会回写');}
 return <section aria-label="Comlink真实Worker示例">
  <h2>{level==='basic'?'Worker RPC 最小例子':level==='business'?'4000项分析任务':'Transferable、回调与取消'}</h2>
  <p>通过真实 Comlink.wrap/expose 在模块 Worker 执行任务，不在主线程伪模拟计算。</p>
  <div className="demo-controls">
   <button type="button" disabled={working} onClick={()=>void execute()}>启动 Worker 任务</button>
   <button type="button" disabled={!working} onClick={cancel}>终止 Worker</button>
  </div>
  <output className="demo-output" aria-live="polite" data-testid="comlink-output">{result}</output>
  <p>切换 Tab/示例时调用 releaseProxy 和 worker.terminate；不能将终止等同远端 Promise 自动 resolve。</p>
 </section>;
}
